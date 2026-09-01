import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useApi } from './use-api'

function mockFetch(response: { ok: boolean; status: number; body: unknown }) {
  const stub = vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status,
    text: async () => JSON.stringify(response.body)
  })
  vi.stubGlobal('fetch', stub)
  return stub
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useApi', () => {
  it('starts in a loading state and resolves with data', async () => {
    mockFetch({ ok: true, status: 200, body: [{ id: 1, name: 'Manila Desk' }] })

    const { result } = renderHook(() => useApi<{ id: number; name: string }[]>('brokers'))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toEqual([{ id: 1, name: 'Manila Desk' }])
    expect(result.current.error).toBeNull()
  })

  it('surfaces the server error message', async () => {
    mockFetch({ ok: false, status: 500, body: { message: 'Internal server error' } })

    const { result } = renderHook(() => useApi('dashboard'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Internal server error')
    expect(result.current.data).toBeNull()
  })

  it('does not fetch when the path is null', async () => {
    const stub = mockFetch({ ok: true, status: 200, body: {} })

    const { result } = renderHook(() => useApi(null))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(stub).not.toHaveBeenCalled()
  })

  it('refetches on demand', async () => {
    const stub = mockFetch({ ok: true, status: 200, body: { total: 1 } })

    const { result } = renderHook(() => useApi<{ total: number }>('dashboard'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.refetch()

    expect(stub).toHaveBeenCalledTimes(2)
  })
})
