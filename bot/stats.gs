// ============================================================
// stats.gs — Attendance statistics & eligibility engine
//
// All calculation is purely arithmetic — no AI/LLM involved.
// Attendance is cumulative from onboarding; skip allowance forecasts this month.
// ============================================================

// ---- Date helpers ------------------------------------------

/**
 * Returns today's date as a YYYY-MM-DD string in IST (Asia/Kolkata).
 */
function todayIST() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
}

/**
 * Returns { firstDay, lastDay } as YYYY-MM-DD strings for the given month.
 */
function getMonthBounds(year, month) {
  const firstDay = year + '-' + String(month).padStart(2, '0') + '-01';
  const lastDate = new Date(Date.UTC(year, month, 0)); // day 0 of next month = last day of this month
  const lastDay  = year + '-' + String(month).padStart(2, '0') + '-' + String(lastDate.getUTCDate()).padStart(2, '0');
  return { firstDay, lastDay };
}

function nextDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + 1);
  return Utilities.formatDate(date, 'Asia/Kolkata', 'yyyy-MM-dd');
}

function previousDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() - 1);
  return Utilities.formatDate(date, 'Asia/Kolkata', 'yyyy-MM-dd');
}

function isValidDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(dateStr + 'T00:00:00Z');
  return !isNaN(date.getTime()) && Utilities.formatDate(date, 'Asia/Kolkata', 'yyyy-MM-dd') === dateStr;
}

/** Day number in IST: Sunday=0, Monday=1 … Saturday=6. */
function getDayOfWeekIST(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  return Number(Utilities.formatDate(date, 'Asia/Kolkata', 'u')) % 7;
}

/**
 * Returns an array of day-of-week numbers (0=Sun … 6=Sat) that are working days.
 * Reads WORK_DAYS from Config (comma-separated). Defaults to Mon–Sat = [1,2,3,4,5,6].
 */
function getWorkDays() {
  const cfg = getConfig('WORK_DAYS');
  if (cfg && cfg.trim()) return cfg.split(',').map(Number);
  return [1, 2, 3, 4, 5, 6]; // Mon=1 … Sat=6; Sun=0 excluded
}

/**
 * Count working (non-holiday, non-weekend) days in [fromStr, toStr] inclusive.
 * @param {string} fromStr YYYY-MM-DD
 * @param {string} toStr   YYYY-MM-DD
 */
