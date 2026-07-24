// ============================================================
// Code.gs — Main entry point & webhook dispatcher
//
// Telegram sends every update (message / callback_query) as an
// HTTP POST to this web app. doPost() parses it and routes to
// the appropriate handler.
// ============================================================

/**
 * Entry point for all Telegram webhook POSTs.
 * Must return a 200 OK — Telegram will retry on non-200.
 *
 * IMPORTANT: We return 200 FIRST (before processing) to tell Telegram
 * "got it, don't retry" — then process the update. This prevents the
 * retry loop caused by Apps Script cold-start exceeding Telegram's 5s timeout.
 *
 * Note: returning early means the response goes out, but Apps Script
 * continues executing the rest of doPost synchronously. This works
 * because ContentService output is flushed before the function body ends.
 */
function doPost(e) {
  try {
    // Telegram does not sign webhook payloads. Require the secret query
    // parameter added by deployWebhook() before processing any input.
    const expectedSecret = getConfig('WEBHOOK_SECRET');
    const suppliedSecret = e && e.parameter ? String(e.parameter.secret || '') : '';
    if (!expectedSecret || suppliedSecret !== String(expectedSecret)) return;
    if (!e || !e.postData || !e.postData.contents) return;
    const update = JSON.parse(e.postData.contents);

    // Deduplicate: skip updates we've already processed.
    const updateId  = String(update.update_id);
    const cacheKey  = 'upd_' + updateId;
    const cache     = CacheService.getScriptCache();
    
    if (cache.get(cacheKey)) {
      // Already processed — return undefined so Apps Script sends a raw 200 OK
      // instead of a 302 redirect (which ContentService causes)
      return; 
    }
    
    // Mark as processed for 10 minutes
    cache.put(cacheKey, '1', 600);

    processUpdate(update);
  } catch (err) {
    Logger.log('doPost error: ' + err.stack);
  }
  
  // Return nothing to trigger Apps Script's native 200 OK (avoids 302 redirect)
  return;
}

/**
 * Main router. Inspects the update object and dispatches to the right handler.
 */
function processUpdate(update) {
  // ---- Inline keyboard button taps ----
  if (update.callback_query) {
    handleCallbackQuery(update.callback_query);
    return;
  }

  // ---- Text messages ----
  const msg = update.message;
  if (!msg || !msg.text) return; // ignore media, stickers, etc.

  const chatId = String(msg.chat.id);
  const text   = msg.text.trim();

  // If user is mid-onboarding and sends non-command text, continue the session
  const session = getSession(chatId);
  if (session && !text.startsWith('/')) {
    handleFreeText(msg);
    return;
  }

  // ---- Command routing ----
  // Strip @BotName suffix if present (e.g. /stats@AttendBuddyBot)
  const cmd = text.split(/\s+/)[0].split('@')[0].toLowerCase();
  if (cmd.startsWith('/') && isCommandRateLimited(chatId, cmd)) return;

  if      (cmd === '/start')        handleStart(msg);
  else if (cmd === '/help')         handleHelp(msg);
  else if (cmd === '/stats')        handleStats(msg);
  else if (cmd === '/history')      handleHistory(msg);
  else if (cmd === '/holidays')     handleHolidays(msg);
  else if (cmd === '/correct')      handleCorrect(msg);
  else if (cmd === '/holiday')      handleHoliday(msg);       // admin
  else if (cmd === '/broadcast')    handleBroadcast(msg);     // admin
  else if (cmd === '/monthlystats') handleMonthlyStats(msg);  // admin
  else if (cmd === '/settings')     handleSettings(msg);       // admin
  else if (text.startsWith('/'))            sendMessage(chatId, '❓ Unknown command. Use /help to see all available commands.');
  else                                      handleFreeText(msg);
}

function isCommandRateLimited(chatId, command) {
  // Short cooldowns stop accidental/repeated command floods without
  // interfering with onboarding text or attendance button callbacks.
  const seconds = command === '/stats' ? 5 : 2;
  const key = 'rl_cmd_' + String(chatId) + '_' + command.replace(/[^a-z0-9]/gi, '_');
  const cache = CacheService.getScriptCache();
  if (cache.get(key)) return true;
  cache.put(key, '1', seconds);
  return false;
}

/**
 * Health check — lets you verify the web app is reachable by visiting the URL in a browser.
 * Also useful for Telegram's webhook verification check.
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'AttendBuddy is running ✅', timestamp: new Date().toISOString() })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Diagnostic: call this from the editor to see what Telegram reports about your webhook.
 * Run from setup.gs dropdown → checkWebhookStatus
 */
function checkWebhookStatus() {
  const token = getConfig('BOT_TOKEN');
  const url   = 'https://api.telegram.org/bot' + token + '/getWebhookInfo';
  const resp  = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const info  = JSON.parse(resp.getContentText());
  const safeInfo = JSON.parse(JSON.stringify(info));
  if (safeInfo.result && safeInfo.result.url) {
    safeInfo.result.url = String(safeInfo.result.url).replace(/([?&]secret=)[^&]+/i, '$1REDACTED');
  }
  Logger.log('Webhook info: ' + JSON.stringify(safeInfo, null, 2));
  if (info.result) {
    const safeUrl = String(info.result.url || '').replace(/([?&]secret=)[^&]+/i, '$1REDACTED');
    Logger.log('📌 URL registered: ' + safeUrl);
    Logger.log('📬 Pending updates: ' + info.result.pending_update_count);
    Logger.log('❗ Last error: ' + (info.result.last_error_message || 'none'));
  }
}
