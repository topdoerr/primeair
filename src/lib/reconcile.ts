import type { DiscrepancyStatus } from './types';

// Reconciliation rule (shared source of truth):
// an invoice is FLAGGED when weight charge + other/surcharges != total collect.
// Money is compared with a 1-cent tolerance to absorb float noise.
const TOLERANCE = 0.01;

export function reconcile(
  weightCharge: number,
  otherCharges: number,
  totalCollect: number,
): { status: DiscrepancyStatus; expected: number; delta: number } {
  const expected = round2(weightCharge + otherCharges);
  const delta = round2(Math.abs(expected - totalCollect));
  return {
    status: delta > TOLERANCE ? 'FLAGGED' : 'RECONCILED',
    expected,
    delta,
  };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatUSD(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(n);
}
