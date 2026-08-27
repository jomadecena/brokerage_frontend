import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://127.0.0.1:4000'
const AUTH_COOKIE = 'auth_token'

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') ?? ''
}

async function forward(request: NextRequest, path: string[]) {
  const target = `${BACKEND_URL}/api/${path.join('/')}${request.nextUrl.search}`
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value

  const headers = new Headers()
  headers.set('content-type', 'application/json')
  if (token) {
    headers.set('authorization', `Bearer ${token}`)
  }
  const ip = clientIp(request)
  if (ip) {
    headers.set('x-real-ip', ip)
  }

  const body = request.method === 'GET' || request.method === 'DELETE' ? undefined : await request.text()

  let upstream: Response
  try {
    upstream = await fetch(target, { method: request.method, headers, body, cache: 'no-store' })
  } catch {
    return NextResponse.json({ message: 'Unable to reach the API server' }, { status: 502 })
  }

  const text = await upstream.text()
  const payload = text ? JSON.parse(text) : null
  const response = NextResponse.json(payload, { status: upstream.status })

  if (path.join('/') === 'auth/login' && upstream.ok && payload?.token) {
    response.cookies.set(AUTH_COOKIE, payload.token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true',
      maxAge: 60 * 60 * 24 * 7
    })
  }

  return response
}

type Context = { params: Promise<{ path: string[] }> }

export async function GET(request: NextRequest, context: Context) {
  const { path } = await context.params
  return forward(request, path)
}

export async function POST(request: NextRequest, context: Context) {
  const { path } = await context.params

  if (path.join('/') === 'auth/logout') {
    const response = NextResponse.json({ ok: true })
    response.cookies.delete(AUTH_COOKIE)
    return response
  }

  return forward(request, path)
}

export async function PUT(request: NextRequest, context: Context) {
  const { path } = await context.params
  return forward(request, path)
}

export async function DELETE(request: NextRequest, context: Context) {
  const { path } = await context.params
  return forward(request, path)
}
