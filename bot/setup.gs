// ============================================================
// setup.gs - One-time setup, trigger management, and webhook
// ============================================================

function createSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  function ensureSheet(name, headers, colour) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground(colour)
        .setFontColor(colour === '#FBBC04' ? '#000000' : '#FFFFFF');
      sheet.setFrozenRows(1);
    }
    return sheet;
  }

  ensureSheet('Users', ['chat_id', 'name', 'join_date', 'is_admin', 'baseline_present', 'baseline_total', 'kpi_public'], '#4285F4');
  ensureSheet('Attendance', ['chat_id', 'date', 'status', 'marked_at'], '#34A853');
  ensureSheet('Holidays', ['date', 'reason', 'added_by'], '#FBBC04');
  ensureSheet('Config', ['key', 'value'], '#EA4335');
  ensureSheet('AuditLog', ['timestamp', 'actor_chat_id', 'action', 'target', 'details'], '#9334E6');
  ensureSheet('GrowKPI', ['chat_id', 'date', 'metric_key', 'value', 'source'], '#00ACC1');
}

function seedConfig() {
  const defaults = [
    ['BOT_TOKEN', ''],
    ['MIN_PERCENT', '75'],
    ['TERM_START_DATE', '2026-07-01'],
    ['DAILY_PROMPT_HOUR', '8'],
    ['DAILY_PROMPT_MIN', '30'],
    ['NUDGE_HOUR', '9'],
    ['NUDGE_MIN', '15'],
    ['CUTOFF_HOUR', '9'],
    ['CUTOFF_MIN', '30'],
    ['WORK_DAYS', '1,2,3,4,5,6'],
    ['ADMIN_IDS', ''],
    ['WEBHOOK_URL', ''],
    ['WEBHOOK_SECRET', Utilities.getUuid().replace(/-/g, '')],
    ['GROQ_API_KEY', '']
  ];
  defaults.forEach(([key, value]) => {
    if (!getConfig(key)) setConfig(key, value);
  });
}

function onInstall() {
  createSheets();
  seedConfig();
  Logger.log('AttendBuddy setup complete. Fill BOT_TOKEN, deploy, then run deployWebhook() and createTriggers().');
}

function deployWebhook() {
  let url = getConfig('WEBHOOK_URL');
  if (!url || url.endsWith('/dev')) {
    const serviceUrl = ScriptApp.getService().getUrl();
    if (!serviceUrl) {
      Logger.log('WEBHOOK_URL is empty. Paste the deployed /exec URL into Config and retry.');
      return;
    }
    url = serviceUrl.replace('/dev', '/exec');
    setConfig('WEBHOOK_URL', url);
  }

  let secret = getConfig('WEBHOOK_SECRET');
  if (!secret) {
    secret = Utilities.getUuid().replace(/-/g, '');
    setConfig('WEBHOOK_SECRET', secret);
  }
  const separator = url.indexOf('?') >= 0 ? '&' : '?';
  const securedUrl = url + separator + 'secret=' + encodeURIComponent(secret);
  const result = setWebhook(securedUrl);
  if (result && result.ok) Logger.log('Webhook successfully registered (secret protected): ' + url);
  else Logger.log('Webhook registration failed: ' + JSON.stringify(result));
}

function createTriggers() {
  deleteTriggers();
  ScriptApp.newTrigger('sendDailyPrompt').timeBased().atHour(8).nearMinute(30).everyDays(1).inTimezone('Asia/Kolkata').create();
  ScriptApp.newTrigger('sendNudge').timeBased().atHour(9).nearMinute(15).everyDays(1).inTimezone('Asia/Kolkata').create();
  ScriptApp.newTrigger('autoMarkAbsent').timeBased().atHour(9).nearMinute(30).everyDays(1).inTimezone('Asia/Kolkata').create();
  Logger.log('AttendBuddy triggers created.');
}

function deleteTriggers() {
  ['sendDailyPrompt', 'sendNudge', 'autoMarkAbsent'].forEach(function (name) {
    ScriptApp.getProjectTriggers()
      .filter(function (trigger) { return trigger.getHandlerFunction() === name; })
      .forEach(function (trigger) { ScriptApp.deleteTrigger(trigger); });
  });
}

function testSendMessage() {
  const TEST_CHAT_ID = '';
  if (!TEST_CHAT_ID) { Logger.log('Set TEST_CHAT_ID first.'); return; }
  Logger.log(JSON.stringify(sendMessage(TEST_CHAT_ID, 'AttendBuddy test message - bot is working.')));
}

function testDailyPrompt() {
  sendDailyPrompt();
}
