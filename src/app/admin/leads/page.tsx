'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useApi } from '@/hooks/use-api'
import { apiRequest } from '@/lib/api'
import { DataState } from '@/components/data-state'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Broker, Dashboard, Lead, LeadStatus, REASON_LABELS } from '@/types'

const FILTERS: Array<{ value: LeadStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'sent', label: 'Sent' },
  { value: 'unsent', label: 'Unsent' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'failed', label: 'Failed' }
]

export default function LeadsPage() {
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all')
  const leads = useApi<Lead[]>(filter === 'all' ? 'leads' : `leads?status=${filter}`)
  const brokers = useApi<Broker[]>('brokers')
  const dashboard = useApi<Dashboard>('dashboard')

  const [assigning, setAssigning] = useState<Lead | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleAssign(brokerId: number) {
    if (!assigning) {
      return
    }

    setSubmitting(true)
    try {
      await apiRequest(`leads/${assigning.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ brokerId })
      })
      toast.success('Lead assigned')
      setAssigning(null)
      leads.refetch()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Unable to assign lead')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Leads</h1>

      <div className="flex gap-2">
        {FILTERS.map((entry) => (
          <button
            key={entry.value}
            onClick={() => setFilter(entry.value)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              filter === entry.value
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <DataState
        loading={leads.loading}
        error={leads.error}
        empty={!leads.data || leads.data.length === 0}
        emptyMessage="No leads to show."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>IP address</TableHead>
              <TableHead>Form</TableHead>
              <TableHead>Broker</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.data?.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.phone}</TableCell>
                <TableCell>{lead.ipAddress}</TableCell>
                <TableCell>{lead.form?.name ?? '-'}</TableCell>
                <TableCell>{lead.broker?.name ?? '-'}</TableCell>
                <TableCell>
                  <StatusBadge status={lead.status} />
                </TableCell>
                <TableCell>{new Date(lead.createdAt).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  {lead.status === 'unsent' || lead.status === 'failed' ? (
                    <Button size="sm" variant="outline" onClick={() => setAssigning(lead)}>
                      Assign
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataState>

      <Dialog open={assigning !== null} onOpenChange={(open) => !open && setAssigning(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign lead to a broker</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {brokers.data?.map((broker) => {
              const status = dashboard.data?.brokerStatus.find(
                (entry) => entry.brokerId === broker.id
              )

              return (
                <button
                  key={broker.id}
                  disabled={submitting}
                  onClick={() => handleAssign(broker.id)}
                  className="flex w-full items-center justify-between rounded-md border p-3 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="font-medium">{broker.name}</span>
                  {status && !status.eligible ? (
                    <span className="text-xs text-amber-700">
                      {status.reasons.map((reason) => REASON_LABELS[reason]).join(', ')}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">{broker.timezone}</span>
                  )}
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
