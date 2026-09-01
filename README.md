# Lead Distribution Platform - Frontend

Next.js (App Router) admin dashboard and public lead form. This is the only publicly exposed
service; it proxies every API call to the Express backend over the loopback interface.

- Backend repository: `<backend-repo-url>`
- Live app: `http://<server-ip>:<frontend-port>`

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui |
| Tests | Vitest + React Testing Library |

## Pages

| Route | Access | Purpose |
| --- | --- | --- |
| `/login` | Public | Admin sign in |
| `/{slug}` | Public | The lead form, e.g. `/lead-registration` |
| `/admin` | Protected | Counters, live broker availability, recent leads |
| `/admin/brokers` | Protected | List and create brokers |
| `/admin/brokers/{id}` | Protected | Edit a broker and see the leads it received |
| `/admin/form` | Protected | Create the single lead form |
| `/admin/distribution` | Protected | Create the distribution, pick brokers, set percentages |
| `/admin/distribution/detail` | Protected | Every lead that passed through the distribution |
| `/admin/leads` | Protected | All leads with filters and manual assignment |

## Architecture

The backend port is not publicly exposed, so the browser never talks to it directly.

```
browser  ->  frontend (public port)  ->  backend (127.0.0.1, private port)
```

Two pieces make that work:

**`src/app/api/[...path]/route.ts`** - a catch-all proxy. It forwards every `/api/*` request to
`BACKEND_URL`, attaches the admin's JWT from the httpOnly cookie as a bearer token, and passes
the visitor's IP through as `x-real-ip`. It also owns the two things the backend cannot do:
setting the auth cookie after a successful login, and clearing it on logout.

**`server.ts`** - a custom HTTP server wrapping Next. When the app is reached directly at
`http://<server-ip>:<port>` there is no reverse proxy, so no `X-Forwarded-For` header exists and
Next has no API for the raw socket address. This server reads `req.socket.remoteAddress` and
injects it as `x-real-ip`, but only when no forwarding header is already present - so a real
proxy still wins if one is ever put in front. Without this the visitor IP could not be captured,
which is a hard requirement.

`src/middleware.ts` redirects `/admin/*` to `/login` when the auth cookie is absent. It only
checks that the cookie exists; the backend independently verifies the signature on every
request, so it is the real access control.

## 1. Clone the repository

```bash
git clone <frontend-repo-url> lead-frontend
cd lead-frontend
```

## 2. Install dependencies

```bash
npm install
```

## 3. Set environment variables

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `PORT` | The public port provided by the reviewer |
| `HOSTNAME` | Bind address. Use `0.0.0.0` so the app is reachable from outside |
| `BACKEND_URL` | Loopback address of the backend, e.g. `http://127.0.0.1:4000` |

No secret is ever exposed to the browser. `BACKEND_URL` is read only on the server, and the JWT
lives in an httpOnly cookie that client JavaScript cannot read.

## 4. Set up the database

The frontend has no database of its own. Follow the backend README, and make sure the backend is
running before starting this app.

## 5. Start and restart the app

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

`npm run build` produces the Next.js production build; PM2 then runs `server.ts`, the custom
server described above, rather than `next start`.

| Action | Command |
| --- | --- |
| Restart | `pm2 restart lead-frontend` |
| Stop | `pm2 stop lead-frontend` |
| Status | `pm2 status` |
| Survive reboot | `pm2 save` (run once after the first successful start) |

Redeploying after a code change:

```bash
git pull
npm install
npm run build
pm2 restart lead-frontend
```

If `npm run build` runs out of memory on a small VPS:

```bash
NODE_OPTIONS=--max-old-space-size=2048 npm run build
```

## 6. Check logs

```bash
pm2 logs lead-frontend
pm2 logs lead-frontend --lines 200
pm2 logs lead-frontend --err
```

## 7. Access the deployed app

| What | Where |
| --- | --- |
| Admin | `http://<server-ip>:<frontend-port>/login` |
| Public form | `http://<server-ip>:<frontend-port>/<slug>` |

`/` redirects to `/admin`, which redirects to `/login` when signed out.

## Tests

```bash
npm test
```

Twelve React Testing Library cases covering the seams that matter:

- `useApi` - loading to success, loading to error, no fetch when the path is null, refetch
- the public form - renders after load, unknown slug, malformed email is rejected before any
  request, the thank-you state, and a server error that leaves the form usable
- the broker form - closing time must be after opening time, at least one working day, and the
  collected configuration is submitted correctly

`fetch` is stubbed with `vi.stubGlobal`, so the tests need neither the backend nor a database.

## Suggested review flow

1. Sign in at `/login`.
2. Create two or three brokers with different timezones and opening hours.
3. Try creating a distribution before a form exists - `Oops, please create a form first.`
4. Create the lead form. The page then refuses to create a second one.
5. Create the distribution, tick the brokers, set percentages.
6. Open the public form at `/{slug}` in a private window and submit a lead.
7. Check the Leads page - the IP address is recorded and a broker was assigned.
8. Submit the same email again - it becomes `duplicate`.
9. Open the Dashboard to see each broker's local time, opening hours, and cap usage, along with
   the reason any broker is currently skipped.
10. Set a broker's cap to a number it has already reached, or move its hours outside the current
    time, and submit again to watch it be skipped.
11. Manually assign an unsent lead from the Leads page.

## Known limitations

- Everything is fetched client-side, so pages show a loading state and then content. There is no
  server-side rendering of data and no polling - the dashboard is a snapshot, refresh to update.
- Lists are refetched manually after a mutation, so an unrelated view can briefly be stale.
- The domain types in `src/types` are duplicated by hand from the backend, since the two
  repositories are independent and share no package.
- Only the timezones listed in the broker form are offered; the backend accepts any valid IANA
  zone.
