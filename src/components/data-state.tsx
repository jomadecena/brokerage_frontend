export function DataState({
  loading,
  error,
  empty,
  emptyMessage,
  children
}: {
  loading: boolean
  error: string | null
  empty: boolean
  emptyMessage: string
  children: React.ReactNode
}) {
  if (loading) {
    return <p className="py-8 text-center text-sm text-slate-500">Loading...</p>
  }

  if (error) {
    return (
      <p role="alert" className="py-8 text-center text-sm text-red-600">
        {error}
      </p>
    )
  }

  if (empty) {
    return <p className="py-8 text-center text-sm text-slate-500">{emptyMessage}</p>
  }

  return <>{children}</>
}
