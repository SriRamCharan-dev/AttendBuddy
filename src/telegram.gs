// ============================================================
// telegram.gs — Telegram Bot API wrapper
// All outbound HTTP calls to Telegram go through this file.
// ============================================================

function getToken() {
  return getConfig('BOT_TOKEN');
}

function callTelegram(method, payload) {
  const token = getToken();
  const url   = 'https://api.telegram.org/bot' + token + '/' + method;
  const opts  = {
    method:         'post',
    contentType:    'application/json',
    payload:        JSON.stringify(payload),
    muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(url, opts);
  return JSON.parse(response.getContentText());
}

/**
 * Send a plain (or HTML-formatted) message.
 * @param {string|number} chatId
 * @param {string} text  – HTML supported (parse_mode: HTML)
 * @param {Object} [extra] – additional Telegram params merged into payload
 */
function sendMessage(chatId, text, extra) {
  const payload = Object.assign(
    { chat_id: chatId, text: text, parse_mode: 'HTML' },
    extra || {}
  );
  return callTelegram('sendMessage', payload);
}

/**
 * Send a message with an inline keyboard.
 * @param {string|number} chatId
 * @param {string} text
 * @param {Array<Array<{text:string, callback_data:string}>>} buttons  – 2-D array (rows of buttons)
 */
function sendInlineKeyboard(chatId, text, buttons) {
  return sendMessage(chatId, text, {
    reply_markup: { inline_keyboard: buttons }
  });
}

/**
 * Acknowledge a callback query (removes the "loading" spinner on the button).
 * @param {string} callbackQueryId
 * @param {string} [text]  – optional toast notification shown to user
 */
function answerCallbackQuery(callbackQueryId, text) {
  return callTelegram('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text:              text || '',
    show_alert:        false
  });
}

/**
 * Register the webhook URL with Telegram so all updates are POSTed to us.
 * @param {string} url  – the deployed Apps Script web-app URL
 */
function setWebhook(url) {
  return callTelegram('setWebhook', { url: url });
}

/**
 * Broadcast a text message to every registered user.
 * Respects Telegram's ~30 msg/sec limit via a 50 ms sleep between sends.
 * @param {string} text
 * @returns {number} count of successfully sent messages
 */
function broadcastMessage(text) {
  const users = getAllUsers();
  let sent = 0;
  for (const user of users) {
    try {
      sendMessage(user.chatId, text);
      sent++;
    } catch (e) {
      Logger.log('Broadcast failed for ' + user.chatId + ': ' + e.message);
    }
    Utilities.sleep(50); // ~20 msg/sec — safely below Telegram's 30/sec limit
  }
  return sent;
}
