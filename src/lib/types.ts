// Shared domain types for the Prime Air dashboard.

export type AwbStatus = 'IN_TRANSIT' | 'ARRIVED' | 'AVAILABLE' | 'PICKED_UP';

export interface AirWaybill {
  id: string;
  master_bill_number: string;
  carrier_code: string;
  flight: string | null;
  origin: string;
  destination: string;
  commodity: string | null;
  weight_charge: number;
  other_charges: number;
  total_collect: number;
  status: AwbStatus;
  cargo_ready_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CallRecord {
  id: string;
  vapi_call_id: string;
  caller: string | null;
  assistant_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration: number | null;
  transcript: string | null;
  detected_intent: string | null;
  referenced_awb: string | null;
  outcome: string | null;
  raw: unknown;
  created_at: string;
}

export interface Pickup {
  id: string;
  master_bill_number: string;
  window_start: string;
  window_end: string;
  contact: string | null;
  status: string;
  source: string;
  vapi_call_id: string | null;
  created_at: string;
}

export type DiscrepancyStatus = 'RECONCILED' | 'FLAGGED';

export interface DiscrepancyReport {
  id: string;
  message_id: string;
  carrier_code: string;
  invoice_number: string | null;
  master_bill_number: string | null;
  payload_xml: string;
  status: DiscrepancyStatus;
  created_at: string;
}

// Contract returned by POST /api/awb-lookup (the tool the assistant calls).
export interface AwbLookupResult {
  masterBillNumber: string;
  flight: string | null;
  origin: string;
  destination: string;
  status: AwbStatus;
  cargoReady: boolean;
  availableForPickup: boolean;
  chargesSummary: string;
  commodity: string | null;
}
