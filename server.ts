import 'dotenv/config'
import { createServer } from 'node:http'
import { parse } from 'node:url'
import next from 'next'

const dev = process.env.NODE_ENV !== 'production'
const port = Number(process.env.PORT ?? 3000)
const hostname = process.env.HOSTNAME ?? '0.0.0.0'

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    if (!req.headers['x-forwarded-for'] && !req.headers['x-real-ip']) {
      const remoteAddress = req.socket.remoteAddress
      if (remoteAddress) {
        req.headers['x-real-ip'] = remoteAddress
      }
    }

    handle(req, res, parse(req.url ?? '/', true))
  }).listen(port, hostname, () => {
    console.log(`Frontend listening on http://${hostname}:${port}`)
  })
})
