// Prime Air — quote_shipment tool endpoint (Vapi function tool).
// Public function: it validates the Vapi tool-call envelope itself.
// Computes a MIA–SJU air-cargo estimate and persists each quote.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type Args = Record<string, unknown>;

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function bool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return ["yes", "true", "y", "si", "sí", "1"].includes(s);
}
function toCm(v: number | null, unit: unknown): number | null {
  if (v === null) return null;
  const u = String(unit ?? "cm").toLowerCase();
  return /in|inch|"|pulg/.test(u) ? v * 2.54 : v;
}
function toKg(v: number | null, unit: unknown): number | null {
  if (v === null) return null;
  const u = String(unit ?? "kg").toLowerCase();
  return /lb|pound|libra/.test(u) ? v * 0.45359 : v;
}
function round2(n: number): number { return Math.round(n * 100) / 100; }

// Extract tool calls from the Vapi envelope (or accept a plain body for testing).
function extractToolCalls(body: any): { id: string; args: Args }[] {
  const list =
    body?.message?.toolCallList ??
    body?.message?.toolCalls ??
    body?.toolCallList ??
    body?.toolCalls ??
    [];
  const out: { id: string; args: Args }[] = [];
  for (const c of list) {
    let a = c?.function?.arguments ?? c?.arguments ?? {};
    if (typeof a === "string") { try { a = JSON.parse(a); } catch { a = {}; } }
    out.push({ id: c?.id ?? c?.toolCallId ?? "call", args: a as Args });
  }
  if (out.length === 0 && body && typeof body === "object" && !body.message) {
    out.push({ id: "direct", args: body as Args });
  }
  return out;
}

const RATE_PER_KG = 1.55;
const FUEL_PCT = 0.16;
const DG_FEE = 150;
const TEMP_PER_KG = 0.25;
const MIN_CHARGE = 95;
const VOL_DIVISOR = 6000;

function computeQuote(a: Args) {
  const pieces = Math.max(1, Math.round(num(a.pieces) ?? 1));
  const dimUnit = a.dimensionUnit ?? a.dimensions_unit ?? "cm";
  const L = toCm(num(a.length), dimUnit);
  const W = toCm(num(a.width), dimUnit);
  const H = toCm(num(a.height), dimUnit);
  const wUnit = a.weightUnit ?? a.weight_unit ?? "kg";
  const actualKg = toKg(num(a.weight), wUnit) ?? 0;
  const dg = bool(a.dangerousGoods ?? a.dangerous_goods);
  const temp = bool(a.temperatureControlled ?? a.temperature_controlled);

  let volumetricKg = 0;
  if (L && W && H) volumetricKg = (L * W * H) / VOL_DIVISOR * pieces;
  const chargeable = Math.max(actualKg, volumetricKg);
  const weightCharge = chargeable * RATE_PER_KG;
  const fuel = weightCharge * FUEL_PCT;
  const dgFee = dg ? DG_FEE : 0;
  const tempFee = temp ? chargeable * TEMP_PER_KG : 0;
  let total = weightCharge + fuel + dgFee + tempFee;
  if (total < MIN_CHARGE) total = MIN_CHARGE;

  return {
    pieces,
    length_cm: L, width_cm: W, height_cm: H, dimension_unit: String(dimUnit),
    actual_weight_kg: actualKg ? round2(actualKg) : null, weight_unit: String(wUnit),
    dangerous_goods: dg, temperature_controlled: temp,
    temperature_range: (a.temperatureRange ?? a.temperature_range ?? null) as string | null,
    temperature_unit: (a.temperatureUnit ?? a.temperature_unit ?? null) as string | null,
    volumetric_weight_kg: round2(volumetricKg),
    chargeable_weight_kg: round2(chargeable),
    weight_charge: round2(weightCharge),
    fuel_handling: round2(fuel),
    dangerous_goods_fee: round2(dgFee),
    temperature_fee: round2(tempFee),
    estimated_total: round2(total),
  };
}

function makeReference(): string {
  const t = Date.now().toString(36).slice(-4).toUpperCase();
  const r = Math.floor(Math.random() * 36 * 36).toString(36).toUpperCase().padStart(2, "0");
  return `Q-${t}${r}`;
}

async function persist(row: Record<string, unknown>) {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return;
  try {
    await fetch(`${url}/rest/v1/quote_requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
  } catch (_e) { /* best-effort */ }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const calls = extractToolCalls(body);
  const results = [];
  for (const call of calls) {
    const a = call.args;
    const q = computeQuote(a);
    const reference = makeReference();
    const origin = (a.origin ?? a.originCity ?? "Miami") as string;
    const destination = (a.destination ?? a.destinationCity ?? "San Juan") as string;

    await persist({
      reference,
      origin, destination,
      ready_date: (a.readyDate ?? a.ready_date ?? null),
      commodity: (a.commodity ?? a.cargoType ?? a.cargo_type ?? null),
      ...q,
      currency: "USD",
      raw_arguments: a,
    });

    // Speakable result. Amounts given as plain numbers so the agent voices them
    // in the caller's language per its money rule (no "$" for the TTS to mis-read).
    const spoken =
      `Quote captured. Chargeable weight ${q.chargeable_weight_kg} kilograms. ` +
      `Estimated total ${q.estimated_total} dollars, US currency. ` +
      `Quote reference ${reference}. ` +
      `This is an approximate estimate; a formal written quote will follow.`;

    results.push({ toolCallId: call.id, result: spoken });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json" },
  });
});
