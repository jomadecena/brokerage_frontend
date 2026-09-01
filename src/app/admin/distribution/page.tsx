'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useApi } from '@/hooks/use-api'
import { ApiError, apiRequest } from '@/lib/api'
import { DataState } from '@/components/data-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Broker, Distribution } from '@/types'

interface MembershipDraft {
  brokerId: number
  selected: boolean
  percentage: string
  isActive: boolean
}

export default function DistributionPage() {
  const distribution = useApi<Distribution | null>('distributions')
  const brokers = useApi<Broker[]>('brokers')

  const [name, setName] = useState('Default Distribution')
  const [drafts, setDrafts] = useState<MembershipDraft[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [noFormOpen, setNoFormOpen] = useState(false)

  useEffect(() => {
    if (!brokers.data) {
      return
    }

    setDrafts(
      brokers.data.map((broker) => {
        const membership = distribution.data?.brokers.find(
          (entry) => entry.brokerId === broker.id
        )

        return {
          brokerId: broker.id,
          selected: Boolean(membership),
          percentage: membership ? String(Number(membership.percentage)) : '0',
          isActive: membership ? membership.isActive : true
        }
      })
    )
  }, [brokers.data, distribution.data])

  function updateDraft(brokerId: number, patch: Partial<MembershipDraft>) {
    setDrafts((current) =>
      current.map((draft) => (draft.brokerId === brokerId ? { ...draft, ...patch } : draft))
    )
  }

  const selected = drafts.filter((draft) => draft.selected)
  const total = selected.reduce((sum, draft) => sum + Number(draft.percentage || 0), 0)

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)

    try {
      await apiRequest('distributions', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          brokers: selected.map((draft) => ({
            brokerId: draft.brokerId,
            percentage: Number(draft.percentage || 0),
            isActive: draft.isActive
          }))
        })
      })
      toast.success('Distribution created')
      distribution.refetch()
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'NO_FORM') {
        setNoFormOpen(true)
      } else {
        toast.error(caught instanceof Error ? caught.message : 'Unable to create distribution')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveBrokers() {
    setSubmitting(true)

    try {
      await apiRequest('distributions/brokers', {
        method: 'PUT',
        body: JSON.stringify({
          brokers: selected.map((draft) => ({
            brokerId: draft.brokerId,
            percentage: Number(draft.percentage || 0),
            isActive: draft.isActive
          }))
        })
      })
      toast.success('Distribution brokers updated')
      distribution.refetch()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Unable to update distribution')
    } finally {
      setSubmitting(false)
    }
  }

  const brokerRows = (
    <DataState
      loading={brokers.loading}
      error={brokers.error}
      empty={!brokers.data || brokers.data.length === 0}
      emptyMessage="Create brokers before setting up the distribution."
    >
      <div className="space-y-3">
        {brokers.data?.map((broker) => {
          const draft = drafts.find((entry) => entry.brokerId === broker.id)
          if (!draft) {
            return null
          }

          return (
            <div
              key={broker.id}
              className="flex flex-wrap items-center gap-4 rounded-md border bg-white p-3"
            >
              <label className="flex min-w-48 items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={draft.selected}
                  onCheckedChange={(checked) =>
                    updateDraft(broker.id, { selected: checked === true })
                  }
                  aria-label={`Include ${broker.name}`}
                />
                {broker.name}
              </label>

              <div className="flex items-center gap-2">
                <Label htmlFor={`pct-${broker.id}`} className="text-xs text-slate-500">
                  Percentage
                </Label>
                <Input
                  id={`pct-${broker.id}`}
                  type="number"
                  min={0}
                  max={100}
                  className="w-24"
                  disabled={!draft.selected}
                  value={draft.percentage}
                  onChange={(event) => updateDraft(broker.id, { percentage: event.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id={`active-${broker.id}`}
                  disabled={!draft.selected}
                  checked={draft.isActive}
                  onCheckedChange={(checked) => updateDraft(broker.id, { isActive: checked })}
                />
                <Label htmlFor={`active-${broker.id}`} className="text-xs text-slate-500">
                  Active in distribution
                </Label>
              </div>
            </div>
          )
        })}

        {selected.length > 0 ? (
          <p className={`text-sm ${total === 100 ? 'text-slate-500' : 'text-amber-700'}`}>
            Total percentage: {total}%{total === 100 ? '' : ' (does not add up to 100%)'}
          </p>
        ) : null}
      </div>
    </DataState>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Distribution</h1>
        {distribution.data ? (
          <Link href="/admin/distribution/detail" className="text-sm underline">
            Open distribution detail
          </Link>
        ) : null}
      </div>

      <DataState
        loading={distribution.loading}
        error={distribution.error}
        empty={false}
        emptyMessage=""
      >
        {distribution.data ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{distribution.data.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-slate-600">
                Connected to form <strong>{distribution.data.form.name}</strong> (/
                {distribution.data.form.slug}). Only one distribution can exist.
              </p>
              {brokerRows}
              <Button onClick={handleSaveBrokers} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save broker settings'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create the distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="max-w-sm space-y-2">
                  <Label htmlFor="distribution-name">Distribution name</Label>
                  <Input
                    id="distribution-name"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                {brokerRows}
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create distribution'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </DataState>

      <Dialog open={noFormOpen} onOpenChange={setNoFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Oops, please create a form first.</DialogTitle>
          </DialogHeader>
          <Link href="/admin/form" className="text-sm underline">
            Go to the lead form page
          </Link>
        </DialogContent>
      </Dialog>
    </div>
  )
}
