// ============================================================
// sheets.gs — Google Sheets data access layer
// All reads/writes to the spreadsheet go through this file.
// ============================================================

const SHEET_USERS      = 'Users';
const SHEET_ATTENDANCE = 'Attendance';
const SHEET_HOLIDAYS   = 'Holidays';
const SHEET_CONFIG     = 'Config';
const SHEET_AUDIT      = 'AuditLog';

/** Convert Sheet date cells and date strings to a stable YYYY-MM-DD key. */
function dateKey(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, 'Asia/Kolkata', 'yyyy-MM-dd');
  }
  return String(value || '').trim();
}

/** Escape untrusted text before including it in Telegram HTML messages. */
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

function logAudit(actorChatId, action, target, details) {
  let sheet = getSheet(SHEET_AUDIT);
  if (!sheet) {
    sheet = getSpreadsheet().insertSheet(SHEET_AUDIT);
    sheet.appendRow(['timestamp', 'actor_chat_id', 'action', 'target', 'details']);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    new Date(), String(actorChatId || ''), String(action || ''),
    String(target || ''), String(details || '')
  ]);
}

// ---- Config (CacheService-backed for speed) ----------------
//
// CacheService stores all Config rows as a JSON blob for up to
// 120 seconds. Each webhook invocation pays the Sheet read cost
// at most once per 2 minutes instead of on every single call.

const CONFIG_CACHE_KEY = 'ab_config_all';
const CONFIG_CACHE_TTL = 120; // seconds

function _loadConfigFromSheet() {
  const sheet  = getSheet(SHEET_CONFIG);
  const data   = sheet.getDataRange().getValues();
  const config = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      const key = String(data[i][0]);
      let val = data[i][1];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, 'Asia/Kolkata', 'yyyy-MM-dd');
      }
      config[key] = String(val);
    }
  }
  return config;
}

function _getConfigMap() {
  const cache   = CacheService.getScriptCache();
  const cached  = cache.get(CONFIG_CACHE_KEY);
  if (cached) return JSON.parse(cached);
  const config = _loadConfigFromSheet();
  cache.put(CONFIG_CACHE_KEY, JSON.stringify(config), CONFIG_CACHE_TTL);
  return config;
}

function _bustConfigCache() {
  CacheService.getScriptCache().remove(CONFIG_CACHE_KEY);
}

function getConfig(key) {
  return _getConfigMap()[key] || null;
}

function setConfig(key, value) {
  const sheet = getSheet(SHEET_CONFIG);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      _bustConfigCache(); // invalidate so next read gets fresh value
      return;
    }
  }
  sheet.appendRow([key, value]);
  _bustConfigCache();
}

// ---- Users -------------------------------------------------

function getUser(chatId) {
  const sheet = getSheet(SHEET_USERS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(chatId)) {
      let jDate = data[i][2];
      if (jDate instanceof Date) {
        jDate = Utilities.formatDate(jDate, 'Asia/Kolkata', 'yyyy-MM-dd');
      }
      return {
        chatId:          String(data[i][0]),
        name:            data[i][1],
        joinDate:        String(jDate),
        isAdmin:         data[i][3] === true || data[i][3] === 'TRUE',
        baselinePresent: Number(data[i][4]) || 0,
        baselineTotal:   Number(data[i][5]) || 0,
        row:             i + 1
      };
    }
  }
  return null;
}

function upsertUser(chatId, name, joinDate, isAdmin, baselinePresent, baselineTotal) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const sheet = getSheet(SHEET_USERS);
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(chatId)) {
        sheet.getRange(i + 1, 1, 1, 6).setValues([[
          String(chatId), name, joinDate, isAdmin, baselinePresent, baselineTotal
        ]]);
        return;
      }
    }
    sheet.appendRow([String(chatId), name, joinDate, isAdmin, baselinePresent, baselineTotal]);
  } finally {
    lock.releaseLock();
  }
}

