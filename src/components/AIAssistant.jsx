import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Sparkles, Image as ImageIcon, Link as LinkIcon, Loader2, Maximize2, Minimize2, Globe, Settings, ChevronDown, Save } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { MODEL_PROVIDERS, sendMessageToAI } from '../utils/ai';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Fullscreen mode
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings State
  const [settings, setSettings] = useLocalStorage('ai_settings', {
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    model: 'gpt-3.5-turbo'
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: '你好！我是你的智能阅读助手。我已经接入了多种最新的AI模型。点击右上角的设置图标 ⚙️ 配置你的API Key后，即可开始深度对话。同时，我依然支持 "找一张...图" 的图片搜索功能。',
      timestamp: new Date()
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // AI Logic
  const processAIResponse = async (query) => {
    setIsLoading(true);
    let responseContent = '';
    let responseType = 'text';
    let mediaUrl = '';

    const lowerQuery = query.toLowerCase();

    // 1. Image Generation Logic (Independent of API Key)
    if (lowerQuery.includes('图') || lowerQuery.includes('photo') || lowerQuery.includes('image') || lowerQuery.includes('照片')) {
       const keyword = query.replace(/(找|搜索|查询|一下|关于|的|图片|照片|image|photo)/g, '').trim() || 'library';
       responseType = 'image';
       mediaUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(keyword)}?width=800&height=600&nologo=true`;
       responseContent = `这是为您找到的关于 "${keyword}" 的图片：`;
       
       // Add message directly for image
        const newMessage = {
            id: Date.now(),
            type: 'ai',
            content: responseContent,
            mediaType: responseType,
            mediaUrl: mediaUrl,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
        setIsLoading(false);
        return;
    }

    // 2. Real AI API Call
    if (!settings.apiKey && settings.provider !== 'pollinations') {
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'ai',
            content: '⚠️ 请先点击右上角设置图标，配置您的 API Key 才能使用 AI 对话功能。',
            timestamp: new Date()
        }]);
        setIsLoading(false);
        return;
    }

    try {
        // Format history for API
        const apiMessages = messages
            .filter(m => m.type !== 'system' && !m.mediaType) // Filter out system/image messages if needed, or keep text
            .map(m => ({
                role: m.type === 'user' ? 'user' : 'assistant',
                content: m.content
            }));
        
        // Add current user message
        apiMessages.push({ role: 'user', content: query });

        const aiText = await sendMessageToAI({
            provider: settings.provider,
            apiKey: settings.apiKey,
            baseUrl: settings.baseUrl,
            model: settings.model,
            messages: apiMessages
        });

        responseContent = aiText;

    } catch (error) {
        responseContent = `❌ 请求失败: ${error.message}`;
    }

    const newMessage = {
      id: Date.now(),
      type: 'ai',
      content: responseContent,
      mediaType: responseType,
      mediaUrl: mediaUrl,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(false);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    
    processAIResponse(currentInput);
  };

  const handleProviderChange = (e) => {
      const newProvider = e.target.value;
      const defaultModel = MODEL_PROVIDERS[newProvider].models[0].id;
      setSettings({
          ...settings,
          provider: newProvider,
          model: defaultModel,
          baseUrl: '' // Reset base URL when switching provider defaults
      });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-amber-600 to-amber-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50 group"
        title="打开AI阅读助手"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
        <span className="absolute right-full mr-3 bg-stone-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          AI 助手
        </span>
      </button>
    );
  }

  return (
    <div className={`fixed z-50 transition-all duration-300 ease-in-out flex flex-col bg-white shadow-2xl border border-amber-100 font-sans
      ${isExpanded 
        ? 'inset-4 rounded-xl' 
        : 'bottom-6 right-6 w-[380px] h-[600px] rounded-xl'
      }
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-white rounded-t-xl shrink-0">
        <div className="flex items-center gap-2 text-amber-900">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-sm">AI 阅读助手</h3>
            <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${(settings.apiKey || settings.provider === 'pollinations') ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></span>
                <span className="text-[10px] text-amber-700/60 truncate max-w-[120px]">
                    {MODEL_PROVIDERS[settings.provider]?.name}
                </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-amber-100 text-amber-700' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`}
            title="API设置"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
          <div className="p-4 bg-stone-50 border-b border-amber-100 space-y-3 text-sm animate-fade-in">
              <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1">模型提供商 (Provider)</label>
                  <div className="relative">
                    <select 
                        value={settings.provider} 
                        onChange={handleProviderChange}
                        className="w-full p-2 border border-stone-200 rounded bg-white focus:outline-none focus:border-amber-500 appearance-none"
                    >
                        {Object.entries(MODEL_PROVIDERS).map(([key, provider]) => (
                            <option key={key} value={key}>{provider.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2 top-2.5 pointer-events-none" />
                  </div>
              </div>
              
              <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1">模型 (Model)</label>
                  <div className="relative">
                    <select 
                        value={settings.model} 
                        onChange={(e) => setSettings({...settings, model: e.target.value})}
                        className="w-full p-2 border border-stone-200 rounded bg-white focus:outline-none focus:border-amber-500 appearance-none"
                    >
                        {MODEL_PROVIDERS[settings.provider].models.map(model => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2 top-2.5 pointer-events-none" />
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1">
                      API Key {settings.provider === 'pollinations' && <span className="text-green-600 font-normal">(免费模式无需 Key)</span>}
                  </label>
                  <input 
                    type="password" 
                    value={settings.apiKey}
                    onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                    placeholder={settings.provider === 'pollinations' ? '无需填写' : `输入 ${MODEL_PROVIDERS[settings.provider].name} API Key`}
                    disabled={settings.provider === 'pollinations'}
                    className={`w-full p-2 border border-stone-200 rounded focus:outline-none focus:border-amber-500 ${settings.provider === 'pollinations' ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : ''}`}
                  />
              </div>

              <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1">自定义 Base URL (可选)</label>
                  <input 
                    type="text" 
                    value={settings.baseUrl}
                    onChange={(e) => setSettings({...settings, baseUrl: e.target.value})}
                    placeholder={MODEL_PROVIDERS[settings.provider].defaultBaseUrl}
                    className="w-full p-2 border border-stone-200 rounded focus:outline-none focus:border-amber-500 placeholder-stone-300"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">留空则使用默认地址。如使用中转/代理，请在此填入地址。</p>
              </div>
              
              <div className="pt-2 flex justify-end">
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 flex items-center gap-1"
                  >
                      <Save className="w-3 h-3" /> 完成设置
                  </button>
              </div>
          </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/30">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
              ${msg.type === 'user' ? 'bg-stone-800 text-white' : 'bg-amber-100 text-amber-700'}
            `}>
              {msg.type === 'user' ? 'ME' : 'AI'}
            </div>
            
            <div className={`max-w-[85%] space-y-2`}>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm
                ${msg.type === 'user' 
                  ? 'bg-stone-800 text-stone-50 rounded-tr-none' 
                  : 'bg-white border border-amber-100 text-stone-700 rounded-tl-none'
                }
              `}>
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>

              {/* Media Content (Images/Cards) */}
              {msg.mediaType === 'image' && msg.mediaUrl && (
                <div className="rounded-xl overflow-hidden border border-amber-100 shadow-sm bg-white">
                    <img 
                        src={msg.mediaUrl} 
                        alt="AI Search Result" 
                        className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                        onClick={() => window.open(msg.mediaUrl, '_blank')}
                    />
                    <div className="p-2 bg-stone-50 flex justify-between items-center text-xs text-stone-500">
                        <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Image Result</span>
                        <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="hover:text-amber-600 flex items-center gap-1">
                             下载 <LinkIcon className="w-3 h-3" />
                        </a>
                    </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-600" />
             </div>
             <div className="bg-white border border-amber-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span className="text-xs text-stone-500">正在思考... ({settings.model})</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-amber-100 shrink-0">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入问题或 '找一张...图片'..."
            className="w-full pl-4 pr-12 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:hover:bg-amber-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="mt-2 flex gap-2 justify-center">
             <button 
                onClick={() => setShowSettings(true)}
                className="text-[10px] px-2 py-1 bg-amber-50 text-amber-700 rounded-full hover:bg-amber-100 transition-colors flex items-center gap-1"
             >
                <Settings className="w-3 h-3" /> 
                {(settings.apiKey || settings.provider === 'pollinations') ? '已配置 API' : '配置 API'}
            </button>
            <button className="text-[10px] px-2 py-1 bg-amber-50 text-amber-700 rounded-full hover:bg-amber-100 transition-colors flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> 查找图片
            </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
