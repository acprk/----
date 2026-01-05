import React, { useState, useEffect, useRef } from 'react';
import { Send, Settings, Bot, User, Trash2, Key, Cpu, Zap, MessageSquare, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const AIChat = () => {
  // State
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are a helpful AI assistant. Answer in Markdown format.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [model, setModel] = useState(() => localStorage.getItem('openai_model') || 'gpt-3.5-turbo');
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem('openai_base_url') || 'https://api.openai.com/v1');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant. Answer in Markdown format.');

  const messagesEndRef = useRef(null);

  // Persist Settings
  useEffect(() => {
    localStorage.setItem('openai_api_key', apiKey);
    localStorage.setItem('openai_model', model);
    localStorage.setItem('openai_base_url', baseUrl);
  }, [apiKey, model, baseUrl]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!apiKey) {
      alert('请先在设置中配置 API Key');
      setShowSettings(true);
      return;
    }

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          temperature: 0.7,
          stream: false // Simple fetch for now, streaming requires more complex handling
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'API Request Failed');
      }

      const assistantMessage = data.choices[0].message;
      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: `**Error:** ${error.message}\n\nPlease check your API Key and Network Settings.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm('确定要清空聊天记录吗？')) {
      setMessages([{ role: 'system', content: systemPrompt }]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4 animate-fade-in">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden relative">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isLoading ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-indigo-100 text-indigo-600'}`}>
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-stone-800">AI Assistant</h2>
              <p className="text-xs text-stone-500 flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                {model}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
             <button 
              onClick={clearHistory}
              className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear History"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-stone-200 text-stone-800' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-stone-50/30">
          {messages.filter(m => m.role !== 'system').length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 opacity-50">
              <MessageSquare className="w-16 h-16 mb-4" />
              <p>Start a conversation...</p>
            </div>
          )}
          
          {messages.filter(m => m.role !== 'system').map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-stone-800 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-stone-800 text-white rounded-tr-none' 
                  : 'bg-white border border-stone-100 text-stone-800 rounded-tl-none'
              }`}>
                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-stone'}`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                        code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline ? (
                            <pre className={`${msg.role === 'user' ? 'bg-stone-700' : 'bg-stone-900'} text-stone-50 p-3 rounded-lg overflow-x-auto`}>
                                <code className={className} {...props}>
                                {children}
                                </code>
                            </pre>
                            ) : (
                            <code className={`${msg.role === 'user' ? 'bg-stone-700' : 'bg-stone-100 text-stone-800'} px-1 py-0.5 rounded`} {...props}>
                                {children}
                            </code>
                            )
                        }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
               <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
               </div>
               <div className="bg-white border border-stone-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-stone-100">
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="w-full pl-4 pr-12 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-2">
              <span className="text-[10px] text-stone-400">
                  AI generates content based on patterns and may produce inaccurate information.
              </span>
          </div>
        </div>
      </div>

      {/* Settings Sidebar (Collapsible) */}
      {showSettings && (
        <div className="w-80 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm animate-fade-in-right flex flex-col h-full">
            <h3 className="font-bold text-stone-800 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuration
            </h3>
            
            <div className="space-y-6 flex-1 overflow-y-auto">
                <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-2">API Provider URL</label>
                    <div className="relative">
                        <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input 
                            type="text" 
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-indigo-500"
                            placeholder="https://api.openai.com/v1"
                        />
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">Compatible with OpenAI, Azure, DeepSeek, etc.</p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-2">API Key</label>
                    <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-indigo-500"
                            placeholder="sk-..."
                        />
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Stored locally in your browser.
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Model Name</label>
                    <div className="relative">
                        <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input 
                            type="text" 
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-indigo-500"
                            placeholder="gpt-3.5-turbo"
                        />
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                        {['gpt-3.5-turbo', 'gpt-4', 'claude-3-opus', 'deepseek-chat'].map(m => (
                            <button 
                                key={m}
                                onClick={() => setModel(m)}
                                className={`text-[10px] px-2 py-1 rounded border transition-colors ${model === m ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-indigo-300'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-2">System Prompt</label>
                    <textarea 
                        rows="4"
                        value={systemPrompt}
                        onChange={(e) => {
                            setSystemPrompt(e.target.value);
                            // Update system message if it's the only one
                            if (messages.length === 1 && messages[0].role === 'system') {
                                setMessages([{ role: 'system', content: e.target.value }]);
                            }
                        }}
                        className="w-full p-3 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
                    ></textarea>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// Helper Icon
const GlobeIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
);

export default AIChat;
