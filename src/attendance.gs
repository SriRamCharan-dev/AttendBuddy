// ============================================================
// attendance.gs — Daily attendance prompt & auto-absent flow
//
// Three time-based triggers call functions in this file:
//   8:30 AM IST → sendDailyPrompt()
//   9:15 AM IST → sendNudge()
//   9:30 AM IST → autoMarkAbsent()
//
// Callback queries from inline buttons are also handled here.
// ============================================================

// ---- Daily prompt (8:30 AM) --------------------------------

/**
 * Sends the morning attendance check to every registered user.
 * Skipped automatically on holidays and non-working days.
 */
function sendDailyPrompt() {
  const today    = todayIST();
  const workDays = getWorkDays();
  const dow      = getDayOfWeekIST(today);

  if (isHoliday(today)) {
    Logger.log('sendDailyPrompt: skipped — holiday on ' + today);
    return;
  }
  if (!workDays.includes(dow)) {
    Logger.log('sendDailyPrompt: skipped — non-working day (dow=' + dow + ')');
    return;
  }

  const users = getAllUsers();
  Logger.log('sendDailyPrompt: sending to ' + users.length + ' users on ' + today);

  for (const user of users) {
    try {
      const firstName = escapeHtml(user.name.split(' ')[0]);
      sendInlineKeyboard(user.chatId,
        '🌅 <b>Good morning, ' + firstName + '!</b>\n\n' +
        '📅 ' + today + '\n\n' +
        'Are you going to college today?',
        [[
          { text: '✅ Going',        callback_data: 'att_present_' + today },
          { text: '🚗 On the way',   callback_data: 'att_present_' + today },
          { text: '❌ Not going',    callback_data: 'att_absent_'  + today }
        ]]
      );
    } catch (e) {
      Logger.log('Prompt failed for ' + user.chatId + ': ' + e.message);
      logAudit('SYSTEM', 'ERROR', user.chatId, 'Prompt failed: ' + e.message);
    }
    Utilities.sleep(50); // stay well under Telegram's 30 msg/sec limit
  }
}

// ---- Nudge (9:15 AM) ---------------------------------------

/**
 * Sends a reminder to users who haven't responded yet.
 * Tells them they'll be auto-marked absent in 15 minutes.
 */
function sendNudge() {
  const today    = todayIST();
  const workDays = getWorkDays();
  const dow      = getDayOfWeekIST(today);

  if (isHoliday(today) || !workDays.includes(dow)) return;

  const users = getAllUsers();
  for (const user of users) {
    if (!hasResponded(user.chatId, today)) {
      try {
        sendInlineKeyboard(user.chatId,
          '⏰ <b>Reminder!</b>\n\n' +
          'You haven\'t marked your attendance yet.\n' +
          '🚨 You\'ll be auto-marked <b>absent</b> in 15 minutes!\n\n' +
          'Are you going to college today?',
          [[
            { text: '✅ Going',     callback_data: 'att_present_' + today },
            { text: '❌ Not going', callback_data: 'att_absent_'  + today }
          ]]
        );
      } catch (e) {
        Logger.log('Nudge failed for ' + user.chatId + ': ' + e.message);
        logAudit('SYSTEM', 'ERROR', user.chatId, 'Nudge failed: ' + e.message);
      }
      Utilities.sleep(50);
    }
  }
}

// ---- Auto-absent sweep (9:30 AM) ---------------------------

/**
 * Marks all non-responders as absent and sends them a notification.
 */