function countWorkingDays(fromStr, toStr) {
  if (fromStr > toStr) return 0;
  const workDays = getWorkDays();
  const cur      = new Date(fromStr + 'T00:00:00Z');
  const end      = new Date(toStr   + 'T00:00:00Z');
  let count = 0;
  while (cur <= end) {
    const dateStr = Utilities.formatDate(cur, 'Asia/Kolkata', 'yyyy-MM-dd');
    const dow     = getDayOfWeekIST(dateStr);
    if (workDays.includes(dow) && !isHoliday(dateStr)) count++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
}

// ---- Core stats computation --------------------------------

/**
 * Compute live cumulative attendance stats, with a current-month forecast.
 *
 * Returns:
 * {
 *   name, present, absent, elapsed, remaining,
 *   totalMonthWorkingDays, percent, minPct, skippable,
 *   month, year
 * }
 *
 * The onboarding baseline covers all classes held through the join date.
 * Daily records are counted from the following day, including across months.
 */
function computeStats(chatId) {
  const user = getUser(chatId);
  if (!user) return null;

  const today   = todayIST();
  const now     = new Date();
  const year    = Number(Utilities.formatDate(now, 'Asia/Kolkata', 'yyyy'));
  const month   = Number(Utilities.formatDate(now, 'Asia/Kolkata', 'M'));

  const { lastDay } = getMonthBounds(year, month);
  const joinDateStr = dateKey(user.joinDate);
  const firstTrackedDate = nextDate(joinDateStr);
  // A working day is not elapsed until attendance is resolved. Before the
  // morning prompt (or before a manual mark), today remains forecast time.
  const todayIsWorkingDay = getWorkDays().includes(getDayOfWeekIST(today)) && !isHoliday(today);
  const todayResolved = joinDateStr === today || !todayIsWorkingDay || hasResponded(chatId, today);
  const elapsedThrough = todayResolved ? today : previousDate(today);
  const postBaselineDays = firstTrackedDate <= elapsedThrough
    ? countWorkingDays(firstTrackedDate, elapsedThrough)
    : 0;
  const elapsed = user.baselineTotal + postBaselineDays;

  // Working days remaining this month
  const tomorrowStr = nextDate(today);
  const remainingStart = todayResolved ? tomorrowStr : today;
  const remaining   = remainingStart <= lastDay ? countWorkingDays(remainingStart, lastDay) : 0;

  const termDaysByMonthEnd = elapsed + remaining;

  // The onboarding baseline covers the join date and all earlier classes.
  const records = getAttendanceForUser(chatId, firstTrackedDate, elapsedThrough);
  
  const presentCount = records.filter(r => r.status === 'present').length;
  const totalPresent = user.baselinePresent + presentCount;
  const minPct       = Number(getConfig('MIN_PERCENT')) || 75;
  const percent      = elapsed > 0 ? Math.round((totalPresent / elapsed) * 1000) / 10 : 100;
  const monthStart = getMonthBounds(year, month).firstDay;
  const monthTrackedStart = firstTrackedDate > monthStart ? firstTrackedDate : monthStart;
  const monthElapsed = monthTrackedStart <= elapsedThrough
    ? countWorkingDays(monthTrackedStart, elapsedThrough) : 0;
  const monthRecords = records.filter(r => r.date >= monthStart);
  const monthPresent = monthRecords.filter(r => r.status === 'present').length;
  const monthPercent = monthElapsed > 0 ? Math.round((monthPresent / monthElapsed) * 1000) / 10 : 100;
  const monthForecastPercent = monthElapsed + remaining > 0
    ? Math.round(((monthPresent + remaining) / (monthElapsed + remaining)) * 1000) / 10 : 100;
  const termForecastPercent = termDaysByMonthEnd > 0
    ? Math.round(((totalPresent + remaining) / termDaysByMonthEnd) * 1000) / 10 : 100;

  // Fix IEEE 754 floating-point inaccuracies by using integer arithmetic.
  // Instead of targetRate * elapsed, we use (minPct * elapsed) / 100.
  const requiredFutureAttendance = Math.max(0, Math.ceil((minPct * termDaysByMonthEnd - 100 * totalPresent) / 100));
  const skippable = Math.max(0, remaining - requiredFutureAttendance);
  const classesToRecover = percent < minPct && minPct < 100
    ? Math.max(0, Math.ceil((minPct * elapsed - 100 * totalPresent) / (100 - minPct)))
    : 0;

  return {
    name:                 user.name,
    present:              totalPresent,
    absent:               Math.max(0, elapsed - totalPresent),
    elapsed,
    remaining,
    termDaysByMonthEnd,
    percent,
    termPercent: percent,
    termForecastPercent,
    monthElapsed,
    monthPresent,
    monthPercent,
    monthForecastPercent,

    minPct,
    skippable,
    requiredFutureAttendance,
    classesToRecover,
    month,
    year
  };
}

// ---- Display helper ----------------------------------------

/**
 * Builds a live 20-cell meter with the current distance from the target.
 */
function buildProgressBar(percent, minPct) {
  const cells    = 20;
  const filled   = Math.max(0, Math.min(cells, Math.round(percent / 100 * cells)));
  const empty    = cells - filled;
  const bar      = '█'.repeat(filled) + '░'.repeat(empty);
  const safeIcon = percent >= minPct ? '🟢' : '🔴';
  const delta    = Math.round((percent - minPct) * 10) / 10;
  const label    = delta >= 0 ? '+' + delta : String(delta);
  return safeIcon + ' <code>' + bar + '</code> <b>' + percent + '%</b>\n' +
    '🎯 Target ' + minPct + '% · ' + label + ' pts';
}

// ---- Growth KPI Stats ---------------------------------------

function getISOWeekBounds(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay() || 7; // 1=Mon .. 7=Sun
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  // Get Monday
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - 3);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    monday: Utilities.formatDate(monday, 'Asia/Kolkata', 'yyyy-MM-dd'),
    sunday: Utilities.formatDate(sunday, 'Asia/Kolkata', 'yyyy-MM-dd')
  };
}

