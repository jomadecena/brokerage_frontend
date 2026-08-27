'use client'

import { FormEvent, useState } from 'react'
import { toast } from 'sonner'
import { useApi } from '@/hooks/use-api'
import { apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LeadForm } from '@/types'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function LeadFormPage() {
  const { data, loading, error, refetch } = useApi<LeadForm | null>('forms')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)

    try {
      await apiRequest('forms', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), slug: slug || slugify(name) })
      })
      toast.success('Lead form created')
      setName('')
      setSlug('')
      refetch()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Unable to create form')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading...</p>
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Lead form</h1>

      {data ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{data.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">Public URL:</span>{' '}
              <a href={`/${data.slug}`} target="_blank" className="underline">
                /{data.slug}
              </a>
            </p>
            <p>
              <span className="text-slate-500">Created:</span>{' '}
              {new Date(data.createdAt).toLocaleString()}
            </p>
            <p className="pt-2 text-slate-500">
              Only one form can exist, so creating another is disabled.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="text-base">Create the lead form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-name">Form name</Label>
                <Input
                  id="form-name"
                  required
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    if (!slugTouched) {
                      setSlug(slugify(event.target.value))
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-slug">Public URL slug</Label>
                <Input
                  id="form-slug"
                  required
                  value={slug}
                  onChange={(event) => {
                    setSlugTouched(true)
                    setSlug(event.target.value)
                  }}
                />
                <p className="text-xs text-slate-500">Public form will live at /{slug || 'your-slug'}</p>
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create form'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
