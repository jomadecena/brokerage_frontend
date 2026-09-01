'use client'

import Link from 'next/link'
import { useApi } from '@/hooks/use-api'
import { DataState } from '@/components/data-state'
import { StatusBadge } from '@/components/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Lead } from '@/types'

export default function DistributionDetailPage() {
  const { data, loading, error } = useApi<Lead[]>('distributions/leads')

  return (
    <div className="space-y-6">
      <Link href="/admin/distribution" className="text-sm text-slate-600 underline">
        Back to distribution
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">Distribution detail</h1>
        <p className="mt-1 text-sm text-slate-600">
          Every lead that passed through the distribution, including duplicates, failures and
          unsent leads.
        </p>
      </div>

      <DataState
        loading={loading}
        error={error}
        empty={!data || data.length === 0}
        emptyMessage="No leads have passed through this distribution yet."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>IP address</TableHead>
              <TableHead>Broker</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.phone}</TableCell>
                <TableCell>{lead.ipAddress}</TableCell>
                <TableCell>{lead.broker?.name ?? '-'}</TableCell>
                <TableCell>
                  <StatusBadge status={lead.status} />
                </TableCell>
                <TableCell>{new Date(lead.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataState>
    </div>
  )
}