function computeGrowthStats(chatId) {
  const user = getUser(chatId);
  if (!user) return null;

  const today = todayIST();
  const kpiRecords = getKpiRecordsForUser(chatId);
  
  const activeMetricsStr = getConfig('kpimetrics');
  if (!activeMetricsStr) return { active: false };
  const metrics = activeMetricsStr.split(',').map(s => s.trim()).filter(Boolean);
  
  const { monday, sunday } = getISOWeekBounds(today);
  
  const results = {};
  let anyKpiThisWeek = false;

  for (const m of metrics) {
    const targetStr = getConfig('kpitarget_' + m) || '0';
    const target = Number(targetStr);
    
    // Weekly total
    const thisWeekRecords = kpiRecords.filter(r => r.metricKey === m && r.date >= monday && r.date <= sunday);
    const weeklyTotal = thisWeekRecords.reduce((acc, r) => acc + r.value, 0);
    if (weeklyTotal > 0) anyKpiThisWeek = true;

    // Progress
    let progress = 0;
    if (target > 0) {
      progress = Math.min(100, Math.round((weeklyTotal / (target * 7)) * 100));
    }

    // Streak
    let streak = 0;
    let curDate = today;
    while (true) {
      const rec = kpiRecords.find(r => r.metricKey === m && r.date === curDate);
      if (!rec || rec.value <= 0) {
        // If today has no record, we still check yesterday before breaking the streak completely
        if (curDate === today) {
           curDate = previousDate(curDate);
           const yestRec = kpiRecords.find(r => r.metricKey === m && r.date === curDate);
           if (!yestRec || yestRec.value <= 0) break; // streak broken yesterday
           // if yesterday has record, we don't break, streak counts yesterday's value. 
           // wait, we should count it. So we let loop continue but we increment streak?
           // No, if today has no record, streak is just yesterday's streak. We shouldn't increment for today.
           // Actually, easiest way: if today is missing, skip incrementing streak, check yesterday. 
           curDate = previousDate(today);
           continue; 
        } else {
           break;
        }
      }
      streak++;
      curDate = previousDate(curDate);
    }
    
    results[m] = { weeklyTotal, progress, streak, target };
  }
  
  // Correlation flag: Did attendance drop >10% this week compared to last week, AND KPI total = 0?
  let correlationFlag = false;
  if (!anyKpiThisWeek) {
    const lastWeekMon = previousDate(previousDate(previousDate(previousDate(previousDate(previousDate(previousDate(monday)))))));
    const lastWeekSun = previousDate(monday);
    
    const attRecords = getAttendanceForUser(chatId, lastWeekMon, sunday);
    
    const lastWeekAtt = attRecords.filter(r => r.date >= lastWeekMon && r.date <= lastWeekSun);
    const thisWeekAtt = attRecords.filter(r => r.date >= monday && r.date <= sunday);
    
    const lwPresent = lastWeekAtt.filter(r => r.status === 'present').length;
    const lwElapsed = countWorkingDays(lastWeekMon, lastWeekSun);
    const lwPct = lwElapsed > 0 ? (lwPresent/lwElapsed)*100 : 100;
    
    const twPresent = thisWeekAtt.filter(r => r.status === 'present').length;
    let elapsedThroughTw = today; 
    if (elapsedThroughTw > sunday) elapsedThroughTw = sunday;
    const twElapsed = countWorkingDays(monday, elapsedThroughTw);
    const twPct = twElapsed > 0 ? (twPresent/twElapsed)*100 : 100;
    
    if (lwPct - twPct > 10) {
      correlationFlag = true;
    }
  }

  return { active: true, metrics: results, correlationFlag };
}
