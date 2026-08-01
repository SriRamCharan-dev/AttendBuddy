// ============================================================
// nl_agent.gs — Natural Language Interface via Gemini API
// ============================================================

const SYSTEM_PROMPT = `
You are the natural language router for AttendBuddy, an attendance and KPI tracking bot.
Your job is strictly to classify the user's intent into one of the known commands.
You are NOT allowed to converse. You must ONLY output a valid JSON object matching this schema:

{
  "intent": "STRING", // Must be one of: "logKPI", "getStats", "getHistory", "getGrowthStats", "adminAction", "unknown"
  "args": { // arguments based on the intent
    "metric": "STRING", // only for logKPI (e.g., 'dsa', 'study_hours')
    "value": NUMBER     // only for logKPI (e.g., 3)
  }
}

Definitions of intents:
- "getStats": The user wants to see their current attendance stats, how many bunks they have left, or their general status.
- "getHistory": The user wants to see their past attendance records.
- "getGrowthStats": The user wants to see their KPI, streaks, or growth progress.
- "logKPI": The user is reporting a metric (e.g., "I solved 3 dsa problems", "studied for 2 hours", "did 5 pushups"). Extract the metric name into 'metric' and the number into 'value'. Note: metric should ideally match active metrics they might have.
- "adminAction": The user is asking to broadcast a message, change settings, declare a holiday, or correct attendance.
- "unknown": Anything else, general chat, or ambiguous requests.

Remember, ONLY output the JSON object. Do not wrap in markdown blocks, just raw JSON.
`;

function handleNLQuery(msg) {
  const chatId = String(msg.chat.id);
  const text = (msg.text || '').trim();
  
  const apiKey = getConfig('GEMINI_API_KEY');
  if (!apiKey) {
    sendMessage(chatId, '❓ I did not understand that command. Use /help to see all available commands.\n*(NL Layer inactive: GEMINI_API_KEY missing)*');
    return;
  }

  // Send indicator
  sendMessage(chatId, '🤖 <i>Thinking...</i>');

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;
  
  const payload = {
    "system_instruction": {
      "parts": [{ "text": SYSTEM_PROMPT }]
    },
    "contents": [{
      "parts": [{ "text": text }]
    }],
    "generationConfig": {
      "temperature": 0.0,
      "responseMimeType": "application/json"
    }
  };

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      Logger.log('Gemini API Error: ' + response.getContentText());
      sendMessage(chatId, '⚠️ Sorry, my AI brain is currently overloaded. Please use standard slash commands like /help.');
      return;
    }

    const json = JSON.parse(response.getContentText());
    if (!json.candidates || !json.candidates[0] || !json.candidates[0].content) {
      throw new Error("Invalid response format");
    }
    
    const outputText = json.candidates[0].content.parts[0].text;
    const result = JSON.parse(outputText);

    // Route based on intent
    switch (result.intent) {
      case 'getStats':
        handleStats(msg);
        break;
      case 'getHistory':
        handleHistory(msg);
        break;
      case 'getGrowthStats':
        handleGrowthStats(msg);
        break;
      case 'logKPI':
        if (!result.args || !result.args.metric || result.args.value === undefined) {
          sendMessage(chatId, '⚠️ I understood you want to log a KPI, but I couldn\'t extract the metric and value. Please use `/logkpi <metric> <value>`.');
        } else {
          // Construct textArgs array and pass to handleLogKpi
          // handleLogKpi expects args from msg.text, so let's mock it
          const mockMsg = {
             ...msg,
             text: '/logkpi ' + result.args.metric + ' ' + result.args.value
          };
          handleLogKpi(mockMsg);
        }
        break;
      case 'adminAction':
        sendMessage(chatId, '🛡️ For security reasons, administrative actions (like broadcasting, holidays, settings, or corrections) cannot be done via natural language. Please use the exact slash-command (e.g. /broadcast, /holiday, /settings, /correct).');
        break;
      case 'unknown':
      default:
        sendMessage(chatId, '❓ I didn\'t catch that — try /help to see all available commands.');
        break;
    }
  } catch (err) {
    Logger.log('NL Agent Error: ' + err.message);
    sendMessage(chatId, '❓ I didn\'t catch that — try /help to see all available commands.');
  }
}
