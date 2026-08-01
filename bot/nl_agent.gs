// ============================================================
// nl_agent.gs — Natural Language Interface via Groq API
// ============================================================

const SYSTEM_PROMPT = `
You are AttendBuddy, a friendly attendance tracking bot. 
If the user asks to perform an action (like checking stats, viewing history, adding holidays, correcting attendance, or checking group stats), you MUST call the appropriate tool.
If the user just says hello, makes small talk, or asks a question unrelated to the tools, respond naturally and politely in a short sentence, and suggest they can use commands like checking their attendance. Do NOT call any tools for small talk.
`;

const NL_TOOLS = [
  {
    type: "function",
    function: {
      name: "getStats",
      description: "Get the user's current attendance stats and skippable days (e.g. 'how am I doing this month', 'can I skip tomorrow')."
    }
  },
  {
    type: "function",
    function: {
      name: "getHistory",
      description: "Get the user's attendance history for the last 30 days (e.g. 'what did I mark last Tuesday')."
    }
  },
  {
    type: "function",
    function: {
      name: "getHolidays",
      description: "Get the list of holidays for this month (e.g. 'when is the next holiday')."
    }
  },
  {
    type: "function",
    function: {
      name: "correctOwnAttendance",
      description: "Correct the user's own attendance for today (e.g. 'I actually went today, fix it')."
    }
  },
  {
    type: "function",
    function: {
      name: "changeSettings",
      description: "Admin action: change global settings like minimum percentage (e.g. 'set the minimum to 75%')."
    }
  },
  {
    type: "function",
    function: {
      name: "addHoliday",
      description: "Admin action: add or remove a holiday (e.g. 'add a holiday tomorrow')."
    }
  },
  {
    type: "function",
    function: {
      name: "broadcast",
      description: "Admin action: broadcast a message to all users."
    }
  },
  {
    type: "function",
    function: {
      name: "getMonthlyStats",
      description: "Admin action: get the monthly summary of all users' attendance (e.g. 'show me this month\\'s group summary')."
    }
  }
];

function handleNLQuery(msg) {
  const chatId = String(msg.chat.id);
  const text = (msg.text || '').trim();
  
  const apiKey = getConfig('GROQ_API_KEY');
  if (!apiKey) {
    sendMessage(chatId, '❓ I did not understand that command. Use /help to see all available commands.\n*(NL Layer inactive: GROQ_API_KEY missing)*');
    return;
  }

  // Send indicator
  sendMessage(chatId, '🤖 <i>Thinking...</i>');

  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  const payload = {
    "model": "llama-3.1-8b-instant",
    "messages": [
      { "role": "system", "content": SYSTEM_PROMPT },
      { "role": "user", "content": text }
    ],
    "tools": NL_TOOLS,
    "tool_choice": "auto",
    "temperature": 0.0
  };

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      Logger.log('Groq API Error: ' + response.getContentText());
      sendMessage(chatId, '❓ I didn\'t catch that — try /help to see all available commands.');
      return;
    }

    const json = JSON.parse(response.getContentText());
    if (!json.choices || !json.choices[0] || !json.choices[0].message) {
      throw new Error("Invalid response format");
    }
    
    const message = json.choices[0].message;
    
    if (!message.tool_calls || message.tool_calls.length === 0) {
      if (message.content) {
        sendMessage(chatId, message.content);
      } else {
        sendMessage(chatId, '❓ I didn\'t catch that — try /help to see all available commands.');
      }
      return;
    }
    
    const toolCall = message.tool_calls[0].function.name;

    // Route based on function call
    switch (toolCall) {
      case 'getStats':
        handleStats(msg);
        break;
      case 'getHistory':
        handleHistory(msg);
        break;
      case 'getHolidays':
        handleHolidays(msg);
        break;
      case 'correctOwnAttendance':
        handleCorrect(msg);
        break;
      case 'getMonthlyStats':
        handleMonthlyStats(msg);
        break;
      case 'changeSettings':
        sendMessage(chatId, '🛡️ For security reasons, administrative actions cannot be done via natural language. Please use the exact slash-command: /settings');
        break;
      case 'addHoliday':
        sendMessage(chatId, '🛡️ For security reasons, administrative actions cannot be done via natural language. Please use the exact slash-command: /holiday');
        break;
      case 'broadcast':
        sendMessage(chatId, '🛡️ For security reasons, administrative actions cannot be done via natural language. Please use the exact slash-command: /broadcast');
        break;
      default:
        sendMessage(chatId, '❓ I didn\'t catch that — try /help to see all available commands.');
        break;
    }
  } catch (err) {
    Logger.log('NL Agent Error: ' + err.message);
    sendMessage(chatId, '❓ I didn\'t catch that — try /help to see all available commands.');
  }
}

