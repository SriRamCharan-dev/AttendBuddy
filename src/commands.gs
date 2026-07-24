// ============================================================
// commands.gs — User-facing command handlers
//
// Multi-step onboarding state is persisted in
// PropertiesService (ScriptProperties) — keyed by chat_id.
// This survives across webhook invocations without a DB.
// ============================================================

const SESSION_PREFIX = 'sess_';

// ---- Session management ------------------------------------

function getSession(chatId) {
  const val = PropertiesService.getScriptProperties().getProperty(SESSION_PREFIX + chatId);
  return val ? JSON.parse(val) : null;
}

function setSession(chatId, data) {
  if (data === null) {
    PropertiesService.getScriptProperties().deleteProperty(SESSION_PREFIX + chatId);
  } else {
    PropertiesService.getScriptProperties().setProperty(SESSION_PREFIX + chatId, JSON.stringify(data));
  }
}

// ---- /start ------------------------------------------------

function handleStart(msg) {
  const chatId   = String(msg.chat.id);
  const existing = getUser(chatId);

  if (existing) {
    const s = computeStats(chatId);
    const pctLine = s
    ? '\n\n🔥 Current attendance: <b>' + s.percent + '%</b> (' + s.present + '/' + s.elapsed + ' classes attended)'
      : '';
    sendMessage(chatId,
      '👋 What\'s up, <b>' + escapeHtml(existing.name) + '</b>! You\'re already in the system. 😎' +
      pctLine +
      '\n\nUse /stats for the full breakdown or /help if you forgot my tricks!'
    );
    return;
  }

  setSession(chatId, { step: 'waiting_name' });
  sendMessage(chatId,
    '👋 <b>Welcome to AttendBuddy!</b> 🤖\n\n' +
    'I\'m your personal attendance wingman! I\'ll track your classes and tell you exactly how many days you can afford to bunk — completely automatically. 😎\n\n' +
    '━━━━━━━━━━━━━━━━\n' +
    '📝 Let\'s get you rolling. First things first — what\'s your <b>full name</b>?\n' +
    '<i>(as it appears on your college records, so admins recognize you!)</i>'
  );
}

// ---- /help -------------------------------------------------

function handleHelp(msg) {
  const chatId = String(msg.chat.id);
  sendMessage(chatId,
    '📋 <b>AttendBuddy — Commands</b>\n\n' +
    '👤 <b>Your commands</b>\n' +
    '/stats — Live attendance % & days-skippable\n' +
    '/history — Your last 30 days of attendance\n' +
    '/holidays — Holidays this month\n' +
    '/correct — Fix today\'s attendance\n\n' +
    '🔧 <b>Admin-only</b>\n' +
    '/holiday — View the holiday calendar\n' +
    '  Admin: /holiday add or /holiday remove\n' +
    '/settings — Admin settings\n' +
    '/broadcast — Send a message to everyone\n' +
    '/monthlystats — Monthly group summary'
  );
}

// ---- /stats ------------------------------------------------

