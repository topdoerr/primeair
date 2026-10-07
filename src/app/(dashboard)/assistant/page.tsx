import { AssistantView } from '@/components/views/AssistantView';
import {
  getAssistant,
  listPhoneNumbers,
  vapiConfigured,
  type VapiAssistant,
  type VapiPhoneNumber,
} from '@/lib/vapi';

export const dynamic = 'force-dynamic';

export default async function AssistantPage() {
  const configured = vapiConfigured();

  let assistant: VapiAssistant | null = null;
  let phone: VapiPhoneNumber | null = null;
  let error: string | null = null;

  if (configured) {
    try {
      assistant = await getAssistant();
      const numbers = await listPhoneNumbers().catch(() => []);
      phone = assistant
        ? numbers.find((n) => n.assistantId === assistant!.id) ?? numbers[0] ?? null
        : null;
    } catch (err) {
      error = (err as Error).message;
    }
  }

  return (
    <AssistantView configured={configured} assistant={assistant} phone={phone} error={error} />
  );
}
