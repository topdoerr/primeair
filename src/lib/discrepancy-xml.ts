import { XMLParser } from 'fast-xml-parser';

// Parse a DiscrepancyReport XML payload into a display-friendly shape.
// Tolerant of missing fields — the raw XML is always shown as a fallback.

export interface ParsedDiscrepancy {
  messageId?: string;
  carrierCode?: string;
  invoiceNumber?: string;
  masterBillNumber?: string;
  flight?: string;
  commodity?: string;
  origin?: string;
  destination?: string;
  weightCharge?: number;
  otherCharges?: number;
  totalCollect?: number;
  currency?: string;
  reconStatus?: string;
  expected?: number;
  computed?: number;
  delta?: number;
  reason?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: true,
});

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

export function parseDiscrepancyXml(xml: string): ParsedDiscrepancy {
  try {
    const root = parser.parse(xml)?.DiscrepancyReport ?? {};
    const charges = root.Charges ?? {};
    const recon = root.Reconciliation ?? {};
    const route = root.Route ?? {};
    return {
      messageId: root.MessageId,
      carrierCode: root.CarrierCode,
      invoiceNumber: root.InvoiceNumber,
      masterBillNumber: root.MasterBillNumber,
      flight: root.Flight,
      commodity: root.Commodity,
      origin: route['@_origin'],
      destination: route['@_destination'],
      weightCharge: num(charges.WeightCharge),
      otherCharges: num(charges.OtherCharges),
      totalCollect: num(charges.TotalCollect),
      currency: charges['@_currency'],
      reconStatus: recon['@_status'],
      expected: num(recon.Expected),
      computed: num(recon.Computed),
      delta: num(recon.Delta),
      reason: recon.Reason,
    };
  } catch {
    return {};
  }
}
