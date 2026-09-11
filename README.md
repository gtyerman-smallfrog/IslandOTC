# Island IO — Enterprise Browser Dashboard

A lightweight GUI dashboard for the **Island Enterprise Browser** API
([apitracker.io/a/island-io](https://apitracker.io/a/island-io)). It surfaces
devices, browser users, compromised credentials, security/audit events and admin
actions in one place — KPIs, charts, and sortable/searchable tables.

> Built as **plain HTML/CSS/JS — no build step, no dependencies.** Just open
> `index.html`. It ships with realistic **sample data** so it runs instantly,
> and includes a real `fetch`-based API client you can flip on for live data.

![tabs: Overview · Devices · Users · Credentials · Audit Events · Admin Actions](https://img.shields.io/badge/views-6-blue) ![no build](https://img.shields.io/badge/build-none-success) ![deps](https://img.shields.io/badge/dependencies-0-success)

## Bonus: Island Rail — a 3D train-set game

`train-set/index.html` is a self-contained 3D train-set game (three.js, no build
step). Open it directly or serve the repo and visit `/train-set/`.

- Starts with **Central Station** and a three-road **holding yard** with trains parked.
- **Drag to lay track** to the Harbour, Quarry, Hilltown and the **Airport**. Branch off a
  line for a switch, cross a line at right angles for a diamond.
- Track over a **road** becomes a level crossing with boom gates; track through a **hill**
  becomes a tunnel with portals (both cost extra).
- Four streets meet at **signalled intersections**. Cars, vans, buses and trucks queue at
  red, show brake lights, and pull away on green.
- The **airport** has a working runway: an airliner taxis, takes off, and comes back on
  approach, with more parked on the apron.
- Trains **obey the track controls**: red signals, switch settings, trains ahead,
  curve speed limits. Two trains on one tile is a crash.
- The island is **168x168 tiles**, six times the width of the original, with the city
  spread over only twice the area, so there is room on every side to expand.
- Deliveries between places earn money; Save/Load keeps your layout in the browser.

## Quick start

```bash
# Option A — just open it
open index.html              # macOS  (or double-click the file)

# Option B — serve it (recommended; avoids file:// quirks)
python3 -m http.server 8000  # then visit http://localhost:8000
```

That's it. The dashboard loads in **sample-data mode** — no API key, no network.

## What's inside

| View | Island endpoint modelled | Shows |
|------|--------------------------|-------|
| **Overview** | (aggregates all) | KPIs, 30-day event trend, verdict & posture donuts, top apps, blocked/warned feed |
| **Devices** | `GET /api/v1/devices` | Inventory, OS, browser version, posture, managed state, location, last seen |
| **Users** | `GET /api/v1/users` | Role, status, MFA, department, last active |
| **Credentials** | `GET /api/v1/compromised-credentials` | Exposed/compromised credentials, severity, breach source, status |
| **Audit Events** | `GET /api/v1/audit` (NDJSON SIEM stream) | Timeline of browser events with verdict, rule, app, IPs |
| **Admin Actions** | `GET /api/v1/admin-actions` | Console admin activity log |

Every table is sortable (click a header) and the top search box filters across
all tables at once.

## Can a static page really call the API from JavaScript?

Yes — `fetch()` works fine, and the client in
[`assets/js/api-client.js`](assets/js/api-client.js) sends the API key as the
`x-api-key` header (or a Bearer token) exactly as Island expects. **But** for
the *real* Island Management Console host, two things bite a pure static page:

1. **CORS** — the Island host won't return headers letting a browser read its
   responses cross-origin.
2. **Key exposure** — an API key in client-side JS is visible to anyone.

So for live data, run the bundled **proxy** (below), which holds the key
server-side and adds the CORS headers. The dashboard code is identical either
way — you just point it at the proxy.

## Going live

1. In the Island Management Console, generate an API key:
   **Settings → API** (a.k.a. *Modules → Platform Settings → System Settings →
   Integrations → API*). The key must belong to an admin / system-admin account.
2. Start the proxy (Node 18+, no `npm install` needed):

   ```bash
   ISLAND_BASE_URL=https://your-tenant.island.io \
   ISLAND_API_KEY=sk_live_xxx \
   ISLAND_AUTH_HEADER=x-api-key \
   node proxy/server.js
   ```

3. In the dashboard, open **⚙️ Settings**, set **Mode → Live Island API** and
   **API base URL → `http://localhost:8787`**, then **Save & reload**.

You can also point the dashboard straight at `https://your-tenant.island.io` and
enter the key in Settings — handy for quick local testing, but the proxy is the
right choice for anything shared (it keeps the key off the client).

## Configuration

Defaults live in [`assets/js/config.js`](assets/js/config.js); anything you
change in the **Settings** panel is saved to `localStorage` and overrides them.
Configurable: data `mode`, `apiBaseUrl`, `apiVersion`, auth scheme/header,
`apiKey`, and live-mode `refreshSeconds`.

## Project layout

```
index.html               App shell + tab/panel markup
assets/css/styles.css     Dark/light theme, layout, tables, charts
assets/js/
  config.js               Default runtime config
  api-client.js           IslandApiClient — fetch-based v1 client (paged + NDJSON)
  mock-data.js            Seeded, realistic sample dataset (real field names)
  data-service.js         Loads from mock or live; same shape either way
  charts.js               Tiny dependency-free SVG donut/bar/line charts
  app.js                  Controller: KPIs, charts, tables, search, settings
proxy/server.js           Optional Node proxy for live API (CORS + key safety)
```

## Notes on accuracy

Island's API docs sit behind a login, so endpoint paths and field names here are
modelled from Island's publicly documented SIEM/inventory integrations (Elastic,
Google Chronicle, Microsoft Sentinel) — e.g. the audit event fields `tenant_id,
timestamp, email, user_id, user_name, type, verdict, device_id, source_ip,
public_ip, top_level_url, rule_id, rule_name, saas_application_name,
machine_name`. If your tenant's paths differ, adjust them in `api-client.js` and
`config.js`; the UI binds to the field names, so it adapts with minimal changes.
