/**
 * Island IO Dashboard — runtime configuration.
 *
 * Everything here can be overridden at runtime from the Settings panel in the
 * UI (values are persisted to localStorage), so you normally don't need to edit
 * this file. It just defines the defaults the dashboard boots with.
 */
window.IslandConfig = {
  /**
   * Data source mode:
   *   "mock"  -> use the bundled, realistic sample data (no network, no key).
   *   "live"  -> call the real Island Enterprise Browser API via `apiBaseUrl`.
   *
   * The dashboard ships in "mock" mode so it runs immediately by just opening
   * index.html. Flip to "live" from the Settings panel once you have a key.
   */
  mode: 'mock',

  /**
   * Base URL the live client targets.
   *
   * For the real Island API this is your Management Console host, e.g.
   *   https://<your-tenant>.island.io
   * Endpoints are served under `${apiBaseUrl}/api/v1/...`.
   *
   * If you run the bundled proxy (see /proxy), point this at the proxy instead,
   * e.g. http://localhost:8787 — the proxy injects the API key server-side and
   * adds the CORS headers a browser needs, so the key never ships to the client.
   */
  apiBaseUrl: 'http://localhost:8787',

  /**
   * API version segment. The Island Browser API is documented as v1.
   */
  apiVersion: 'v1',

  /**
   * How the API key is presented on each request.
   *
   * Island's Management Console issues an API Key (Settings > API, a.k.a.
   * Modules > Platform Settings > System Settings > Integrations > API). The
   * exact header varies by deployment, so it's configurable here. Common forms:
   *   { scheme: 'header', headerName: 'x-api-key' }
   *   { scheme: 'bearer' }                         -> Authorization: Bearer <key>
   */
  auth: {
    scheme: 'header',        // 'header' | 'bearer'
    headerName: 'x-api-key',
  },

  /**
   * API key for live mode. LEAVE BLANK in this file for static hosting — a key
   * placed here is visible to anyone who loads the page. Prefer the proxy
   * (which holds the key server-side) or enter it transiently via Settings.
   */
  apiKey: '',

  /**
   * Auto-refresh interval for live mode, in seconds. 0 disables polling.
   */
  refreshSeconds: 60,
};
