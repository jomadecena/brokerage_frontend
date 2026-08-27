'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useApi } from '@/hooks/use-api'
import { apiRequest } from '@/lib/api'
import { DataState } from '@/components/data-state'
import { BrokerForm, BrokerFormValues } from '@/components/broker-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Broker, WEEKDAYS } from '@/types'

function formatDays(days: number[]) {
  return WEEKDAYS.filter((day) => days.includes(day.value))
    .map((day) => day.label)
    .join(', ')
}

export default function BrokersPage() {
  const { data, loading, error, refetch } = useApi<Broker[]>('brokers')
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate(values: BrokerFormValues) {
    setSubmitting(true)
    try {
      await apiRequest('brokers', { method: 'POST', body: JSON.stringify(values) })
      toast.success('Broker created')
      setOpen(false)
      refetch()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Unable to create broker')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Brokers</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>Add broker</DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New broker</DialogTitle>
            </DialogHeader>
            <BrokerForm submitting={submitting} onSubmit={handleCreate} />
          </DialogContent>
        </Dialog>
      </div>

      <DataState
        loading={loading}
        error={error}
        empty={!data || data.length === 0}
        emptyMessage="No brokers yet. Add your first broker to get started."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Timezone</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Working days</TableHead>
              <TableHead>Daily cap</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((broker) => (
              <TableRow key={broker.id}>
                <TableCell className="font-medium">{broker.name}</TableCell>
                <TableCell>{broker.timezone}</TableCell>
                <TableCell>
                  {broker.openTime} - {broker.closeTime}
                </TableCell>
                <TableCell>{formatDays(broker.workingDays)}</TableCell>
                <TableCell>{broker.dailyCap}</TableCell>
                <TableCell>
                  {broker.isActive ? (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/admin/brokers/${broker.id}`}
                    className="text-sm font-medium text-slate-700 underline"
                  >
                    View leads
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataState>
    </div>
  )
}
