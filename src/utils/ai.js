
// Pre-defined model configurations
export const MODEL_PROVIDERS = {
  pollinations: {
    name: 'Pollinations AI (Free)',
    defaultBaseUrl: 'https://text.pollinations.ai',
    models: [
      { id: 'openai', name: 'OpenAI (Free Tier)' }, // Pollinations routes to various models
      { id: 'mistral', name: 'Mistral (Free)' },
      { id: 'llama', name: 'Llama (Free)' }
    ]
  },
  openai: {
    name: 'OpenAI (Compatible)',
    defaultBaseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Omni)' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ]
  },
  deepseek: {
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1', // Standard compatible endpoint
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat V2' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder V2' },
    ]
  },
  moonshot: {
    name: 'Moonshot (Kimi)',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot V1 (8k)' },
      { id: 'moonshot-v1-32k', name: 'Moonshot V1 (32k)' },
      { id: 'moonshot-v1-128k', name: 'Moonshot V1 (128k)' },
    ]
  },
  google: {
    name: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: [
      { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash' },
      { id: 'gemini-pro', name: 'Gemini 1.0 Pro' },
    ]
  },
  openrouter: {
    name: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
      { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro' },
      { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B' },
    ]
  }
};

/**
 * Send message to AI Provider
 * @param {Object} params
 * @param {string} params.provider - Provider key (openai, deepseek, etc.)
 * @param {string} params.apiKey - API Key
 * @param {string} params.baseUrl - Custom Base URL (optional)
 * @param {string} params.model - Model ID
 * @param {Array} params.messages - Chat history [{role: 'user', content: '...'}, ...]
 * @returns {Promise<string>} - The AI response text
 */
export const sendMessageToAI = async ({ provider, apiKey, baseUrl, model, messages }) => {
  // 0. Pollinations Free API Handling
  if (provider === 'pollinations') {
     // Construct prompt from messages
     const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
     // Encode prompt
     const encodedPrompt = encodeURIComponent(prompt);
     // Pollinations supports /prompt/model=modelname?json=true usually, but let's stick to simple text GET
     // or use the 'model' query param if supported. Pollinations text API is usually just /prompt
     // Let's try: https://text.pollinations.ai/{prompt}?model={model}
     const url = `https://text.pollinations.ai/${encodedPrompt}?model=${model || 'openai'}`;
     
     try {
         const response = await fetch(url);
         if (!response.ok) throw new Error('Pollinations API Error');
         const text = await response.text();
         return text;
     } catch (error) {
         console.error('Pollinations Error:', error);
         throw new Error('Free AI Service Busy, please try again or use a Key.');
     }
  }

  if (!apiKey) {
    throw new Error('Please provide an API Key in settings.');
  }

  const providerConfig = MODEL_PROVIDERS[provider];
  const finalBaseUrl = baseUrl || providerConfig.defaultBaseUrl;

  // 1. Google Gemini Handling
  if (provider === 'google') {
    // Gemini uses a different URL structure: https://generativelanguage.googleapis.com/v1beta/models/GEMINI_MODEL:generateContent?key=API_KEY
    const url = `${finalBaseUrl}/models/${model}:generateContent?key=${apiKey}`;
    
    // Transform messages to Gemini format
    // Gemini expects: { contents: [{ role: "user" | "model", parts: [{ text: "..." }] }] }
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Gemini API Error');
      }

      const data = await response.json();
      // Gemini response structure: candidates[0].content.parts[0].text
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '(No response text)';
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  // 2. OpenAI Compatible Handling (OpenAI, DeepSeek, Moonshot, OpenRouter)
  // Standard endpoint: POST /chat/completions
  let url = finalBaseUrl;
  if (!url.endsWith('/chat/completions')) {
      // Auto-append if missing, but be careful with custom URLs. 
      // Most users input just the base (e.g. https://api.openai.com/v1), so we append /chat/completions
      // If user inputs full path, we might double it, so basic check:
      url = `${url.replace(/\/+$/, '')}/chat/completions`;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  // OpenRouter specific headers
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'My Reading Assistant';
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        stream: false // Using non-streaming for simplicity in this version
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '(No response content)';
  } catch (error) {
    console.error('AI API Error:', error);
    throw error;
  }
};
