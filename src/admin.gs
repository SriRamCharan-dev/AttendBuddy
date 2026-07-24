// ============================================================
// admin.gs — Admin-only command handlers
//
// Commands: /holiday, /broadcast, /monthlystats
// All commands are guarded by isAdmin() which checks
// the caller's chat_id against ADMIN_IDS in the Config sheet.
// ============================================================

// ---- Auth guard --------------------------------------------

function isAdmin(chatId) {
  const raw = getConfig('ADMIN_IDS') || '';
  return raw.split(',').map(s => s.trim()).includes(String(chatId));
}

function handleSettings(msg) {
  const chatId = String(msg.chat.id);
  if (!isAdmin(chatId)) {
    sendMessage(chatId, '⛔ This command is for admins only.');
    return;
  }
  const parts = (msg.text || '').trim().split(/\s+/);
  const setting = (parts[1] || 'show').toLowerCase();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (setting === 'show') {
    const days = getWorkDays();
    sendMessage(chatId,
      '⚙️ <b>AttendBuddy Settings</b>\n\n' +
      '🎯 Minimum attendance: <b>' + (Number(getConfig('MIN_PERCENT')) || 75) + '%</b>\n' +
      '📅 Working days: <b>' + days.map(d => dayNames[d]).join(', ') + '</b>\n\n' +
      'Update with:\n' +
      '/settings min 75\n' +
      '/settings workdays 1,2,3,4,5,6'
    );
    return;
  }

  if (setting === 'min' || setting === 'min_percent' || setting === 'threshold') {
    const value = Number(parts[2]);
    if (!isFinite(value) || value < 1 || value > 100) {
      sendMessage(chatId, '⚠️ Minimum attendance must be a number from 1 to 100.');
      return;
    }
    const normalized = Math.round(value * 10) / 10;
    setConfig('MIN_PERCENT', String(normalized));
    logAudit(chatId, 'SETTING_CHANGED', 'MIN_PERCENT', String(normalized));
    sendMessage(chatId, '✅ Minimum attendance updated to <b>' + normalized + '%</b>.');
    return;
  }

  if (setting === 'workdays' || setting === 'working_days') {
    const raw = parts.slice(2).join('').replace(/\s/g, '');
    const values = raw.split(',').map(s => Number(s.trim()));
    const valid = values.length > 0 && values.every(d => Number.isInteger(d) && d >= 0 && d <= 6) &&
      new Set(values).size === values.length;
    if (!valid) {
      sendMessage(chatId, '⚠️ Working days must be unique numbers from 0 (Sun) to 6 (Sat).');
      return;
    }
    values.sort((a, b) => a - b);
    setConfig('WORK_DAYS', values.join(','));
    logAudit(chatId, 'SETTING_CHANGED', 'WORK_DAYS', values.join(','));
    sendMessage(chatId, '✅ Working days updated to <b>' + values.map(d => dayNames[d]).join(', ') + '</b>.');
    return;
  }

  sendMessage(chatId, '⚠️ Use /settings, /settings min 75, or /settings workdays 1,2,3,4,5,6.');
}

function sendHolidayList(chatId) {
  const now = new Date();
  const year = Number(Utilities.formatDate(now, 'Asia/Kolkata', 'yyyy'));
  const month = Number(Utilities.formatDate(now, 'Asia/Kolkata', 'M'));
  const monthName = Utilities.formatDate(now, 'Asia/Kolkata', 'MMMM');
  const workDays = getWorkDays();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weeklyOff = dayNames.filter((name, day) => !workDays.includes(day));
  const holidays = getHolidaysForMonth(year, month);
  let text = '🗓️ <b>Holiday Calendar — ' + monthName + ' ' + year + '</b>\n\n';
  text += '🔁 <b>Weekly off:</b> ' + (weeklyOff.length ? weeklyOff.join(', ') : 'None') + '\n';
  text += '🏖️ <b>Public / special holidays:</b>\n';
  if (!holidays.length) text += '• None added yet\n';
  holidays.forEach(h => { text += '• <b>' + h.date + '</b> — ' + escapeHtml(h.reason || 'Holiday') + '\n'; });
  if (isAdmin(chatId)) {
    text += '\n<b>Admin actions</b>\n';
    text += '/holiday add [YYYY-MM-DD] [reason]\n';
    text += '/holiday remove YYYY-MM-DD';
  }
  sendMessage(chatId, text);
}

