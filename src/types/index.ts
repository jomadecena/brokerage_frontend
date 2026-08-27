export type LeadStatus = 'sent' | 'unsent' | 'duplicate' | 'failed'

export type IneligibilityReason =
  | 'broker-inactive'
  | 'membership-inactive'
  | 'at-cap'
  | 'non-working-day'
  | 'closed'

export interface Broker {
  id: number
  name: string
  isActive: boolean
  dailyCap: number
  timezone: string
  openTime: string
  closeTime: string
  workingDays: number[]
  createdAt: string
}

export interface LeadForm {
  id: number
  name: string
  slug: string
  createdAt: string
}

export interface Lead {
  id: number
  name: string
  email: string
  phone: string
  ipAddress: string
  status: LeadStatus
  brokerId: number | null
  assignedAt: string | null
  assignedManual: boolean
  createdAt: string
  broker?: { id: number; name: string } | null
  form?: { name: string } | null
}

export interface DistributionBroker {
  id: number
  brokerId: number
  percentage: string
  isActive: boolean
  broker: Broker
}

export interface Distribution {
  id: number
  name: string
  formId: number
  createdAt: string
  form: LeadForm
  brokers: DistributionBroker[]
}

export interface BrokerStatus {
  brokerId: number
  name: string
  timezone: string
  localTime: string
  localWeekday: number
  openTime: string
  closeTime: string
  percentage: number
  sentToday: number
  dailyCap: number
  eligible: boolean
  reasons: IneligibilityReason[]
}

export interface Dashboard {
  counts: {
    total: number
    sent: number
    unsent: number
    duplicate: number
    failed: number
    brokers: number
  }
  recentLeads: Lead[]
  brokerStatus: BrokerStatus[]
}

export const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' }
]

export const REASON_LABELS: Record<IneligibilityReason, string> = {
  'broker-inactive': 'Broker inactive',
  'membership-inactive': 'Inactive in distribution',
  'at-cap': 'Daily cap reached',
  'non-working-day': 'Not a working day',
  closed: 'Outside opening hours'
}
