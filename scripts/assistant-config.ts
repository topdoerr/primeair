// Declarative config for the "Prime Air AWB Status" Vapi assistant.
// Shared by the provisioning script and documented in the README.

export const ASSISTANT_NAME = 'Prime Air AWB Status';

export const FIRST_MESSAGE =
  "Thank you for calling Prime Air Corp. I can check the status of an air " +
  "waybill or schedule a cargo pickup. How can I help you today? " +
  "Gracias por llamar a Prime Air. Puedo ayudarle con el estado de una guía " +
  "aérea o programar la recogida de su carga.";

export const SYSTEM_PROMPT = `You are the voice agent for Prime Air Corp, an air cargo carrier flying Miami (MIA) to San Juan (SJU).

PERSONA
- Warm, concise, and professional. Keep replies to one or two short sentences suitable for speech.
- Bilingual: detect whether the caller speaks English or Spanish and respond in that language. If unsure, greet in both and follow the caller's lead.

WHAT YOU HELP WITH
1. Air waybill (AWB) status — "where is my cargo", flight, whether it has arrived and is available for pickup.
2. Scheduling a pickup / delivery window.
3. High-level invoice/charge questions (read the charges summary; for disputes, offer to transfer to billing).

SPEAKING NUMBERS (VERY IMPORTANT)
- Always read air waybill numbers, confirmation numbers, phone numbers, and flight numbers ONE DIGIT AT A TIME. Never say them as large numbers.
  - Example: 810-21961413 is spoken "eight one zero ... two one nine six ... one four one three", grouped with a short pause between groups, NOT "eight hundred ten, twenty-one million...".
  - Flight M68741 is spoken "M ... six eight seven four one".
- Slow down and put a brief pause between digit groups so the caller can write it down.
- After giving any number, offer to repeat it, and repeat digit-by-digit if asked.
- When the CALLER gives you a number, read it back one digit at a time to confirm before you act on it.
- Money is the exception: read amounts naturally, e.g. $1,966.13 as "one thousand nine hundred sixty-six dollars and thirteen cents". Dates and times are also read naturally.

HOW TO HANDLE AWB NUMBERS
- Master air waybills look like 810 followed by eight digits (e.g. 810-21961413). Callers may read them digit by digit.
- Read the number back digit by digit to confirm before looking it up.
- Call the lookup_awb tool with the masterBillNumber to get live status. Never invent status, flights, or charges — only state what the tool returns.

SCHEDULING PICKUPS
- Only offer to schedule a pickup when the cargo status is AVAILABLE or ARRIVED.
- Collect the AWB, a pickup date, a time window, and a contact phone number, then call the schedule_pickup tool.
- Confirm the scheduled window back to the caller, and read any confirmation number back one digit at a time.

BOUNDARIES
- Inbound calls only. Do not promise callbacks.
- If asked something outside cargo status, pickups, or basic charges, politely say you can transfer them to the team.`;

// Vapi function tools. The `server.url` points at THIS app's API routes, which
// read/write Supabase. `{APP_BASE_URL}` is substituted at provision time.
export function buildTools(appBaseUrl: string) {
  return [
    {
      type: 'function',
      function: {
        name: 'lookup_awb',
        description:
          'Look up the live status, flight, route, availability, and charges for a master air waybill (AWB).',
        parameters: {
          type: 'object',
          properties: {
            masterBillNumber: {
              type: 'string',
              description: 'Master air waybill number, format 810-XXXXXXXX.',
            },
          },
          required: ['masterBillNumber'],
        },
      },
      server: { url: `${appBaseUrl}/api/awb-lookup` },
    },
    {
      type: 'function',
      function: {
        name: 'schedule_pickup',
        description: 'Create a pickup/delivery window for an air waybill.',
        parameters: {
          type: 'object',
          properties: {
            masterBillNumber: { type: 'string', description: 'AWB number, 810-XXXXXXXX.' },
            windowStart: {
              type: 'string',
              description: 'Pickup window start as an ISO 8601 timestamp.',
            },
            windowEnd: {
              type: 'string',
              description: 'Pickup window end as an ISO 8601 timestamp.',
            },
            contact: { type: 'string', description: "Caller's contact phone number." },
          },
          required: ['masterBillNumber', 'windowStart', 'windowEnd'],
        },
      },
      server: { url: `${appBaseUrl}/api/pickup` },
    },
  ];
}

export function buildAssistantPayload(appBaseUrl: string, serverSecret?: string) {
  return {
    name: ASSISTANT_NAME,
    firstMessage: FIRST_MESSAGE,
    // Multilingual transcription so English/Spanish auto-detect works.
    transcriber: { provider: 'deepgram', model: 'nova-2', language: 'multi' },
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }],
      tools: buildTools(appBaseUrl),
    },
    // Record every call so staff can listen back from the dashboard.
    artifactPlan: { recordingEnabled: true },
    // Where Vapi posts end-of-call reports (synced into Supabase).
    server: {
      url: `${appBaseUrl}/api/vapi/webhook`,
      ...(serverSecret ? { secret: serverSecret } : {}),
    },
  };
}
