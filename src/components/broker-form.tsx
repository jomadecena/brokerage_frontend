'use client'

import { FormEvent, useState } from 'react'
import { Broker, WEEKDAYS } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'

const COMMON_TIMEZONES = [
  'Asia/Manila',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'UTC'
]

export interface BrokerFormValues {
  name: string
  isActive: boolean
  dailyCap: number
  timezone: string
  openTime: string
  closeTime: string
  workingDays: number[]
}

export function BrokerForm({
  initial,
  submitting,
  onSubmit
}: {
  initial?: Broker
  submitting: boolean
  onSubmit: (values: BrokerFormValues) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [dailyCap, setDailyCap] = useState(String(initial?.dailyCap ?? 10))
  const [timezone, setTimezone] = useState(initial?.timezone ?? 'Asia/Manila')
  const [openTime, setOpenTime] = useState(initial?.openTime ?? '09:00')
  const [closeTime, setCloseTime] = useState(initial?.closeTime ?? '18:00')
  const [workingDays, setWorkingDays] = useState<number[]>(initial?.workingDays ?? [1, 2, 3, 4, 5])
  const [error, setError] = useState<string | null>(null)

  function toggleDay(day: number) {
    setWorkingDays((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort()
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (closeTime <= openTime) {
      setError('Closing time must be after opening time')
      return
    }

    if (workingDays.length === 0) {
      setError('Select at least one working day')
      return
    }

    onSubmit({
      name: name.trim(),
      isActive,
      dailyCap: Number(dailyCap),
      timezone,
      openTime,
      closeTime,
      workingDays
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="broker-name">Broker name</Label>
        <Input
          id="broker-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="daily-cap">Daily cap</Label>
          <Input
            id="daily-cap"
            type="number"
            min={0}
            required
            value={dailyCap}
            onChange={(event) => setDailyCap(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
          >
            {COMMON_TIMEZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="open-time">Opening time</Label>
          <Input
            id="open-time"
            type="time"
            required
            value={openTime}
            onChange={(event) => setOpenTime(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="close-time">Closing time</Label>
          <Input
            id="close-time"
            type="time"
            required
            value={closeTime}
            onChange={(event) => setCloseTime(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Working days</Label>
        <div className="flex flex-wrap gap-3">
          {WEEKDAYS.map((day) => (
            <label key={day.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={workingDays.includes(day.value)}
                onCheckedChange={() => toggleDay(day.value)}
              />
              {day.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch id="broker-active" checked={isActive} onCheckedChange={setIsActive} />
        <Label htmlFor="broker-active">Active</Label>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Save broker'}
      </Button>
    </form>
  )
}