// ---- /holiday ----------------------------------------------

/**
 * Usage:
 *   /holiday                         → marks TODAY as holiday with reason "Holiday"
 *   /holiday Reason text             → marks TODAY with given reason
 *   /holiday YYYY-MM-DD              → marks specific date, reason "Holiday"
 *   /holiday YYYY-MM-DD Reason text  → marks specific date with reason
 */
function handleHoliday(msg, skipConfirmation) {
  const chatId = String(msg.chat.id);
  const parts = (msg.text || '').trim().split(/\s+/);
  const action = (parts[1] || 'list').toLowerCase();

  // Read-only by default. This prevents an accidental /holiday from
  // cancelling attendance for the entire group.
  if (action === 'list') {
    sendHolidayList(chatId);
    return;
  }
  if (!isAdmin(chatId)) {
    sendMessage(chatId, '⛔ This command is for admins only.');
    return;
  }
  if (action === 'remove') {
    const dateToRemove = parts[2];
    if (!dateToRemove || !isValidDate(dateToRemove)) {
      sendMessage(chatId, '⚠️ Usage: /holiday remove YYYY-MM-DD');
      return;
    }
    if (!removeHoliday(dateToRemove)) {
      sendMessage(chatId, 'ℹ️ No public holiday is recorded for <b>' + dateToRemove + '</b>.');
      return;
    }
    logAudit(chatId, 'HOLIDAY_REMOVED', dateToRemove, 'Public/special holiday removed');
    sendMessage(chatId, '✅ Holiday removed for <b>' + dateToRemove + '</b>.');
    return;
  }
  if (action !== 'add') {
    sendMessage(chatId, '⚠️ Use /holiday to view the calendar, /holiday add [date] [reason], or /holiday remove [date].');
    return;
  }

  const today  = todayIST();
  let   date   = today;
  let   reason = 'Holiday';
  const argStart = 2;

  if (parts.length > argStart) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(parts[argStart])) {
      if (!isValidDate(parts[argStart])) {
        sendMessage(chatId, '⚠️ Please use a real date in YYYY-MM-DD format.');
        return;
      }
      date   = parts[argStart];
      reason = parts.slice(argStart + 1).join(' ') || 'Holiday';
    } else {
      reason = parts.slice(argStart).join(' ');
    }
  }

  if (isHoliday(date)) {
    sendMessage(chatId, '⚠️ <b>' + date + '</b> is already marked as a holiday.');
    return;
  }

  if (date === today && !skipConfirmation) {
    PropertiesService.getScriptProperties().setProperty(
      'pending_holiday_' + chatId,
      JSON.stringify({ date: date, reason: reason, createdAt: Date.now() })
    );
    sendInlineKeyboard(chatId,
      '⚠️ <b>Confirm today\'s holiday</b>\n\nThis will void any attendance already recorded for today and notify everyone.',
      [[
        { text: '✅ Confirm holiday', callback_data: 'admin_confirm_holiday_' + date },
        { text: 'Cancel', callback_data: 'admin_cancel_holiday' }
      ]]
    );
    return;
  }

  addHoliday(date, reason, chatId);
  logAudit(chatId, 'HOLIDAY_ADDED', date, reason);

  // If this is TODAY and the daily prompt may have already gone out,
  // void any responses and notify affected users.
  if (date === today) {
    const respondedIds = getUsersWhoRespondedForDate(today);

    // Delete today's attendance entries
    deleteAttendanceForDate(today);

    // Notify users who had already responded
    const notifiedSet = new Set();
    for (const uid of respondedIds) {
      try {
        sendMessage(uid,
          '🏖️ <b>Holiday declared!</b>\n\n' +
          'Admin has marked <b>' + today + '</b> as a holiday: <i>' + escapeHtml(reason) + '</i>\n' +
          'Your earlier attendance response has been voided. Enjoy your day! 🎉'
        );
        notifiedSet.add(uid);
      } catch (e) { /* user may have blocked the bot */ }
      Utilities.sleep(50);
    }

    // Notify everyone else
    const allUsers = getAllUsers();
    for (const u of allUsers) {
      if (!notifiedSet.has(u.chatId)) {
        try {
          sendMessage(u.chatId,
            '🏖️ <b>Holiday Today!</b>\n\n' +
            'Admin has declared today (<b>' + today + '</b>) a holiday.\n' +
            'Reason: <i>' + escapeHtml(reason) + '</i>\n\n' +
            'No attendance needed today — enjoy! 🎉'
          );
        } catch (e) {}
        Utilities.sleep(50);
      }
    }
  }

  sendMessage(chatId,
    '✅ Holiday recorded!\n' +
    '📅 Date:   <b>' + date + '</b>\n' +
    '📝 Reason: <b>' + escapeHtml(reason) + '</b>\n' +
    (date === today
      ? '\n🔁 Today\'s attendance entries have been voided and all users notified.'
      : '')
  );
}

