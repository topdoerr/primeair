// Helpers for API routes that are called by Vapi as function/MCP tools.
//
// Vapi does NOT POST the tool arguments at the top level. It sends:
//   { message: { type: "tool-calls", toolCallList: [
//       { id, type: "function", function: { name, arguments } } ] } }
// (arguments may be an object or a JSON string), and expects:
//   { results: [ { toolCallId, result } ] }
//
// These helpers extract the calls and shape the response, while still
// supporting a plain { ...args } body for direct testing / curl.

export interface ExtractedToolCall {
  id: string;
  args: Record<string, unknown>;
}

export function extractToolCalls(body: any): ExtractedToolCall[] {
  const list =
    body?.message?.toolCallList ||
    body?.message?.toolCalls ||
    body?.message?.tool_calls ||
    body?.toolCallList ||
    body?.toolCalls ||
    [];
  if (!Array.isArray(list)) return [];
  return list.map((tc: any) => {
    let args = tc?.function?.arguments ?? tc?.arguments ?? {};
    if (typeof args === 'string') {
      try {
        args = JSON.parse(args);
      } catch {
        args = {};
      }
    }
    return {
      id: tc?.id || tc?.toolCallId || tc?.toolCall?.id || '',
      args: (args && typeof args === 'object' ? args : {}) as Record<string, unknown>,
    };
  });
}

export function isVapiToolRequest(body: any): boolean {
  return extractToolCalls(body).length > 0;
}

// Vapi tool-call response envelope.
export function toolResults(results: { toolCallId: string; result: string }[]) {
  return { results };
}