function getAllUsers() {
  const sheet = getSheet(SHEET_USERS);
  const data  = sheet.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      users.push({
        chatId:          String(data[i][0]),
        name:            data[i][1],
        joinDate:        dateKey(data[i][2]),
        isAdmin:         data[i][3] === true || data[i][3] === 'TRUE',
        baselinePresent: Number(data[i][4]) || 0,
        baselineTotal:   Number(data[i][5]) || 0
      });
    }
  }
  return users;
}

// ---- Attendance --------------------------------------------

/**
 * Log or update an attendance entry for a user on a given date.
 * status: 'present' | 'absent' | 'holiday'
 */
function logAttendance(chatId, date, status) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
  const sheet    = getSheet(SHEET_ATTENDANCE);
  const data     = sheet.getDataRange().getValues();
  const markedAt = new Date().toISOString();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(chatId) && dateKey(data[i][1]) === date) {
      sheet.getRange(i + 1, 3, 1, 2).setValues([[status, markedAt]]);
      return;
    }
  }
  sheet.appendRow([String(chatId), date, status, markedAt]);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Check whether a user has already submitted a response for a date.
 */
function hasResponded(chatId, date) {
  const sheet = getSheet(SHEET_ATTENDANCE);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(chatId) && dateKey(data[i][1]) === date) {
      return true; // any row existing = responded
    }
  }
  return false;
}

/**
 * Retrieve all attendance records for a user in a date range [fromDate, toDate].
 * Both bounds are inclusive YYYY-MM-DD strings.
 */
function getAttendanceForUser(chatId, fromDate, toDate) {
  const sheet   = getSheet(SHEET_ATTENDANCE);
  const data    = sheet.getDataRange().getValues();
  const records = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(chatId)) {
      const d = dateKey(data[i][1]);
      if (d >= fromDate && d <= toDate) {
        records.push({ date: d, status: data[i][2], markedAt: data[i][3] });
      }
    }
  }
  return records;
}

/**
 * Returns list of chat_ids who have a record (any status) for the given date.
 */
function getUsersWhoRespondedForDate(date) {
  const sheet = getSheet(SHEET_ATTENDANCE);
  const data  = sheet.getDataRange().getValues();
  const ids   = [];
  for (let i = 1; i < data.length; i++) {
    if (dateKey(data[i][1]) === date) ids.push(String(data[i][0]));
  }
  return ids;
}

/**
 * Delete all attendance rows for a specific date (used when a holiday is declared retroactively).
 */
function deleteAttendanceForDate(date) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const sheet = getSheet(SHEET_ATTENDANCE);
    const data  = sheet.getDataRange().getValues();
    // Iterate bottom-up to avoid index shifting
    for (let i = data.length - 1; i >= 1; i--) {
      if (dateKey(data[i][1]) === date) {
        sheet.deleteRow(i + 1);
      }
    }
  } finally {
    lock.releaseLock();
  }
}

// ---- Holidays ----------------------------------------------

function isHoliday(date) {
  const sheet = getSheet(SHEET_HOLIDAYS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (dateKey(data[i][0]) === date) return true;
  }
  return false;
}

function addHoliday(date, reason, addedBy) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const sheet = getSheet(SHEET_HOLIDAYS);
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (dateKey(data[i][0]) === date) {
        // Update existing entry
        sheet.getRange(i + 1, 1, 1, 3).setValues([[date, reason, addedBy]]);
        return;
      }
    }
    sheet.appendRow([date, reason, addedBy]);
  } finally {
    lock.releaseLock();
  }
}

function removeHoliday(date) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const sheet = getSheet(SHEET_HOLIDAYS);
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (dateKey(data[i][0]) === date) {
        sheet.deleteRow(i + 1);
        return true;
      }
    }
    return false;
  } finally {
    lock.releaseLock();
  }
}

function getHolidaysForMonth(year, month) {
  const sheet    = getSheet(SHEET_HOLIDAYS);
  const data     = sheet.getDataRange().getValues();
  const prefix   = year + '-' + String(month).padStart(2, '0');
  const holidays = [];
  for (let i = 1; i < data.length; i++) {
    const date = dateKey(data[i][0]);
    if (date.startsWith(prefix)) {
      holidays.push({ date: date, reason: data[i][1] });
    }
  }
  return holidays;
}
