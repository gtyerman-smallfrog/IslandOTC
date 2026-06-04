/**
 * DataService — single entry point the UI uses to load data. It hides whether
 * the rows came from the bundled mock dataset or a live Island API call, so the
 * rendering code never branches on mode.
 */
class DataService {
  constructor(config) {
    this.config = config;
    this.client = new IslandApiClient(config);
  }

  get mode() { return this.config.mode; }

  async load() {
    if (this.config.mode === 'live') return this._loadLive();
    return this._loadMock();
  }

  async _loadMock() {
    // Clone so views can't mutate the shared dataset.
    const d = window.IslandMockData;
    return {
      source: 'mock',
      tenant_id: d.tenant_id,
      generated_at: d.generated_at,
      users: structuredClone(d.users),
      devices: structuredClone(d.devices),
      compromisedCredentials: structuredClone(d.compromisedCredentials),
      auditEvents: structuredClone(d.auditEvents),
      adminActions: structuredClone(d.adminActions),
    };
  }

  async _loadLive() {
    if (!this.config.apiKey && this.config.auth.scheme) {
      // Proxy deployments hold the key server-side, so a blank key is fine when
      // apiBaseUrl points at the proxy; we only warn, never block.
      console.info('[Island] No client-side API key set — relying on proxy/credentials at apiBaseUrl.');
    }
    const [users, devices, compromisedCredentials, auditEvents, adminActions] = await Promise.all([
      this.client.getUsers().catch(this._soft('users')),
      this.client.getDevices().catch(this._soft('devices')),
      this.client.getCompromisedCredentials().catch(this._soft('compromised-credentials')),
      this.client.getAuditEvents().catch(this._soft('audit')),
      this.client.getAdminActions().catch(this._soft('admin-actions')),
    ]);
    return {
      source: 'live',
      tenant_id: (devices[0] && devices[0].tenant_id) || (users[0] && users[0].tenant_id) || '—',
      generated_at: new Date().toISOString(),
      users, devices, compromisedCredentials, auditEvents, adminActions,
    };
  }

  // Per-endpoint soft failure: log and return [] so one bad endpoint doesn't
  // blank the whole dashboard.
  _soft(label) {
    return (err) => {
      console.error(`[Island] Failed to load ${label}:`, err);
      this.lastError = err;
      return [];
    };
  }
}

window.DataService = DataService;
