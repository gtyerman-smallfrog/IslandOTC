/**
 * Island IO Dashboard — application controller.
 * Wires config + data service + charts into the tabbed UI in index.html.
 */
(function () {
  const LS_KEY = 'island.dashboard.config.v1';

  // Merge persisted overrides over the file defaults.
  function loadConfig() {
    const base = structuredClone(window.IslandConfig);
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      return { ...base, ...saved, auth: { ...base.auth, ...(saved.auth || {}) } };
    } catch { return base; }
  }
  function saveConfig(cfg) {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
  }

  const COLORS = {
    blue: '#5b8def', green: '#34c759', amber: '#ff9f0a', red: '#ff453a',
    purple: '#bf5af2', teal: '#40c8e0', gray: '#8e8e93', slate: '#64748b',
  };
  const VERDICT_COLOR = { allowed: COLORS.green, blocked: COLORS.red, warned: COLORS.amber, logged: COLORS.gray };
  const SEV_COLOR = { critical: COLORS.red, high: COLORS.amber, medium: COLORS.blue, low: COLORS.gray };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const fmt = (n) => Number(n).toLocaleString();
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dayKey = (iso) => iso.slice(0, 10);
  const shortTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const State = {
    config: loadConfig(),
    service: null,
    data: null,
    activeTab: 'overview',
    timer: null,
  };

  // --- Boot ------------------------------------------------------------------
  async function boot() {
    State.service = new DataService(State.config);
    bindChrome();
    await refresh();
    scheduleRefresh();
  }

  function bindChrome() {
    $$('.tab').forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
    $('#refreshBtn').addEventListener('click', () => refresh());
    $('#settingsBtn').addEventListener('click', openSettings);
    $('#settingsClose').addEventListener('click', closeSettings);
    $('#settingsForm').addEventListener('submit', onSaveSettings);
    $('#globalSearch').addEventListener('input', (e) => onSearch(e.target.value));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSettings(); });
  }

  function scheduleRefresh() {
    if (State.timer) clearInterval(State.timer);
    const secs = Number(State.config.refreshSeconds) || 0;
    if (State.config.mode === 'live' && secs > 0) {
      State.timer = setInterval(() => refresh(true), secs * 1000);
    }
  }

  async function refresh(silent = false) {
    const statusEl = $('#dataStatus');
    if (!silent) setLoading(true);
    statusEl.textContent = 'Loading…';
    try {
      State.service = new DataService(State.config);
      State.data = await State.service.load();
      renderAll();
      const when = new Date().toLocaleTimeString();
      statusEl.innerHTML = `<span class="dot ${State.data.source}"></span>${State.data.source === 'mock' ? 'Sample data' : 'Live'} · tenant <code>${esc(State.data.tenant_id)}</code> · ${when}`;
    } catch (err) {
      console.error(err);
      statusEl.innerHTML = `<span class="dot err"></span>Error: ${esc(err.message)}`;
    } finally {
      setLoading(false);
    }
  }

  function setLoading(on) {
    $('#app').classList.toggle('loading', on);
  }

  function switchTab(tab) {
    State.activeTab = tab;
    $$('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    $$('.panel').forEach((p) => p.classList.toggle('active', p.id === `panel-${tab}`));
  }

  // --- Rendering -------------------------------------------------------------
  function renderAll() {
    renderKpis();
    renderOverviewCharts();
    renderDevices();
    renderUsers();
    renderCredentials();
    renderEvents();
    renderAdmin();
  }

  function renderKpis() {
    const { devices, users, compromisedCredentials, auditEvents } = State.data;
    const activeDevices = devices.filter((d) => d.active).length;
    const atRisk = devices.filter((d) => d.posture === 'at_risk' || !d.compliant).length;
    const openCreds = compromisedCredentials.filter((c) => c.status === 'open').length;
    const blocked = auditEvents.filter((e) => e.verdict === 'blocked').length;
    const mfaPct = Math.round((users.filter((u) => u.mfa_enabled).length / Math.max(1, users.length)) * 100);

    const kpis = [
      { label: 'Active devices', value: fmt(activeDevices), sub: `${fmt(devices.length)} enrolled`, color: COLORS.blue, icon: '🖥️' },
      { label: 'Browser users', value: fmt(users.length), sub: `${mfaPct}% MFA enabled`, color: COLORS.purple, icon: '👤' },
      { label: 'Devices needing attention', value: fmt(atRisk), sub: 'non-compliant / at-risk', color: atRisk ? COLORS.amber : COLORS.green, icon: '⚠️' },
      { label: 'Open compromised creds', value: fmt(openCreds), sub: `${fmt(compromisedCredentials.length)} total found`, color: openCreds ? COLORS.red : COLORS.green, icon: '🔑' },
      { label: 'Blocked events (30d)', value: fmt(blocked), sub: `${fmt(auditEvents.length)} events seen`, color: COLORS.teal, icon: '🛡️' },
    ];
    $('#kpis').innerHTML = kpis.map((k) => `
      <div class="kpi" style="--accent:${k.color}">
        <div class="kpi-icon">${k.icon}</div>
        <div class="kpi-body">
          <div class="kpi-value">${k.value}</div>
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-sub">${k.sub}</div>
        </div>
      </div>`).join('');
  }

  function renderOverviewCharts() {
    const { auditEvents, devices, compromisedCredentials } = State.data;

    // Events per day (last 30) line chart
    const byDay = {};
    auditEvents.forEach((e) => { byDay[dayKey(e.timestamp)] = (byDay[dayKey(e.timestamp)] || 0) + 1; });
    const days = Object.keys(byDay).sort();
    IslandCharts.line($('#chartEventsTrend'),
      days.map((d) => ({ label: d.slice(5), value: byDay[d] })), { color: COLORS.blue });

    // Verdict breakdown donut
    const verdictCounts = {};
    auditEvents.forEach((e) => { verdictCounts[e.verdict] = (verdictCounts[e.verdict] || 0) + 1; });
    IslandCharts.donut($('#chartVerdicts'),
      Object.entries(verdictCounts).map(([k, v]) => ({ label: k, value: v, color: VERDICT_COLOR[k] || COLORS.gray })),
      { centerLabel: 'events' });

    // Device posture donut
    const posture = {};
    devices.forEach((d) => { const p = d.compliant ? (d.posture === 'attention' ? 'attention' : 'secure') : 'at_risk'; posture[p] = (posture[p] || 0) + 1; });
    IslandCharts.donut($('#chartPosture'),
      [
        { label: 'secure', value: posture.secure || 0, color: COLORS.green },
        { label: 'attention', value: posture.attention || 0, color: COLORS.amber },
        { label: 'at risk', value: posture.at_risk || 0, color: COLORS.red },
      ], { centerLabel: 'devices' });

    // Top SaaS by event volume
    const saas = {};
    auditEvents.forEach((e) => { if (e.saas_application_name) saas[e.saas_application_name] = (saas[e.saas_application_name] || 0) + 1; });
    const topSaas = Object.entries(saas).sort((a, b) => b[1] - a[1]).slice(0, 8);
    IslandCharts.bars($('#chartTopSaas'),
      topSaas.map(([k, v]) => ({ label: k, value: v })), { color: COLORS.purple, barLabelRotate: true });

    // Recent high-signal events feed
    const feed = auditEvents
      .filter((e) => e.verdict === 'blocked' || e.verdict === 'warned')
      .slice(0, 8);
    $('#overviewFeed').innerHTML = feed.map((e) => `
      <li>
        <span class="badge ${e.verdict}">${e.verdict}</span>
        <span class="feed-main"><b>${esc(e.type)}</b> · ${esc(e.user_name)}</span>
        <span class="feed-meta">${esc(e.rule_name || e.saas_application_name)} · ${shortTime(e.timestamp)}</span>
      </li>`).join('') || '<li class="muted">No blocked or warned events.</li>';

    // Open critical credentials count badge on overview
    const crit = compromisedCredentials.filter((c) => c.status === 'open' && c.severity === 'critical').length;
    $('#overviewCredNote').textContent = crit
      ? `${crit} open credential exposure${crit > 1 ? 's' : ''} rated critical — review the Credentials tab.`
      : 'No open critical credential exposures.';
  }

  // Generic sortable/filterable table renderer.
  function renderTable(mountId, rows, columns, opts = {}) {
    const mount = $(mountId);
    const state = mount._tableState || (mount._tableState = { sortKey: opts.defaultSort, sortDir: opts.defaultDir || 'asc', filter: '' });
    const filterText = (opts.searchOverride != null ? opts.searchOverride : state.filter).toLowerCase();

    let view = rows.slice();
    if (filterText) {
      view = view.filter((r) => columns.some((c) => String(c.value ? c.value(r) : r[c.key] ?? '').toLowerCase().includes(filterText)));
    }
    if (state.sortKey) {
      const col = columns.find((c) => c.key === state.sortKey);
      view.sort((a, b) => {
        const av = col.sortValue ? col.sortValue(a) : (col.value ? col.value(a) : a[col.key]);
        const bv = col.sortValue ? col.sortValue(b) : (col.value ? col.value(b) : b[col.key]);
        if (av < bv) return state.sortDir === 'asc' ? -1 : 1;
        if (av > bv) return state.sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const head = columns.map((c) => {
      const arrow = state.sortKey === c.key ? (state.sortDir === 'asc' ? ' ▲' : ' ▼') : '';
      return `<th data-key="${c.key}" class="${c.sortable === false ? '' : 'sortable'}">${esc(c.label)}${arrow}</th>`;
    }).join('');
    const body = view.slice(0, opts.limit || 500).map((r) => `<tr>${columns.map((c) => `<td>${c.render ? c.render(r) : esc(c.value ? c.value(r) : r[c.key])}</td>`).join('')}</tr>`).join('');

    mount.innerHTML = `
      <div class="table-meta">${fmt(view.length)} of ${fmt(rows.length)} rows${opts.limit && view.length > opts.limit ? ` (showing ${opts.limit})` : ''}</div>
      <div class="table-wrap"><table>
        <thead><tr>${head}</tr></thead>
        <tbody>${body || `<tr><td colspan="${columns.length}" class="muted">No matching rows.</td></tr>`}</tbody>
      </table></div>`;

    $$('th.sortable', mount).forEach((th) => th.addEventListener('click', () => {
      const key = th.dataset.key;
      if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      else { state.sortKey = key; state.sortDir = 'asc'; }
      renderTable(mountId, rows, columns, opts);
    }));
  }

  function pill(text, cls) { return `<span class="badge ${cls}">${esc(text)}</span>`; }

  function renderDevices() {
    const rows = State.data.devices;
    renderTable('#tableDevices', rows, [
      { key: 'machine_name', label: 'Device', render: (r) => `<b>${esc(r.machine_name)}</b>` },
      { key: 'user_name', label: 'User' },
      { key: 'os', label: 'OS', render: (r) => `${esc(r.os)} <span class="muted">${esc(r.os_version)}</span>` },
      { key: 'browser_version', label: 'Browser' },
      { key: 'posture', label: 'Posture', render: (r) => pill(r.compliant ? (r.posture === 'attention' ? 'attention' : 'secure') : 'at risk', r.compliant ? (r.posture === 'attention' ? 'warned' : 'allowed') : 'blocked') },
      { key: 'managed', label: 'Managed', render: (r) => r.managed ? '✅' : '—', sortValue: (r) => (r.managed ? 1 : 0) },
      { key: 'country', label: 'Location', render: (r) => `${esc(r.city)}, ${esc(r.country)}` },
      { key: 'last_seen', label: 'Last seen', render: (r) => shortTime(r.last_seen), sortValue: (r) => r.last_seen },
    ], { defaultSort: 'last_seen', defaultDir: 'desc', searchOverride: globalSearchValue() });
  }

  function renderUsers() {
    const rows = State.data.users;
    renderTable('#tableUsers', rows, [
      { key: 'user_name', label: 'Name', render: (r) => `<b>${esc(r.user_name)}</b>` },
      { key: 'email', label: 'Email' },
      { key: 'department', label: 'Department' },
      { key: 'role', label: 'Role', render: (r) => pill(r.role.replace('_', ' '), r.role === 'member' ? 'logged' : 'warned') },
      { key: 'status', label: 'Status', render: (r) => pill(r.status, r.status === 'active' ? 'allowed' : r.status === 'suspended' ? 'blocked' : 'logged') },
      { key: 'mfa_enabled', label: 'MFA', render: (r) => r.mfa_enabled ? '✅' : '<span class="badge blocked">off</span>', sortValue: (r) => (r.mfa_enabled ? 1 : 0) },
      { key: 'last_active', label: 'Last active', render: (r) => shortTime(r.last_active), sortValue: (r) => r.last_active },
    ], { defaultSort: 'last_active', defaultDir: 'desc', searchOverride: globalSearchValue() });
  }

  function renderCredentials() {
    const rows = State.data.compromisedCredentials;
    renderTable('#tableCreds', rows, [
      { key: 'user_name', label: 'User', render: (r) => `<b>${esc(r.user_name)}</b>` },
      { key: 'email', label: 'Email' },
      { key: 'severity', label: 'Severity', render: (r) => pill(r.severity, r.severity === 'critical' ? 'blocked' : r.severity === 'high' ? 'warned' : 'logged'), sortValue: (r) => ({ critical: 3, high: 2, medium: 1, low: 0 }[r.severity]) },
      { key: 'source', label: 'Source' },
      { key: 'saas_application_name', label: 'Application' },
      { key: 'password_exposed', label: 'Password', render: (r) => r.password_exposed ? '<span class="badge blocked">exposed</span>' : '—', sortValue: (r) => (r.password_exposed ? 1 : 0) },
      { key: 'status', label: 'Status', render: (r) => pill(r.status, r.status === 'open' ? 'blocked' : 'allowed') },
      { key: 'detected_at', label: 'Detected', render: (r) => shortTime(r.detected_at), sortValue: (r) => r.detected_at },
    ], { defaultSort: 'severity', defaultDir: 'desc', searchOverride: globalSearchValue() });
  }

  function renderEvents() {
    const rows = State.data.auditEvents;
    renderTable('#tableEvents', rows, [
      { key: 'timestamp', label: 'Time', render: (r) => shortTime(r.timestamp), sortValue: (r) => r.timestamp },
      { key: 'type', label: 'Type', render: (r) => `<b>${esc(r.type)}</b>` },
      { key: 'verdict', label: 'Verdict', render: (r) => pill(r.verdict, r.verdict) },
      { key: 'user_name', label: 'User' },
      { key: 'machine_name', label: 'Device' },
      { key: 'saas_application_name', label: 'Application' },
      { key: 'rule_name', label: 'Rule', render: (r) => esc(r.rule_name) || '<span class="muted">—</span>' },
      { key: 'public_ip', label: 'Public IP' },
    ], { defaultSort: 'timestamp', defaultDir: 'desc', limit: 300, searchOverride: globalSearchValue() });
  }

  function renderAdmin() {
    const rows = State.data.adminActions;
    renderTable('#tableAdmin', rows, [
      { key: 'timestamp', label: 'Time', render: (r) => shortTime(r.timestamp), sortValue: (r) => r.timestamp },
      { key: 'admin_user_name', label: 'Admin', render: (r) => `<b>${esc(r.admin_user_name)}</b>` },
      { key: 'action', label: 'Action', render: (r) => pill(r.action, 'logged') },
      { key: 'target', label: 'Target' },
      { key: 'result', label: 'Result', render: (r) => pill(r.result, r.result === 'success' ? 'allowed' : 'blocked') },
      { key: 'source_ip', label: 'Source IP' },
    ], { defaultSort: 'timestamp', defaultDir: 'desc', searchOverride: globalSearchValue() });
  }

  // --- Global search ---------------------------------------------------------
  let _search = '';
  function globalSearchValue() { return _search; }
  function onSearch(v) {
    _search = v.trim();
    // Re-render only the table panels (overview ignores search).
    renderDevices(); renderUsers(); renderCredentials(); renderEvents(); renderAdmin();
  }

  // --- Settings panel --------------------------------------------------------
  function openSettings() {
    const c = State.config;
    $('#f_mode').value = c.mode;
    $('#f_baseUrl').value = c.apiBaseUrl;
    $('#f_version').value = c.apiVersion;
    $('#f_scheme').value = c.auth.scheme;
    $('#f_headerName').value = c.auth.headerName || 'x-api-key';
    $('#f_apiKey').value = c.apiKey || '';
    $('#f_refresh').value = c.refreshSeconds;
    $('#settingsOverlay').classList.add('open');
  }
  function closeSettings() { $('#settingsOverlay').classList.remove('open'); }

  function onSaveSettings(e) {
    e.preventDefault();
    State.config = {
      ...State.config,
      mode: $('#f_mode').value,
      apiBaseUrl: $('#f_baseUrl').value.trim(),
      apiVersion: $('#f_version').value.trim() || 'v1',
      apiKey: $('#f_apiKey').value.trim(),
      refreshSeconds: Number($('#f_refresh').value) || 0,
      auth: { scheme: $('#f_scheme').value, headerName: $('#f_headerName').value.trim() || 'x-api-key' },
    };
    saveConfig(State.config);
    closeSettings();
    scheduleRefresh();
    refresh();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
