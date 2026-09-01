'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(path: string | null) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: path !== null,
    error: null
  })

  const load = useCallback(async () => {
    if (path === null) {
      setState({ data: null, loading: false, error: null })
      return
    }

    setState((current) => ({ ...current, loading: true, error: null }))

    try {
      const data = await apiRequest<T>(path)
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Something went wrong'
      })
    }
  }, [path])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, refetch: load }
}
