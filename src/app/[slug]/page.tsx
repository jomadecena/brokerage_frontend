'use client'

import { FormEvent, use, useEffect, useState } from 'react'
import { ApiError, apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LeadForm } from '@/types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [form, setForm] = useState<LeadForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    apiRequest<LeadForm>(`public/forms/${slug}`)
      .then((data) => setForm(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setValidationError(null)
    setSubmitError(null)

    if (!EMAIL_PATTERN.test(email.trim())) {
      setValidationError('Enter a valid email address')
      return
    }

    setSubmitting(true)

    try {
      await apiRequest(`public/forms/${slug}/leads`, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() })
      })
      setSubmitted(true)
    } catch (caught) {
      setSubmitError(
        caught instanceof ApiError ? caught.message : 'Unable to submit right now. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </main>
    )
  }

  if (notFound || !form) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Form not found</CardTitle>
            <CardDescription>This link does not match any published form.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{form.name}</CardTitle>
          <CardDescription>Leave your details and a broker will be in touch.</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-2">
              <p className="font-medium text-emerald-700">Thank you.</p>
              <p className="text-sm text-slate-600">
                Your details have been received and passed to our team.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>

              {validationError ? (
                <p role="alert" className="text-sm text-red-600">
                  {validationError}
                </p>
              ) : null}

              {submitError ? (
                <p role="alert" className="text-sm text-red-600">
                  {submitError}
                </p>
              ) : null}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
