'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useApi } from '@/hooks/use-api'
import { apiRequest } from '@/lib/api'
import { DataState } from '@/components/data-state'
import { StatusBadge } from '@/components/status-badge'
import { BrokerForm, BrokerFormValues } from '@/components/broker-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Broker, Lead } from '@/types'

export default function BrokerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const broker = useApi<Broker>(`brokers/${id}`)
  const leads = useApi<Lead[]>(`brokers/${id}/leads`)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleUpdate(values: BrokerFormValues) {
    setSubmitting(true)
    try {
      await apiRequest(`brokers/${id}`, { method: 'PUT', body: JSON.stringify(values) })
      toast.success('Broker updated')
      setOpen(false)
      broker.refetch()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Unable to update broker')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/brokers" className="text-sm text-slate-600 underline">
        Back to brokers
      </Link>

      <DataState
        loading={broker.loading}
        error={broker.error}
        empty={!broker.data}
        emptyMessage="Broker not found."
      >
        {broker.data ? (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{broker.data.name}</h1>
              <p className="mt-1 text-sm text-slate-600">
                {broker.data.timezone} - {broker.data.openTime} to {broker.data.closeTime} - cap{' '}
                {broker.data.dailyCap}
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button variant="outline" />}>Edit broker</DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit broker</DialogTitle>
                </DialogHeader>
                <BrokerForm
                  initial={broker.data}
                  submitting={submitting}
                  onSubmit={handleUpdate}
                />
              </DialogContent>
            </Dialog>
          </div>
        ) : null}
      </DataState>

      <div>
        <h2 className="mb-3 text-lg font-medium">Leads received</h2>
        <DataState
          loading={leads.loading}
          error={leads.error}
          empty={!leads.data || leads.data.length === 0}
          emptyMessage="This broker has not received any leads yet."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>IP address</TableHead>
                <TableHead>Form name</TableHead>
                <TableHead>Date received</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell>
                    {lead.assignedAt ? new Date(lead.assignedAt).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={lead.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </div>
    </div>
  )
}