function handleStats(msg) {
  const chatId = String(msg.chat.id);
  if (!getUser(chatId)) {
    sendMessage(chatId, '❌ You\'re not registered yet. Send /start to begin.');
    return;
  }

  const s = computeStats(chatId);
  if (!s) {
    sendMessage(chatId, '⚠️ Could not compute stats right now. Please try again shortly.');
    return;
  }

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const bar         = buildProgressBar(s.percent, s.minPct);
  const safeStatus  = s.percent >= s.minPct ? 'Safe zone 😎' : 'Needs attention 🚨';

  let skipLine;
  if (s.skippable > 0) {
    skipLine = '\n\n🏖️ <b>Freedom status:</b> You can comfortably bunk <b>' + s.skippable + ' more class(es)</b> this month without ruining your streak!';
  } else if (s.percent < s.minPct) {
    skipLine = '\n\n🚨 <b>Recovery plan:</b> Attend the next <b>' + s.classesToRecover + ' class(es)</b> to reach ' + s.minPct + '% again.';
  } else {
    skipLine = '\n\n⚠️ <b>Living on the edge:</b> You have exactly 0 bunks left this month. Don\'t even think about skipping!';
  }

  sendMessage(chatId,
    '🔥 <b>Your Attendance — ' + MONTH_NAMES[s.month - 1] + ' ' + s.year + '</b>\n\n' +
    bar + '\n<i>' + safeStatus + '</i>\n\n' +
    '📚 <b>Term attendance:</b> ' + s.termPercent + '% (' + s.present + '/' + s.elapsed + ')\n' +
    '📈 <b>Term forecast:</b> ' + s.termForecastPercent + '% if you attend every remaining class\n\n' +
    '🗓️ <b>This month:</b> ' + s.monthPercent + '% (' + s.monthPresent + '/' + s.monthElapsed + ')\n' +
    '🔮 <b>Month-end forecast:</b> ' + s.monthForecastPercent + '%\n' +
    '⏳ Classes remaining this month: <b>' + s.remaining + '</b>\n' +
    '🎯 Target: <b>' + s.minPct + '%</b>' +
    skipLine
  );
}

// ---- /history ----------------------------------------------

function handleHistory(msg) {
  const chatId = String(msg.chat.id);
  if (!getUser(chatId)) {
    sendMessage(chatId, '❌ Not registered. Send /start first.');
    return;
  }

  const today   = todayIST();
  const fromDt  = new Date(new Date(today + 'T00:00:00+05:30').getTime() - 29 * 86400000);
  const fromStr = Utilities.formatDate(fromDt, 'Asia/Kolkata', 'yyyy-MM-dd');

  const records = getAttendanceForUser(chatId, fromStr, today);
  if (records.length === 0) {
    sendMessage(chatId, '📭 No attendance records in the last 30 days.');
    return;
  }

  records.sort((a, b) => a.date.localeCompare(b.date));

  let text = '📅 <b>Your Attendance (last 30 days)</b>\n\n';
  for (const r of records) {
    const icon = r.status === 'present'  ? '✅'
               : r.status === 'holiday'  ? '🏖️'
               : '❌';
    text += icon + ' ' + r.date + ' — ' + r.status + '\n';
  }
  sendMessage(chatId, text);
}

// ---- /holidays ---------------------------------------------

function handleHolidays(msg) {
  const chatId  = String(msg.chat.id);
  const now     = new Date();
  const year    = Number(Utilities.formatDate(now, 'Asia/Kolkata', 'yyyy'));
  const month   = Number(Utilities.formatDate(now, 'Asia/Kolkata', 'M'));
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const holidays = getHolidaysForMonth(year, month);
  if (holidays.length === 0) {
    sendMessage(chatId, '🗓️ No holidays recorded for <b>' + MONTH_NAMES[month - 1] + ' ' + year + '</b>.');
    return;
  }

  let text = '🏖️ <b>Holidays — ' + MONTH_NAMES[month - 1] + ' ' + year + '</b>\n\n';
  holidays.sort((a, b) => a.date.localeCompare(b.date));
  for (const h of holidays) {
    text += '📌 ' + h.date + ' — ' + escapeHtml(h.reason) + '\n';
  }
  sendMessage(chatId, text);
}

// ---- /correct ----------------------------------------------

function handleCorrect(msg) {
  const chatId = String(msg.chat.id);
  if (!getUser(chatId)) {
    sendMessage(chatId, '❌ Not registered. Send /start first.');
    return;
  }

  const today = todayIST();
  if (isHoliday(today)) {
    sendMessage(chatId, '🏖️ Today is a holiday — no attendance to correct.');
    return;
  }

  sendInlineKeyboard(chatId,
    '✏️ <b>Correct Today\'s Attendance</b>\n\n' +
    'Date: ' + today + '\nSelect your correct status:',
    [[
      { text: '✅ Present',  callback_data: 'att_correct_present_' + today },
      { text: '❌ Absent',   callback_data: 'att_correct_absent_'  + today }
    ]]
  );
}

