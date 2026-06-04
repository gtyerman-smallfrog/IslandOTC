/**
 * Mock data for the Island IO Dashboard.
 *
 * Field names mirror what Island's real API / SIEM export emits so the UI built
 * against this data works unchanged when you flip to live mode. Audit events use
 * the documented SIEM NDJSON fields: tenant_id, timestamp, email, user_id,
 * user_name, type, verdict, device_id, source_ip, public_ip, top_level_url,
 * rule_id, rule_name, saas_application_name, machine_name.
 *
 * Data is generated from a seeded PRNG so every reload is identical — handy for
 * demos, screenshots and reasoning about the numbers.
 */
(function () {
  // --- Seeded PRNG (mulberry32) so the demo is deterministic -----------------
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = makeRng(20260604);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const int = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  const chance = (p) => rng() < p;
  const pad = (n, w = 2) => String(n).padStart(w, '0');

  const TENANT_ID = 'tnt_8f31a0c4';
  const DOMAIN = 'acme.example.com';
  const FIRST = ['Ava', 'Liam', 'Noah', 'Mia', 'Ethan', 'Zoe', 'Lucas', 'Emma', 'Owen', 'Sofia',
    'Mason', 'Isla', 'Leo', 'Aria', 'Jack', 'Nora', 'Henry', 'Ruby', 'Finn', 'Chloe',
    'Caleb', 'Maya', 'Dylan', 'Hana', 'Omar', 'Priya', 'Wei', 'Yuki', 'Diego', 'Amara'];
  const LAST = ['Patel', 'Nguyen', 'Garcia', 'Smith', 'Kim', 'Johnson', 'Lopez', 'Brown',
    'Singh', 'Khan', 'Murphy', 'Rossi', 'Cohen', 'Wang', 'Silva', 'Hassan', 'Okafor',
    'Novak', 'Tanaka', 'Mwangi', 'Reyes', 'Petrov', 'Andersson', 'Costa'];
  const DEPARTMENTS = ['Engineering', 'Finance', 'Sales', 'Legal', 'Support', 'HR', 'Marketing', 'IT', 'Operations'];
  const OS_LIST = [
    { os: 'Windows', version: '11 23H2' }, { os: 'Windows', version: '10 22H2' },
    { os: 'macOS', version: '14.5 Sonoma' }, { os: 'macOS', version: '13.6 Ventura' },
    { os: 'ChromeOS', version: '126' }, { os: 'Linux', version: 'Ubuntu 24.04' },
  ];
  const BROWSER_VERSIONS = ['1.42.117', '1.42.110', '1.41.98', '1.40.85', '1.39.77'];
  const CITIES = [
    { city: 'New York', cc: 'US' }, { city: 'London', cc: 'GB' }, { city: 'Sydney', cc: 'AU' },
    { city: 'Toronto', cc: 'CA' }, { city: 'Berlin', cc: 'DE' }, { city: 'Singapore', cc: 'SG' },
    { city: 'Austin', cc: 'US' }, { city: 'Bengaluru', cc: 'IN' }, { city: 'São Paulo', cc: 'BR' },
  ];
  const SAAS = ['Salesforce', 'Workday', 'GitHub', 'Microsoft 365', 'Google Workspace', 'Jira',
    'ServiceNow', 'Slack', 'Notion', 'Box', 'ChatGPT', 'Snowflake', 'Zendesk', 'NetSuite'];
  const EVENT_TYPES = ['url_visit', 'file_download', 'file_upload', 'clipboard_paste', 'screenshot',
    'data_exfil_attempt', 'login', 'extension_blocked', 'print', 'dlp_match'];
  const VERDICTS = ['allowed', 'blocked', 'warned', 'logged'];
  const RULES = [
    { rule_id: 'rule_dlp_ssn', rule_name: 'Block SSN in uploads' },
    { rule_id: 'rule_dlp_pci', rule_name: 'Mask credit card numbers' },
    { rule_id: 'rule_genai', rule_name: 'GenAI prompt inspection' },
    { rule_id: 'rule_download', rule_name: 'Restrict downloads from unmanaged SaaS' },
    { rule_id: 'rule_paste', rule_name: 'Clipboard guard for source code' },
    { rule_id: 'rule_print', rule_name: 'Watermark + log prints' },
    { rule_id: 'rule_ext', rule_name: 'Extension allowlist' },
  ];
  const ADMIN_ACTIONS = [
    { action: 'policy.update', target: 'DLP / GenAI Guardrails' },
    { action: 'policy.create', target: 'Contractor Browsing Profile' },
    { action: 'user.role_change', target: 'role=admin' },
    { action: 'url_list.update', target: 'Blocked Categories' },
    { action: 'config.update', target: 'SSO / SAML' },
    { action: 'apikey.create', target: 'SIEM export key' },
    { action: 'device.revoke', target: 'lost-laptop' },
    { action: 'policy.delete', target: 'Legacy VPN Profile' },
  ];

  function isoDaysAgo(daysAgo, jitterHours = 24) {
    const d = new Date('2026-06-04T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - daysAgo);
    d.setUTCHours(int(0, 23), int(0, 59), int(0, 59), 0);
    return d.toISOString();
  }
  function ip() { return `${int(11, 223)}.${int(0, 255)}.${int(0, 255)}.${int(1, 254)}`; }
  function privateIp() { return `10.${int(0, 40)}.${int(0, 255)}.${int(2, 254)}`; }

  // --- Users -----------------------------------------------------------------
  const NUM_USERS = 48;
  const users = [];
  for (let i = 0; i < NUM_USERS; i++) {
    const first = pick(FIRST), last = pick(LAST);
    const name = `${first} ${last}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@${DOMAIN}`;
    const dept = pick(DEPARTMENTS);
    const status = chance(0.88) ? 'active' : chance(0.5) ? 'invited' : 'suspended';
    users.push({
      user_id: `usr_${pad(1000 + i, 4)}`,
      tenant_id: TENANT_ID,
      user_name: name,
      email,
      department: dept,
      role: i < 3 ? 'system_admin' : i < 7 ? 'admin' : 'member',
      status,
      mfa_enabled: chance(0.82),
      last_active: isoDaysAgo(int(0, status === 'active' ? 3 : 30)),
      created_at: isoDaysAgo(int(40, 400)),
    });
  }

  // --- Devices ---------------------------------------------------------------
  const NUM_DEVICES = 62;
  const devices = [];
  for (let i = 0; i < NUM_DEVICES; i++) {
    const owner = pick(users);
    const osInfo = pick(OS_LIST);
    const loc = pick(CITIES);
    const compliant = chance(0.8);
    const lastSeenDays = int(0, 21);
    devices.push({
      device_id: `dev_${pad(2000 + i, 4)}`,
      tenant_id: TENANT_ID,
      machine_name: `${owner.user_name.split(' ')[0].toLowerCase()}-${osInfo.os.toLowerCase()}-${pad(i, 2)}`,
      user_id: owner.user_id,
      user_name: owner.user_name,
      email: owner.email,
      os: osInfo.os,
      os_version: osInfo.version,
      browser_version: pick(BROWSER_VERSIONS),
      managed: chance(0.85),
      compliant,
      posture: compliant ? pick(['secure', 'secure', 'secure', 'attention']) : pick(['attention', 'at_risk']),
      disk_encrypted: chance(0.9),
      city: loc.city,
      country: loc.cc,
      public_ip: ip(),
      last_seen: isoDaysAgo(lastSeenDays),
      enrolled_at: isoDaysAgo(int(20, 380)),
      active: lastSeenDays <= 7,
    });
  }

  // --- Compromised credentials ----------------------------------------------
  const compromisedCredentials = [];
  const NUM_COMP = 14;
  const breachSources = ['Collection #1', 'LinkedIn 2021', 'Dropbox', 'Adobe', 'Dark web paste',
    'Stealer log (RedLine)', 'Stealer log (Lumma)', 'Public combo list'];
  for (let i = 0; i < NUM_COMP; i++) {
    const u = pick(users);
    const sev = chance(0.3) ? 'critical' : chance(0.5) ? 'high' : 'medium';
    compromisedCredentials.push({
      id: `cc_${pad(3000 + i, 4)}`,
      tenant_id: TENANT_ID,
      user_id: u.user_id,
      user_name: u.user_name,
      email: u.email,
      source: pick(breachSources),
      severity: sev,
      password_exposed: chance(0.6),
      status: chance(0.45) ? 'remediated' : 'open',
      detected_at: isoDaysAgo(int(0, 45)),
      saas_application_name: pick(SAAS),
    });
  }

  // --- Audit / timeline events (SIEM NDJSON shape) ---------------------------
  const auditEvents = [];
  const NUM_EVENTS = 900;
  for (let i = 0; i < NUM_EVENTS; i++) {
    const dev = pick(devices);
    const type = pick(EVENT_TYPES);
    // Weight verdicts: most allowed, some blocked/warned for risky types.
    let verdict;
    if (type === 'data_exfil_attempt' || type === 'dlp_match') verdict = chance(0.7) ? 'blocked' : 'warned';
    else if (type === 'extension_blocked') verdict = 'blocked';
    else verdict = chance(0.85) ? 'allowed' : pick(['warned', 'blocked', 'logged']);
    const rule = (verdict === 'blocked' || verdict === 'warned' || type === 'dlp_match') ? pick(RULES) : { rule_id: '', rule_name: '' };
    const saas = pick(SAAS);
    auditEvents.push({
      tenant_id: TENANT_ID,
      timestamp: isoDaysAgo(int(0, 29)),
      event_id: `evt_${pad(40000 + i, 6)}`,
      user_id: dev.user_id,
      user_name: dev.user_name,
      email: dev.email,
      type,
      verdict,
      device_id: dev.device_id,
      machine_name: dev.machine_name,
      source_ip: privateIp(),
      public_ip: dev.public_ip,
      top_level_url: `https://${saas.toLowerCase().replace(/[^a-z]/g, '')}.com/app`,
      rule_id: rule.rule_id,
      rule_name: rule.rule_name,
      saas_application_name: saas,
    });
  }
  auditEvents.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // --- Admin actions ---------------------------------------------------------
  const adminActions = [];
  const admins = users.filter((u) => u.role !== 'member');
  for (let i = 0; i < 60; i++) {
    const a = pick(admins);
    const act = pick(ADMIN_ACTIONS);
    adminActions.push({
      id: `adm_${pad(5000 + i, 4)}`,
      tenant_id: TENANT_ID,
      timestamp: isoDaysAgo(int(0, 29)),
      admin_user_id: a.user_id,
      admin_user_name: a.user_name,
      admin_email: a.email,
      action: act.action,
      target: act.target,
      source_ip: ip(),
      result: chance(0.95) ? 'success' : 'failure',
    });
  }
  adminActions.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  window.IslandMockData = {
    tenant_id: TENANT_ID,
    generated_at: '2026-06-04T12:00:00Z',
    users,
    devices,
    compromisedCredentials,
    auditEvents,
    adminActions,
  };
})();
