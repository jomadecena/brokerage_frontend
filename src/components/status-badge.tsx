import { Badge } from '@/components/ui/badge'
import { LeadStatus } from '@/types'

const VARIANTS: Record<LeadStatus, string> = {
  sent: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  unsent: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  duplicate: 'bg-slate-200 text-slate-700 hover:bg-slate-200',
  failed: 'bg-red-100 text-red-800 hover:bg-red-100'
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <Badge className={VARIANTS[status]}>{status}</Badge>
}
