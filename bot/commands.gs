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
    '🗓️ <b>This month:</b> ' + s.percent + '% (' + s.present + '/' + s.elapsed + ')\n' +
    '🔮 <b>Month-end forecast:</b> ' + s.monthForecastPercent + '% if you attend every remaining class\n' +
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
    handleNLQuery(msg);
    return;
  }

  // Step 1: name
  if (session.step === 'waiting_name') {
    if (text.length < 2) {
      sendMessage(chatId, '⚠️ Please enter your full name (at least 2 characters).');
      return;
    }
    const joinDate  = todayIST();
    const now = new Date();
    const year = Number(Utilities.formatDate(now, 'Asia/Kolkata', 'yyyy'));
    const month = Number(Utilities.formatDate(now, 'Asia/Kolkata', 'M'));
    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthName = MONTH_NAMES[month - 1];
    const monthStart = year + '-' + String(month).padStart(2, '0') + '-01';
    
    const computedTotal = countWorkingDays(monthStart, joinDate);
    
    const allHols = getHolidaysForMonth(year, month).filter(h => h.date <= joinDate);
    let holText = '';
    if (allHols.length > 0) {
      const formattedHols = allHols.map(h => {
        const d = parseInt(h.date.split('-')[2], 10);
        return monthName + ' ' + d + ' - ' + escapeHtml(h.reason || 'Holiday');
      }).join(', ');
      holText = ' and ' + allHols.length + ' admin holiday' + (allHols.length > 1 ? 's' : '') + ': ' + formattedHols;
    }

    setSession(chatId, { step: 'waiting_baseline_present', name: text });
    sendMessage(chatId,
      '🎉 Woohoo! So nice to meet you, <b>' + escapeHtml(text) + '</b>!\n\n' +
      '━━━━━━━━━━━━━━━━\n' +
      '📊 This month (' + monthName + ') has exactly <b>' + computedTotal + '</b> total working days till date.\n' +
      '<i>(I subtracted all Sundays' + holText + '.)</i>\n\n' +
      'How many classes have you <b>actually attended</b> so far? 🤓\n' +
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

    const joinDate  = todayIST();
    const now = new Date();
    const year = Number(Utilities.formatDate(now, 'Asia/Kolkata', 'yyyy'));
    const month = Number(Utilities.formatDate(now, 'Asia/Kolkata', 'M'));
    const monthStart = year + '-' + String(month).padStart(2, '0') + '-01';
    
    // Automatically compute total classes held this month up to joinDate
    const computedTotal = countWorkingDays(monthStart, joinDate);
    
    // If user somehow enters more attended classes than held, cap it or error.
    // For smoothness, we'll cap it at computedTotal if it's over, or just let them re-enter.
    if (n > computedTotal && computedTotal > 0) {
      sendMessage(chatId, '⚠️ You cannot have attended more classes than were actually held this month (' + computedTotal + '). Please enter a valid number.');
      return;
    }
    
    const baselineTotal = Math.max(n, computedTotal); // Safely ensure total >= present

    const adminIds  = (getConfig('ADMIN_IDS') || '').split(',').map(s => s.trim());
    const adminFlag = adminIds.includes(chatId);

    upsertUser(chatId, session.name, joinDate, adminFlag, n, baselineTotal);
    setSession(chatId, null);

    const s      = computeStats(chatId);
    const pct    = s ? s.percent : (baselineTotal > 0 ? Math.round(n / baselineTotal * 1000) / 10 : 100);
    const minPct = Number(getConfig('MIN_PERCENT')) || 75;
    const bar    = buildProgressBar(pct, minPct);

    sendMessage(chatId,
      '🎊 <b>Boom! You\'re officially all set up!</b> 🎊\n\n' +
      '👤 Buddy: <b>' + escapeHtml(session.name) + '</b>\n' +
      '📊 Starting point: ' + n + ' / ' + baselineTotal + ' classes\n\n' +
      bar + '\n\n' +
      (s && s.skippable > 0
        ? '📅 Awesome news: You can safely chill and skip <b>' + s.skippable + '</b> more class(es) this month without dipping below your threshold! 🏖️'
        : '⚠️ You\'re living on the edge! Better attend your upcoming classes to build up a safety net! 🏃‍♂️💨') +
      '\n\n━━━━━━━━━━━━━━━━\n' +
      '📲 I\'ll slide into your DMs every morning at <b>8:30 AM</b> to ask if you\'re going to college.\n' +
      'You can type /stats anytime to check your standing. /help shows all my tricks! ✨'
// ---- GrowKPI Commands ----------------------------------------

function handleLogKpi(msg, textArgs) {
  const chatId = String(msg.chat.id);
  if (!getUser(chatId)) {
    sendMessage(chatId, '❌ You\'re not registered yet. Send /start to begin.');
    return;
  }

  // Expecting: /logkpi <metric> <value>
  // textArgs comes from the router if we pass it, or we parse from msg.text
  const args = msg.text.trim().split(/\s+/).slice(1);
  if (args.length < 2) {
    sendMessage(chatId, '⚠️ Usage: /logkpi <metric> <value>\nExample: /logkpi dsa 3');
    return;
  }

  const metric = args[0].toLowerCase();
  const value = Number(args[1]);

  if (isNaN(value)) {
    sendMessage(chatId, '⚠️ The value must be a number.\nExample: /logkpi dsa 3');
    return;
  }

  const activeMetricsStr = getConfig('kpimetrics');
  const metrics = activeMetricsStr ? activeMetricsStr.split(',').map(s => s.trim().toLowerCase()) : [];

  if (!metrics.includes(metric)) {
    sendMessage(chatId, '❌ Unknown metric. Active metrics: ' + (metrics.join(', ') || 'none'));
    return;
  }

  const today = todayIST();
  logKpiValue(chatId, today, metric, value, 'manual');
  logAudit(chatId, 'KPI_LOGGED', metric, 'value: ' + value + ' source: manual');

  // get streak to reply
  const stats = computeGrowthStats(chatId);
  const metricStats = stats && stats.metrics ? stats.metrics[metric] : null;
  const streak = metricStats ? metricStats.streak : 1;

  sendMessage(chatId, '✅ Logged ' + value + ' for <b>' + escapeHtml(metric) + '</b> today!\nCurrent streak: 🔥 ' + streak + ' day(s)');
}

function handleGrowthStats(msg) {
  const chatId = String(msg.chat.id);
  if (!getUser(chatId)) {
    sendMessage(chatId, '❌ You\'re not registered yet. Send /start to begin.');
    return;
  }

  const stats = computeGrowthStats(chatId);
  if (!stats || !stats.active) {
    sendMessage(chatId, '📈 No growth metrics are currently active for this group.');
    return;
  }

  let text = '📈 <b>Your Growth Stats (This Week)</b>\n\n';
  
  const metricKeys = Object.keys(stats.metrics);
  if (metricKeys.length === 0) {
    text += 'No metrics configured.';
  } else {
    for (const m of metricKeys) {
      const data = stats.metrics[m];
      text += '🔹 <b>' + m.toUpperCase() + '</b>\n';
      text += 'Total this week: ' + data.weeklyTotal + ' (Target: ' + (data.target > 0 ? (data.target*7) : 'None') + ')\n';
      if (data.target > 0) {
        text += 'Progress: ' + data.progress + '%\n';
      }
      text += 'Streak: 🔥 ' + data.streak + ' day(s)\n\n';
    }
  }

  if (stats.correlationFlag) {
    text += '<i>⚠️ Note: Your attendance dipped this week and no KPIs were logged — worth checking in with yourself.</i>\n';
  }

  sendMessage(chatId, text);
}
