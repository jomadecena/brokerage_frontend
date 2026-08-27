'use client'

import { useApi } from '@/hooks/use-api'
import { DataState } from '@/components/data-state'
import { StatusBadge } from '@/components/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dashboard, REASON_LABELS } from '@/types'

const TILES = [
  { key: 'total', label: 'Total leads' },
  { key: 'sent', label: 'Sent' },
  { key: 'unsent', label: 'Unsent' },
  { key: 'duplicate', label: 'Duplicate' },
  { key: 'failed', label: 'Failed' },
  { key: 'brokers', label: 'Brokers' }
] as const

export default function DashboardPage() {
  const { data, loading, error } = useApi<Dashboard>('dashboard')

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <DataState loading={loading} error={error} empty={!data} emptyMessage="No data yet.">
        {data ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
              {TILES.map((tile) => (
                <Card key={tile.key}>
                  <CardContent className="p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{tile.label}</p>
                    <p className="mt-1 text-2xl font-semibold">{data.counts[tile.key]}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Broker availability right now</CardTitle>
              </CardHeader>
              <CardContent>
                {data.brokerStatus.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No brokers in the distribution yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Broker</TableHead>
                        <TableHead>Timezone</TableHead>
                        <TableHead>Local time</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Share</TableHead>
                        <TableHead>Today</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.brokerStatus.map((broker) => (
                        <TableRow key={broker.brokerId}>
                          <TableCell className="font-medium">{broker.name}</TableCell>
                          <TableCell>{broker.timezone}</TableCell>
                          <TableCell>{broker.localTime}</TableCell>
                          <TableCell>
                            {broker.openTime} - {broker.closeTime}
                          </TableCell>
                          <TableCell>{broker.percentage}%</TableCell>
                          <TableCell>
                            {broker.sentToday} / {broker.dailyCap}
                          </TableCell>
                          <TableCell>
                            {broker.eligible ? (
                              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                                Open
                              </Badge>
                            ) : (
                              <span className="text-xs text-slate-500">
                                {broker.reasons.map((reason) => REASON_LABELS[reason]).join(', ')}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent leads</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentLeads.length === 0 ? (
                  <p className="text-sm text-slate-500">No leads submitted yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>IP address</TableHead>
                        <TableHead>Broker</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Received</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>{lead.email}</TableCell>
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
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DataState>
    </div>
  )
}