// ---- /broadcast --------------------------------------------

/**
 * Usage: /broadcast <message>
 * Sends the message to every registered user prefixed with "📢 Announcement from Admin".
 */
function handleBroadcast(msg) {
  const chatId = String(msg.chat.id);
  if (!isAdmin(chatId)) {
    sendMessage(chatId, '⛔ This command is for admins only.');
    return;
  }

  const text = (msg.text || '').replace(/^\/broadcast\s*/i, '').trim();
  if (!text) {
    sendMessage(chatId,
      '⚠️ Usage: /broadcast &lt;message&gt;\n\nExample:\n/broadcast Tomorrow is a surprise holiday!'
    );
    return;
  }

  const broadcastText = '📢 <b>Announcement from Admin</b>\n\n' + escapeHtml(text);
  sendMessage(chatId, '⏳ Broadcasting to all users…');
  const sent = broadcastMessage(broadcastText);
  sendMessage(chatId, '✅ Broadcast sent to <b>' + sent + '</b> users.');
}

// ---- /monthlystats -----------------------------------------

/**
 * Generates the monthly group summary and lets the admin choose whether
 * to keep it private or broadcast it to everyone.
 */
function handleMonthlyStats(msg) {
  const chatId = String(msg.chat.id);
  if (!isAdmin(chatId)) {
    sendMessage(chatId, '⛔ This command is for admins only.');
    return;
  }

  const istNow      = new Date();
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthIndex  = Number(Utilities.formatDate(istNow, 'Asia/Kolkata', 'M')) - 1;
  const monthName   = MONTH_NAMES[monthIndex];
  const year        = Number(Utilities.formatDate(istNow, 'Asia/Kolkata', 'yyyy'));

  const allUsers = getAllUsers();
  if (allUsers.length === 0) {
    sendMessage(chatId, '⚠️ No users registered yet.');
    return;
  }

  const stats     = [];
  const atRisk    = [];
  const notReg    = [];

  for (const user of allUsers) {
    const s = computeStats(user.chatId);
    if (!s) { notReg.push(escapeHtml(user.name)); continue; }
    stats.push({ name: escapeHtml(user.name), s });
    if (s.percent < s.minPct) atRisk.push(escapeHtml(user.name));
  }

  // Sort descending by attendance %
  stats.sort((a, b) => b.s.percent - a.s.percent);

  let summary = '📊 <b>Attendance Snapshot — ' + monthName + ' ' + year + '</b>\n';
  summary    += '👥 Total registered: ' + allUsers.length + '\n';
  summary    += '━━━━━━━━━━━━━━━━\n\n';

  for (const { name, s } of stats) {
    const icon = s.percent >= s.minPct ? '✅' : '🚨';
    summary   += icon + ' ' + name + ': <b>' + s.termPercent + '% term</b> (' + s.present + '/' + s.elapsed + ') · <b>' + s.monthForecastPercent + '% month forecast</b>\n';
  }

  if (atRisk.length > 0) {
    summary += '\n🚨 <b>At-risk (' + atRisk.length + '):</b> ' + atRisk.join(', ');
  } else {
    summary += '\n🎉 Everyone is above the ' + (Number(getConfig('MIN_PERCENT')) || 75) + '% threshold!';
  }

  // Send preview to admin
  sendMessage(chatId, summary);

  // Offer broadcast
  sendInlineKeyboard(chatId,
    '📤 Do you want to <b>broadcast</b> this summary to all ' + allUsers.length + ' users?',
    [[
      { text: '📢 Yes — broadcast to all', callback_data: 'admin_broadcast_monthly_' + monthIndex + '_' + year },
      { text: '🔒 No — keep private',      callback_data: 'admin_no_broadcast' }
    ]]
  );
}

