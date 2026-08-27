import { Suspense } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PublicFormPage from './page'

const FORM = { id: 1, name: 'Lead Registration', slug: 'lead-registration', createdAt: '' }

function stubFetch(handler: (url: string, init?: RequestInit) => unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const result = handler(url, init) as { status?: number; body?: unknown }
      const status = result.status ?? 200
      return {
        ok: status < 400,
        status,
        text: async () => JSON.stringify(result.body ?? null)
      }
    })
  )
}

beforeEach(() => {
  stubFetch(() => ({ body: FORM }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function renderPage() {
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <PublicFormPage params={Promise.resolve({ slug: 'lead-registration' })} />
      </Suspense>
    )
  })
}

describe('PublicFormPage', () => {
  it('renders the form once it has loaded', async () => {
    await renderPage()
    expect(await screen.findByText('Lead Registration')).toBeInTheDocument()
  })

  it('shows a not found message for an unknown slug', async () => {
    stubFetch(() => ({ status: 404, body: { message: 'Form not found' } }))
    await renderPage()
    expect(await screen.findByText('Form not found')).toBeInTheDocument()
  })

  it('blocks submission when the email is malformed', async () => {
    const user = userEvent.setup()
    await renderPage()
    await screen.findByText('Lead Registration')

    await user.type(screen.getByLabelText('Full name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Phone'), '09171234567')
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid email address')
  })

  it('shows the thank you state after a successful submission', async () => {
    const user = userEvent.setup()
    stubFetch((url, init) =>
      init?.method === 'POST' ? { status: 201, body: { id: 9, status: 'sent' } } : { body: FORM }
    )

    await renderPage()
    await screen.findByText('Lead Registration')

    await user.type(screen.getByLabelText('Full name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Phone'), '09171234567')
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('Thank you.')).toBeInTheDocument()
  })

  it('surfaces a server error without losing the form', async () => {
    const user = userEvent.setup()
    stubFetch((url, init) =>
      init?.method === 'POST'
        ? { status: 500, body: { message: 'Internal server error' } }
        : { body: FORM }
    )

    await renderPage()
    await screen.findByText('Lead Registration')

    await user.type(screen.getByLabelText('Full name'), 'Jane Doe')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Phone'), '09171234567')
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Internal server error')
    )
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled()
  })
})
