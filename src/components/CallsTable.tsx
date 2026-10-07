'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Dot,
  Drawer,
  DrawerSection,
  EmptyState,
  Id,
  InlineNotice,
  IntentBadge,
  KeyValue,
  MonoBlock,
  Null,
  Num,
  PageHeader,
  SectionLabel,
  StatusBadge,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  Toolbar,
} from '@/components/ui';
import { BotIcon, ChevronRightIcon, PhoneIcon, PlayIcon, SyncIcon } from '@/components/icons';
import type { CallRecord } from '@/lib/types';

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

function fmtTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function fmtDuration(sec: number | null): string | null {
  if (sec == null) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

/** Speaker prefixes Vapi writes into plain-text transcripts. Presentational split only. */
const SPEAKER_RE = /^(AI|Assistant|User|Caller):\s*/;

function splitTranscript(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  let turns = 0;
  const nodes: ReactNode[] = lines.map((line, i) => {
    const match = SPEAKER_RE.exec(line);
    if (!match) return <div key={i}>{line}</div>;
    turns += 1;
    return (
      <div key={i}>
        <span className="font-medium text-ink">{match[1]}:</span> {line.slice(match[0].length)}
      </div>
    );
  });
  return { nodes, turns };
}

type SyncMessage = { text: string; tone: 'neutral' | 'danger' };

/* ------------------------------------------------------------------ */
/* Calls screen: header with sync control, table, transcript drawer    */
/* ------------------------------------------------------------------ */

export function CallsTable({ calls }: { calls: CallRecord[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<CallRecord | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<SyncMessage | null>(null);

  const syncCalls = useCallback(async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/sync-calls', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setSyncMsg({ text: data.error ?? 'Sync failed', tone: 'danger' });
      } else {
        setSyncMsg({ text: `Synced ${data.synced} call(s).`, tone: 'neutral' });
        router.refresh();
      }
    } catch (err) {
      setSyncMsg({ text: (err as Error).message, tone: 'danger' });
    } finally {
      setSyncing(false);
    }
  }, [router]);

  const closeDrawer = useCallback(() => setSelected(null), []);

  const selfServed = calls.filter((c) => String(c.outcome ?? '').toUpperCase() === 'SELF_SERVED').length;
  const withRecording = calls.filter((c) => Boolean(c.recording_url)).length;

  const syncButton = (
    <Button variant="secondary" size="md" icon={<SyncIcon />} onClick={syncCalls} busy={syncing} disabled={syncing}>
      {syncing ? 'Syncing' : 'Sync calls'}
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Calls"
        subtitle="Inbound calls handled by the bilingual voice agent."
        action={
          <div className="flex items-center gap-3">
            {syncMsg && <InlineNotice tone={syncMsg.tone}>{syncMsg.text}</InlineNotice>}
            {syncButton}
          </div>
        }
      />

      <Toolbar>
        <span>
          <Num className="text-ink">{calls.length}</Num> calls
        </span>
        {calls.length > 0 && (
          <>
            <span className="inline-flex items-center gap-1.5">
              <StatusBadge size="sm" status="SELF_SERVED" />
              <Num className="text-ink">{selfServed}</Num>
            </span>
            <Dot />
            <span>
              <Num className="text-ink">{withRecording}</Num> with a recording
            </span>
          </>
        )}
      </Toolbar>

      <Table
        minWidth={800}
        footer={calls.length > 0 ? 'Open a call for the recording and transcript. Tickets are created automatically after each call.' : undefined}
      >
        <THead>
          <tr>
            <TH>Started</TH>
            <TH>Caller</TH>
            <TH>Intent</TH>
            <TH>AWB</TH>
            <TH align="right">Duration</TH>
            <TH>Outcome</TH>
            <TH align="right">
              <span className="sr-only">Open</span>
            </TH>
          </tr>
        </THead>
        <TBody>
          {calls.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState
                  icon={<PhoneIcon />}
                  title="No calls yet"
                  description="Sync calls pulls the latest from Vapi."
                  action={
                    <Button variant="secondary" size="sm" icon={<SyncIcon />} onClick={syncCalls} busy={syncing} disabled={syncing}>
                      {syncing ? 'Syncing' : 'Sync calls'}
                    </Button>
                  }
                />
              </td>
            </tr>
          ) : (
            calls.map((c) => {
              const started = fmtTime(c.started_at);
              const duration = fmtDuration(c.duration);
              return (
                <TR
                  key={c.id}
                  onClick={() => setSelected(c)}
                  selected={selected?.id === c.id}
                  aria-haspopup="dialog"
                >
                  {/* Started is the identifier cell: hairline underline + trailing chevron say the row opens the drawer. */}
                  <TD identifier className="whitespace-nowrap">
                    {started ? (
                      <span className="underline decoration-line-strong underline-offset-[3px] group-hover:decoration-ink">
                        {started}
                      </span>
                    ) : (
                      <Null />
                    )}
                  </TD>
                  <TD>{c.caller ? <Num className="text-ink">{c.caller}</Num> : <Null />}</TD>
                  <TD>
                    <IntentBadge intent={c.detected_intent} />
                  </TD>
                  <TD>{c.referenced_awb ? <Id>{c.referenced_awb}</Id> : <Null />}</TD>
                  <TD numeric className="whitespace-nowrap">
                    <span className="inline-flex items-center justify-end">
                      {duration ?? <Null />}
                      {c.recording_url && (
                        <span className="ml-1.5 inline-flex text-ink-3" title="Recording available">
                          <PlayIcon size={12} role="img" aria-label="Recording available" />
                        </span>
                      )}
                    </span>
                  </TD>
                  <TD>{c.outcome ? <StatusBadge status={c.outcome.toUpperCase()} /> : <Null />}</TD>
                  <TD align="right">
                    <ChevronRightIcon className="inline-block h-4 w-4 text-ink-4 group-hover:text-ink-3" />
                  </TD>
                </TR>
              );
            })
          )}
        </TBody>
      </Table>

      <CallDrawer call={selected} onClose={closeDrawer} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Transcript drawer                                                   */
/* ------------------------------------------------------------------ */

function CallDrawer({ call, onClose }: { call: CallRecord | null; onClose: () => void }) {
  const transcript = call?.transcript?.trim() ?? '';
  const parsed = useMemo(() => (transcript ? splitTranscript(transcript) : null), [transcript]);

  return (
    <Drawer
      open={call !== null}
      onClose={onClose}
      title="Call detail"
      subtitle={call?.caller ? <Num className="text-ink-2">{call.caller}</Num> : 'Unknown caller'}
    >
      {call && (
        <>
          <DrawerSection>
            <KeyValue
              columns={2}
              rows={[
                { key: 'started', label: 'Started', value: fmtTime(call.started_at) ? <Num>{fmtTime(call.started_at)}</Num> : <Null /> },
                { key: 'duration', label: 'Duration', value: fmtDuration(call.duration) ? <Num>{fmtDuration(call.duration)}</Num> : <Null /> },
                { key: 'intent', label: 'Intent', value: <IntentBadge intent={call.detected_intent} /> },
                {
                  key: 'outcome',
                  label: 'Outcome',
                  value: call.outcome ? <StatusBadge status={call.outcome.toUpperCase()} /> : <Null />,
                },
                {
                  key: 'awb',
                  label: 'Referenced AWB',
                  value: call.referenced_awb ? (
                    <Id href={`/awb?q=${encodeURIComponent(call.referenced_awb)}`}>{call.referenced_awb}</Id>
                  ) : (
                    <Null />
                  ),
                },
                {
                  key: 'vapi',
                  label: 'Vapi call id',
                  value: <Id className="break-all text-xs text-ink-3">{call.vapi_call_id}</Id>,
                },
              ]}
            />
          </DrawerSection>

          <DrawerSection label="Recording">
            {call.recording_url ? (
              <div className="rounded-md border border-line bg-surface-sunken p-2">
                <audio controls preload="none" src={call.recording_url} className="h-9 w-full">
                  Your browser does not support audio playback.
                </audio>
              </div>
            ) : (
              <EmptyState size="sm" icon={<PlayIcon />} title="No recording for this call" />
            )}
          </DrawerSection>

          <DrawerSection grow>
            <SectionLabel
              action={
                parsed && parsed.turns > 0 ? (
                  <span className="font-normal">
                    <Num className="text-ink-2">{parsed.turns}</Num> turns
                  </span>
                ) : undefined
              }
            >
              Transcript
            </SectionLabel>
            {parsed ? (
              <MonoBlock maxHeight="none">
                <div className="space-y-2">{parsed.nodes}</div>
              </MonoBlock>
            ) : (
              <EmptyState size="sm" icon={<BotIcon />} title="No transcript for this call" description="Vapi did not return a transcript for this call." />
            )}
          </DrawerSection>
        </>
      )}
    </Drawer>
  );
}
