/**
 * IslandApiClient — a thin, dependency-free client for the Island Enterprise
 * Browser REST API (v1).
 *
 * Endpoints modelled here (read paths, as surfaced by Island's published SIEM /
 * inventory integrations — Elastic, Google Chronicle, Microsoft Sentinel, etc.):
 *
 *   GET /api/v1/devices                  Device inventory
 *   GET /api/v1/users                    Browser users
 *   GET /api/v1/compromised-credentials  Compromised / exposed credentials
 *   GET /api/v1/audit                    Audit / timeline events (security)
 *   GET /api/v1/admin-actions            Admin action log
 *
 * The Island "SIEM Audit logs" stream returns NDJSON (one JSON event per line);
 * `fetchNdjson` handles that shape. Classic resource endpoints return JSON with
 * a paginated envelope ({ data: [...], nextCursor }) — `fetchPaged` walks it.
 *
 * Auth: an API key issued from the Island Management Console, sent either as a
 * custom header (default `x-api-key`) or as a Bearer token — see config.auth.
 *
 * NOTE ON CORS: calling the real Island host straight from a browser will
 * usually be blocked by CORS and would expose your key. Point `apiBaseUrl` at
 * the bundled proxy (/proxy) for live use; this client code is identical either
 * way.
 */
class IslandApiClient {
  constructor(config) {
    this.config = config;
  }

  get base() {
    return `${this.config.apiBaseUrl.replace(/\/$/, '')}/api/${this.config.apiVersion}`;
  }

  _headers() {
    const headers = { Accept: 'application/json' };
    const { auth, apiKey } = this.config;
    if (apiKey) {
      if (auth.scheme === 'bearer') {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else {
        headers[auth.headerName || 'x-api-key'] = apiKey;
      }
    }
    return headers;
  }

  async _get(path, params = {}) {
    const url = new URL(`${this.base}${path}`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: this._headers(),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new IslandApiError(res.status, res.statusText, body, url.toString());
    }
    return res;
  }

  /**
   * Walk a cursor-paginated JSON resource and return all rows. Defensive about
   * the exact envelope shape since Island responses vary by resource.
   */
  async fetchPaged(path, { pageSize = 200, params = {}, maxPages = 50 } = {}) {
    const rows = [];
    let cursor;
    for (let page = 0; page < maxPages; page++) {
      const res = await this._get(path, { ...params, limit: pageSize, cursor });
      const json = await res.json();
      const batch = Array.isArray(json) ? json : json.data || json.items || json.results || [];
      rows.push(...batch);
      cursor = json.nextCursor || json.next_cursor || json.cursor;
      const headerCursor = res.headers.get('x-next-cursor');
      cursor = cursor || headerCursor;
      if (!cursor || batch.length === 0) break;
    }
    return rows;
  }

  /**
   * Read an NDJSON stream (the SIEM audit-log shape) into an array of events.
   */
  async fetchNdjson(path, { params = {} } = {}) {
    const res = await this._get(path, params);
    const text = await res.text();
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter(Boolean);
  }

  // --- Typed resource helpers -------------------------------------------------

  getDevices(params)              { return this.fetchPaged('/devices', { params }); }
  getUsers(params)                { return this.fetchPaged('/users', { params }); }
  getCompromisedCredentials(params){ return this.fetchPaged('/compromised-credentials', { params }); }
  getAdminActions(params)         { return this.fetchPaged('/admin-actions', { params }); }

  /**
   * Audit/timeline events. Island exposes these both as a paginated JSON
   * resource and (since mid-2025) as an NDJSON SIEM stream. Try NDJSON first,
   * fall back to the paged resource.
   */
  async getAuditEvents(params) {
    try {
      const events = await this.fetchNdjson('/audit', { params });
      if (events.length) return events;
    } catch (_) { /* fall through to paged */ }
    return this.fetchPaged('/audit', { params });
  }
}

class IslandApiError extends Error {
  constructor(status, statusText, body, url) {
    super(`Island API ${status} ${statusText} for ${url}`);
    this.name = 'IslandApiError';
    this.status = status;
    this.body = body;
    this.url = url;
  }
}

window.IslandApiClient = IslandApiClient;
window.IslandApiError = IslandApiError;
