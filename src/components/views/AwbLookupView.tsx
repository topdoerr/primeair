import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Dotted,
  EmptyState,
  Id,
  InlineNotice,
  Input,
  KeyValue,
  LedgerRow,
  LinkButton,
  Num,
  PageHeader,
  StatusBadge,
} from '@/components/ui';
import { ArrowUpRightIcon, PackageIcon, SearchIcon } from '@/components/icons';
import { reconcile, formatUSD } from '@/lib/reconcile';
import type { AirWaybill } from '@/lib/types';

export type AwbLookupViewProps = {
  q: string;
  awb: AirWaybill | null;
  notFound: boolean;
};

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function AwbLookupView({ q, awb, notFound }: AwbLookupViewProps) {
  const recon = awb
    ? reconcile(Number(awb.weight_charge), Number(awb.other_charges), Number(awb.total_collect))
    : null;

  return (
    <div>
      <PageHeader
        title="AWB lookup"
        subtitle="Search a master air waybill to review the record and charge reconciliation."
        action={
          <form method="get" className="flex items-center gap-2">
            <Input
              name="q"
              defaultValue={q}
              mono
              leading={<SearchIcon />}
              placeholder="e.g. 810-21961413"
              aria-label="Master air waybill number"
              autoComplete="off"
              className="w-[280px]"
            />
            <Button type="submit" variant="primary" size="md">
              Search
            </Button>
          </form>
        }
      />

      {!q && (
        <Card>
          <EmptyState
            icon={<PackageIcon />}
            title="Search an air waybill"
            description="Enter a master air waybill number to see its record, charges and reconciliation status."
          />
        </Card>
      )}

      {q && notFound && (
        <Card>
          <EmptyState
            icon={<SearchIcon />}
            title={
              <>
                No air waybill found for <Id>{q}</Id>
              </>
            }
            description="Try 810-21961413 or 810-21961306."
            action={
              <LinkButton href="/awb" variant="secondary" size="sm">
                Clear search
              </LinkButton>
            }
          />
        </Card>
      )}

      {awb && recon && (
        <>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader
                title={
                  <span className="font-mono text-base font-medium tracking-[-0.01em] text-ink">
                    {awb.master_bill_number}
                  </span>
                }
                actions={<StatusBadge status={awb.status} />}
              >
                <span className="truncate text-xs text-ink-3">{awb.commodity ?? 'Cargo'}</span>
              </CardHeader>
              <CardBody>
                <KeyValue
                  columns={2}
                  rows={[
                    { key: 'carrier', label: 'Carrier', value: <Id>{awb.carrier_code}</Id> },
                    {
                      key: 'flight',
                      label: 'Flight',
                      value: awb.flight ? <Id>{awb.flight}</Id> : <span className="text-ink-3">Not assigned</span>,
                    },
                    { key: 'origin', label: 'Origin', value: <Id>{awb.origin}</Id> },
                    { key: 'destination', label: 'Destination', value: <Id>{awb.destination}</Id> },
                    {
                      key: 'ready',
                      label: 'Cargo ready',
                      value: awb.cargo_ready_at ? (
                        <Num>{fmtWhen(awb.cargo_ready_at)}</Num>
                      ) : (
                        <span className="text-ink-3">Not yet</span>
                      ),
                    },
                    {
                      key: 'pickup',
                      label: 'Available for pickup',
                      value:
                        awb.status === 'AVAILABLE' ? <Dotted tone="ok">Yes</Dotted> : <Dotted tone="neutral">No</Dotted>,
                    },
                  ]}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Charge breakdown" actions={<StatusBadge status={recon.status} />} />
              <CardBody>
                <LedgerRow label="Weight charge" value={formatUSD(Number(awb.weight_charge))} />
                <LedgerRow label="Other charges" value={formatUSD(Number(awb.other_charges))} />
                <LedgerRow label="Total collect" value={formatUSD(Number(awb.total_collect))} strong />
              </CardBody>
              <CardFooter className="px-3 py-3">
                <div className="rounded-md bg-surface-sunken p-3">
                  <div className="flex items-baseline justify-between gap-3 text-xs text-ink-3">
                    <span>Expected (weight + other)</span>
                    <Num className="text-ink-2">{formatUSD(recon.expected)}</Num>
                  </div>
                  {recon.status === 'FLAGGED' ? (
                    <InlineNotice tone="danger" className="mt-1.5 w-full">
                      Difference <Num>{formatUSD(recon.delta)}</Num>, flagged for review
                    </InlineNotice>
                  ) : (
                    <InlineNotice tone="ok" className="mt-1.5 w-full">
                      Matches total collect
                    </InlineNotice>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>

          <div className="mt-4">
            <LinkButton href="/discrepancies" variant="ghost" size="sm" trailingIcon={<ArrowUpRightIcon />}>
              View related discrepancy reports
            </LinkButton>
          </div>
        </>
      )}
    </div>
  );
}