function autoMarkAbsent() {
  const today    = todayIST();
  const workDays = getWorkDays();
  const dow      = getDayOfWeekIST(today);

  if (isHoliday(today) || !workDays.includes(dow)) return;

  const users = getAllUsers();
  for (const user of users) {
    if (!hasResponded(user.chatId, today)) {
      logAttendance(user.chatId, today, 'absent');
      logAudit('SYSTEM', 'AUTO_ABSENT', user.chatId, today);
      try {
        sendMessage(user.chatId,
          '⚠️ You\'ve been <b>auto-marked absent</b> for today (' + today + ').\n\n' +
          'If this is incorrect, use /correct to update it.'
        );
      } catch (e) {
        Logger.log('Auto-absent notification failed for ' + user.chatId + ': ' + e.message);
        logAudit('SYSTEM', 'ERROR', user.chatId, 'Auto-absent notification failed: ' + e.message);
      }
      Utilities.sleep(50);
    }
  }
  Logger.log('autoMarkAbsent: completed for ' + today);
}

// ---- Callback query router ---------------------------------

/**
 * Routes all inline-button tap events.
 * Called from Code.gs when update.callback_query exists.
 *
 * Supported callback_data patterns:
 *   att_present_YYYY-MM-DD          → mark present
 *   att_absent_YYYY-MM-DD           → mark absent
 *   att_correct_present_YYYY-MM-DD  → correct to present
 *   att_correct_absent_YYYY-MM-DD   → correct to absent
 *   admin_*                         → delegated to admin.gs
 */
function handleCallbackQuery(callbackQuery) {
  const chatId = String(callbackQuery.from.id);
  const data   = callbackQuery.data || '';

  // Admin callbacks → delegate
  if (data.startsWith('admin_')) {
    handleAdminCallback(callbackQuery);
    return;
  }

  // Parse attendance callbacks
  const PATTERNS = [
    { re: /^att_present_(\d{4}-\d{2}-\d{2})$/,         status: 'present' },
    { re: /^att_absent_(\d{4}-\d{2}-\d{2})$/,          status: 'absent'  },
    { re: /^att_correct_present_(\d{4}-\d{2}-\d{2})$/,  status: 'present' },
    { re: /^att_correct_absent_(\d{4}-\d{2}-\d{2})$/,   status: 'absent'  },
  ];

  let date   = null;
  let status = null;
  for (const p of PATTERNS) {
    const m = data.match(p.re);
    if (m) { date = m[1]; status = p.status; break; }
  }

  if (!date) {
    answerCallbackQuery(callbackQuery.id, '⚠️ Unknown action.');
    return;
  }

  const today = todayIST();
  if (date !== today) {
    answerCallbackQuery(callbackQuery.id, '⚠️ This prompt is from a different day and can no longer be used.');
    return;
  }
  if (isHoliday(date)) {
    answerCallbackQuery(callbackQuery.id, '🏖️ Today is a holiday — no attendance needed!');
    return;
  }

  const user = getUser(chatId);
  if (!user) {
    answerCallbackQuery(callbackQuery.id, '❌ Please register with /start first.');
    return;
  }

  logAttendance(chatId, date, status);
  logAudit(chatId, data.indexOf('att_correct_') === 0 ? 'ATTENDANCE_CORRECTION' : 'ATTENDANCE_MARKED', date, status);
  answerCallbackQuery(callbackQuery.id, status === 'present' ? '✅ Marked present!' : '❌ Marked absent.');

  // Send updated stats back to the user
  const s          = computeStats(chatId);
  const bar        = s ? buildProgressBar(s.percent, s.minPct) : '';
  let   skipLine   = '';
  if (s) {
    if (s.skippable > 0) {
      skipLine = '\n📅 You can still skip <b>' + s.skippable + '</b> day(s) this month.';
    } else if (s.percent < s.minPct) {
      skipLine = '\n🚨 You\'re below the safe threshold — attend regularly!';
    } else {
      skipLine = '\n⚠️ No more days to skip while staying above ' + s.minPct + '%.';
    }
  }

  sendMessage(chatId,
    (status === 'present' ? '✅ <b>Marked Present</b>' : '❌ <b>Marked Absent</b>') +
    ' for ' + date + '\n\n' +
    (s ? bar + '\n🗓️ This month: <b>' + s.percent + '%</b> · Month-end forecast: <b>' + s.monthForecastPercent + '%</b>' : '') +
    skipLine
  );
}
