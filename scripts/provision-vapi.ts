/**
 * Provision (create or update) the "Prime Air AWB Status" assistant on Vapi,
 * managed through the Vapi MCP server (https://mcp.vapi.ai/sse).
 *
 * Usage:
 *   VAPI_API_KEY=... APP_BASE_URL=https://your-app.vercel.app \
 *     npm run vapi:provision
 *
 * Reads env: VAPI_API_KEY (required), VAPI_MCP_URL, APP_BASE_URL,
 *            VAPI_WEBHOOK_SECRET, VAPI_ASSISTANT_ID (optional, to force update).
 *
 * Prints the assistant id — copy it into VAPI_ASSISTANT_ID in .env.local.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { ASSISTANT_NAME, buildAssistantPayload } from './assistant-config';

const API_KEY = process.env.VAPI_API_KEY;
const MCP_URL = process.env.VAPI_MCP_URL || 'https://mcp.vapi.ai/sse';
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
const WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET;
const FORCE_ID = process.env.VAPI_ASSISTANT_ID;

if (!API_KEY) {
  console.error('ERROR: VAPI_API_KEY is not set.');
  process.exit(1);
}
if (APP_BASE_URL.includes('localhost')) {
  console.warn(
    'WARNING: APP_BASE_URL is localhost. Vapi cannot reach localhost tool URLs.\n' +
      '         Deploy first (or use a tunnel) and re-run so lookup_awb/schedule_pickup work.',
  );
}

async function connect(): Promise<Client> {
  const headers = { Authorization: `Bearer ${API_KEY}` };
  const transport = new SSEClientTransport(new URL(MCP_URL), {
    requestInit: { headers },
    eventSourceInit: {
      fetch: (input: any, init?: any) =>
        fetch(input, { ...init, headers: { ...(init?.headers || {}), ...headers } }),
    },
  });
  const client = new Client({ name: 'prime-air-provisioner', version: '0.1.0' }, { capabilities: {} });
  await client.connect(transport);
  return client;
}

function parse<T>(res: any): T {
  const text = (res?.content || []).find((c: any) => c?.type === 'text')?.text;
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

async function tryTools<T>(client: Client, names: string[], args: Record<string, unknown>): Promise<T> {
  let lastErr: unknown;
  for (const name of names) {
    try {
      const res = await client.callTool({ name, arguments: args });
      if ((res as any).isError) throw new Error(`tool ${name} error`);
      return parse<T>(res);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`All tools failed [${names.join(', ')}]: ${(lastErr as Error)?.message}`);
}

async function main() {
  const client = await connect();
  try {
    // Print available tools for transparency.
    const tools = await client.listTools();
    console.log(
      'Vapi MCP tools available:',
      tools.tools.map((t) => t.name).join(', ') || '(none reported)',
    );

    const payload = buildAssistantPayload(APP_BASE_URL, WEBHOOK_SECRET);

    // Find existing assistant (by forced id or by name).
    let existingId = FORCE_ID || '';
    if (!existingId) {
      try {
        const list = await tryTools<any>(client, ['list_assistants', 'listAssistants'], {});
        const arr = Array.isArray(list) ? list : list.assistants ?? [];
        existingId = arr.find((a: any) => a.name === ASSISTANT_NAME)?.id ?? '';
      } catch {
        /* listing may not be supported; fall through to create */
      }
    }

    let result: any;
    if (existingId) {
      console.log(`Updating existing assistant ${existingId}…`);
      result = await tryTools<any>(client, ['update_assistant', 'updateAssistant'], {
        assistantId: existingId,
        id: existingId,
        ...payload,
      });
    } else {
      console.log('Creating assistant "Prime Air AWB Status"…');
      result = await tryTools<any>(client, ['create_assistant', 'createAssistant'], payload);
    }

    const id = result?.id || existingId;
    console.log('\n✅ Done.');
    console.log('Assistant id:', id);
    console.log('\nNext steps:');
    console.log(`  1. Put this in .env.local:   VAPI_ASSISTANT_ID=${id}`);
    console.log('  2. Attach a phone number to this assistant in the Vapi dashboard.');
    console.log(`  3. Confirm the tool URLs point at ${APP_BASE_URL}/api/awb-lookup and /api/pickup.`);
  } finally {
    await client.close().catch(() => {});
  }
}

main().catch((err) => {
  console.error('Provisioning failed:', err.message);
  process.exit(1);
});