// ---- Admin callback handler --------------------------------

/**
 * Handles inline button taps originating from admin flows.
 * Called by handleCallbackQuery() in attendance.gs.
 */
function handleAdminCallback(callbackQuery) {
  const chatId = String(callbackQuery.from.id);
  const data   = callbackQuery.data;
  answerCallbackQuery(callbackQuery.id);

  if (data === 'admin_no_broadcast') {
    sendMessage(chatId, '🔒 Summary kept private.');
    return;
  }

  if (data === 'admin_cancel_holiday') {
    PropertiesService.getScriptProperties().deleteProperty('pending_holiday_' + chatId);
    sendMessage(chatId, '↩️ Holiday action cancelled.');
    return;
  }

  const holidayMatch = data.match(/^admin_confirm_holiday_(\d{4}-\d{2}-\d{2})$/);
  if (holidayMatch) {
    if (!isAdmin(chatId)) {
      sendMessage(chatId, '⛔ Admin access required.');
      return;
    }
    const key = 'pending_holiday_' + chatId;
    const raw = PropertiesService.getScriptProperties().getProperty(key);
    const pending = raw ? JSON.parse(raw) : null;
    PropertiesService.getScriptProperties().deleteProperty(key);
    if (!pending || pending.date !== holidayMatch[1] || Date.now() - Number(pending.createdAt) > 5 * 60 * 1000) {
      sendMessage(chatId, '⚠️ This holiday confirmation has expired. Please run /holiday add again.');
      return;
    }
    handleHoliday({ chat: { id: chatId }, text: '/holiday add ' + pending.date + ' ' + pending.reason }, true);
    return;
  }

  // admin_broadcast_monthly_<month>_<year>
  const broadcastMatch = data.match(/^admin_broadcast_monthly_(\d+)_(\d+)$/);
  if (broadcastMatch && isAdmin(chatId)) {
    const mIdx        = parseInt(broadcastMatch[1], 10);
    const year        = parseInt(broadcastMatch[2], 10);
    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthName   = MONTH_NAMES[mIdx];

    const allUsers = getAllUsers();
    const stats    = [];
    for (const user of allUsers) {
      const s = computeStats(user.chatId);
      if (s) stats.push({ name: escapeHtml(user.name), s });
    }
    stats.sort((a, b) => b.s.percent - a.s.percent);

    let msg = '📊 <b>Attendance Snapshot — ' + monthName + ' ' + year + '</b>\n\n';
    for (const { name, s } of stats) {
      const icon = s.percent >= s.minPct ? '✅' : '🚨';
      msg       += icon + ' ' + name + ': <b>' + s.termPercent + '% term</b> · <b>' + s.monthForecastPercent + '% month forecast</b>\n';
    }
    msg += '\n<i>Stay consistent! 💪</i>';

    sendMessage(chatId, '⏳ Broadcasting monthly summary…');
    const sent = broadcastMessage(msg);
    sendMessage(chatId, '✅ Monthly summary broadcast to <b>' + sent + '</b> users.');
  }
}
