// Dev-only design preview. Renders each presentational View with fixture data
// (no database, no session) so the screens can be screenshotted and restyled.
// Gated to non-production: the middleware lets /design-preview through outside
// production, and this page 404s in production regardless.
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { OverviewView } from '@/components/views/OverviewView';
import { TrackingView, type Tracked } from '@/components/views/TrackingView';
import { BookingsView } from '@/components/views/BookingsView';
import { AwbLookupView } from '@/components/views/AwbLookupView';
import { DiscrepanciesView } from '@/components/views/DiscrepanciesView';
import { DiscrepancyDetailView } from '@/components/views/DiscrepancyDetailView';
import { TicketsView } from '@/components/views/TicketsView';
import { CallsView } from '@/components/views/CallsView';
import { AssistantView } from '@/components/views/AssistantView';
import { completedCount, currentMilestone, fullTimeline } from '@/lib/milestones';
import { parseDiscrepancyXml } from '@/lib/discrepancy-xml';
import {
  FIXTURE_ASSISTANT,
  FIXTURE_AWBS,
  FIXTURE_BOOKINGS,
  FIXTURE_CALLS,
  FIXTURE_CUSTOMERS,
  FIXTURE_EVENTS,
  FIXTURE_MILESTONES,
  FIXTURE_PHONE,
  FIXTURE_REPORTS,
  FIXTURE_TICKETS,
} from '@/lib/fixtures';
import type { AirWaybill } from '@/lib/types';
import { LoginPreview } from '../_components/LoginPreview';
import { isPreviewScreen, PREVIEW_SCREENS, type PreviewScreenKey } from '../_components/screens';

export const dynamic = 'force-dynamic';

const PREVIEW_USER_EMAIL = 'kevin@topdoer.com';

// The same AppShell src/app/(dashboard)/layout.tsx renders, minus the auth lookup.
// `route` is the mirrored dashboard path so the rail and breadcrumb match production.
function DashboardShell({ route, children }: { route: string; children: React.ReactNode }) {
  return (
    <AppShell userEmail={PREVIEW_USER_EMAIL} pathname={route}>
      {children}
    </AppShell>
  );
}

// --- Tracking derivation (mirrors src/app/(dashboard)/tracking/page.tsx) -----
// The page orders integration_events by created_at DESC; the View renders
// `events.slice(0, 8)` in the order given and `find`s the latest CargoWise push.
const TRACKING_EVENTS = [...FIXTURE_EVENTS].sort((a, b) =>
  b.created_at.localeCompare(a.created_at),
);

function deriveTracked(awbs: AirWaybill[]): Tracked[] {
  return awbs.map((awb) => {
    const timeline = fullTimeline(
      awb.master_bill_number,
      FIXTURE_MILESTONES.filter((m) => m.master_bill_number === awb.master_bill_number),
    );
    return {
      awb,
      timeline,
      current: currentMilestone(timeline),
      done: completedCount(timeline),
      lastPush:
        TRACKING_EVENTS.find(
          (e) => e.master_bill_number === awb.master_bill_number && e.kind === 'CARGOWISE_PUSH',
        ) ?? null,
    };
  });
}

function renderScreen(screen: PreviewScreenKey): React.ReactNode {
  switch (screen) {
    case 'overview':
      return (
        <OverviewView
          awbs={FIXTURE_AWBS}
          milestones={FIXTURE_MILESTONES}
          pushesToday={FIXTURE_EVENTS.filter((e) => e.kind === 'CARGOWISE_PUSH')}
          bookings={FIXTURE_BOOKINGS}
          calls={FIXTURE_CALLS}
        />
      );

    case 'tracking':
      return (
        <TrackingView
          q=""
          flight={null}
          tracked={deriveTracked(FIXTURE_AWBS)}
          detail={null}
          events={TRACKING_EVENTS}
          notFound={false}
        />
      );

    case 'tracking-detail': {
      const mbn = '810-21961306';
      const rows = deriveTracked(FIXTURE_AWBS.filter((a) => a.master_bill_number === mbn));
      return (
        <TrackingView
          q={mbn}
          flight={null}
          tracked={rows}
          detail={rows[0] ?? null}
          events={TRACKING_EVENTS.filter((e) => e.master_bill_number === mbn)}
          notFound={false}
        />
      );
    }

    case 'tracking-flight': {
      const flight = 'M68741';
      return (
        <TrackingView
          q={flight}
          flight={flight}
          tracked={deriveTracked(FIXTURE_AWBS.filter((a) => a.flight === flight))}
          detail={null}
          events={TRACKING_EVENTS}
          notFound={false}
        />
      );
    }

    case 'bookings':
      return (
        <BookingsView
          bookings={FIXTURE_BOOKINGS}
          customers={[...FIXTURE_CUSTOMERS].sort((a, b) => a.name.localeCompare(b.name))}
        />
      );

    case 'awb': {
      const mbn = '810-21961413';
      const awb = FIXTURE_AWBS.find((a) => a.master_bill_number === mbn) ?? null;
      return <AwbLookupView q={mbn} awb={awb} notFound={!awb} />;
    }

    case 'awb-empty':
      return <AwbLookupView q="" awb={null} notFound={false} />;

    case 'discrepancies':
      return <DiscrepanciesView reports={FIXTURE_REPORTS} />;

    case 'discrepancy-detail': {
      const report = FIXTURE_REPORTS.find((r) => r.status === 'FLAGGED') ?? FIXTURE_REPORTS[0];
      return (
        <DiscrepancyDetailView report={report} parsed={parseDiscrepancyXml(report.payload_xml)} />
      );
    }

    case 'tickets':
      return <TicketsView tickets={FIXTURE_TICKETS} />;

    case 'calls':
      return <CallsView calls={FIXTURE_CALLS} />;

    case 'assistant':
      return (
        <AssistantView
          configured
          assistant={FIXTURE_ASSISTANT}
          phone={FIXTURE_PHONE}
          error={null}
        />
      );

    case 'login':
      return <LoginPreview />;
  }
}

export default function DesignPreviewScreen({ params }: { params: { screen: string } }) {
  if (process.env.NODE_ENV === 'production') notFound();

  const { screen } = params;
  if (!isPreviewScreen(screen)) notFound();

  const meta = PREVIEW_SCREENS.find((s) => s.key === screen)!;
  const content = renderScreen(screen);

  return meta.shell ? <DashboardShell route={meta.route}>{content}</DashboardShell> : <>{content}</>;
}
