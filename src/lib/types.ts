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
  recording_url: string | null;
  raw: unknown;
  created_at: string;
}

export interface Ticket {
  id: string;
  number: number;
  vapi_call_id: string | null;
  master_bill_number: string | null;
  subject: string;
  category: string | null;
  priority: string; // low | normal | high
  status: string; // open | closed
  description: string | null;
  created_at: string;
}

export interface Pickup {
  id: string;
  number: number;
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

// --- Milestone tracking ------------------------------------------------------

export type MilestoneStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';

export interface ShipmentMilestone {
  id: string;
  master_bill_number: string;
  code: string; // BOOKED | RECEIVED_ORIGIN | DEPARTED | ARRIVED | AVAILABLE | DELIVERED
  label: string;
  sequence: number;
  status: MilestoneStatus;
  occurred_at: string | null;
  location: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type IntegrationKind = 'PORTAL_PULL' | 'CARGOWISE_PUSH';
export type IntegrationStatus = 'SENT' | 'ACKNOWLEDGED' | 'FAILED';

export interface IntegrationEvent {
  id: string;
  master_bill_number: string | null;
  booking_id: string | null;
  kind: IntegrationKind;
  system: string;
  status: IntegrationStatus;
  external_ref: string | null;
  summary: string | null;
  payload: unknown;
  created_at: string;
}

// --- Bookings ---------------------------------------------------------------

export interface Customer {
  id: string;
  account_code: string;
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  default_commodity: string | null;
  default_origin: string;
  default_destination: string;
  is_recurring: boolean;
  created_at: string;
}

export type BookingStatus = 'REQUESTED' | 'CONFIRMED' | 'CANCELLED';

export interface Booking {
  id: string;
  number: number;
  customer_id: string | null;
  customer_name: string;
  origin: string;
  destination: string;
  commodity: string | null;
  pieces: number | null;
  weight_kg: number | null;
  requested_date: string | null;
  flight: string | null;
  status: BookingStatus;
  source: string; // dashboard | voice_agent
  cargowise_ref: string | null;
  vapi_call_id: string | null;
  notes: string | null;
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