// ---- Free-text (onboarding flow handler) -------------------

/**
 * Called for any non-command text. Drives the multi-step onboarding state machine.
 */
function handleFreeText(msg) {
  const chatId  = String(msg.chat.id);
  const text    = (msg.text || '').trim();
  const session = getSession(chatId);

  if (!session) {
    sendMessage(chatId, '❓ Use /help to see available commands.');
    return;
  }

  // Step 1: name
  if (session.step === 'waiting_name') {
    if (text.length < 2) {
      sendMessage(chatId, '⚠️ Please enter your full name (at least 2 characters).');
      return;
    }
    setSession(chatId, { step: 'waiting_baseline_present', name: text });
    sendMessage(chatId,
      '🎉 Woohoo! So nice to meet you, <b>' + escapeHtml(text) + '</b>!\n\n' +
      '━━━━━━━━━━━━━━━━\n' +
      '📊 To get your stats perfectly calibrated, I just need a quick baseline.\n\n' +
      'How many classes have you <b>actually attended</b> so far since the semester started? 🤓\n' +
      '<i>(Just type a number, or hit me with a <b>0</b> if you are starting fresh!)</i>'
    );
    return;
  }

  // Step 2: baseline present
  if (session.step === 'waiting_baseline_present') {
    if (!/^\d+$/.test(text)) {
      sendMessage(chatId, '⚠️ Please enter a valid number (0 or more).');
      return;
    }
    const n = Number(text);
    setSession(chatId, { ...session, step: 'waiting_baseline_total', baselinePresent: n });
    sendMessage(chatId,
      '📝 Got it! <b>' + n + '</b> classes conquered. 💪\n\n' +
      'Now, how many total classes have been <b>held</b> in total?\n' +
      '<i>(Make sure it\'s at least ' + n + '!)</i>'
    );
    return;
  }

  // Step 3: baseline total
  if (session.step === 'waiting_baseline_total') {
    if (!/^\d+$/.test(text)) {
      sendMessage(chatId, '⚠️ Total classes must be a whole number ≥ ' + session.baselinePresent + '. Please try again.');
      return;
    }
    const n = Number(text);
    if (n < session.baselinePresent) {
      sendMessage(chatId, '⚠️ Total classes must be a number ≥ ' + session.baselinePresent + '. Please try again.');
      return;
    }

    const joinDate  = todayIST();
    const adminIds  = (getConfig('ADMIN_IDS') || '').split(',').map(s => s.trim());
    const adminFlag = adminIds.includes(chatId);

    upsertUser(chatId, session.name, joinDate, adminFlag, session.baselinePresent, n);
    setSession(chatId, null);

    const s      = computeStats(chatId);
    const pct    = s ? s.percent : (n > 0 ? Math.round(session.baselinePresent / n * 1000) / 10 : 100);
    const minPct = Number(getConfig('MIN_PERCENT')) || 75;
    const bar    = buildProgressBar(pct, minPct);

    sendMessage(chatId,
      '🎊 <b>Boom! You\'re officially all set up!</b> 🎊\n\n' +
      '👤 Buddy: <b>' + escapeHtml(session.name) + '</b>\n' +
      '📊 Starting point: ' + session.baselinePresent + ' / ' + n + ' classes\n\n' +
      bar + '\n\n' +
      (s && s.skippable > 0
        ? '📅 Awesome news: You can safely chill and skip <b>' + s.skippable + '</b> more class(es) without dipping below your threshold! 🏖️'
        : '⚠️ You\'re living on the edge! Better attend your upcoming classes to build up a safety net! 🏃‍♂️💨') +
      '\n\n━━━━━━━━━━━━━━━━\n' +
      '📲 I\'ll slide into your DMs every morning at <b>8:30 AM</b> to ask if you\'re going to college.\n' +
      'You can type /stats anytime to check your standing. /help shows all my tricks! ✨'
    );
  }
}
