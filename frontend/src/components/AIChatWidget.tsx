import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { X, Send, Loader2, Sparkles, Trash2, Plus, CheckCircle, XCircle, AlertCircle, Wrench, Search, Clipboard, Lightbulb, TrendingUp, Zap, BarChart3, Car, Settings as SettingsIcon, Award, Users, DollarSign } from 'lucide-react';
import { chatApi } from '../lib/api';
import toast from 'react-hot-toast';
import { t } from '@/lib/transliteration';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatWidget() {
  // Vaqtincha yashirish uchun
  return null;
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if on landing page
  const isLandingPage = window.location.pathname === '/';

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const formatMessageContent = (content: string) => {
    // Emoji to Icon mapping
    const emojiMap: { [key: string]: JSX.Element } = {
      '🚗': <Car className="w-4 h-4 inline text-blue-600 mr-1" />,
      '📋': <Clipboard className="w-4 h-4 inline text-purple-600 mr-1" />,
      '✅': <CheckCircle className="w-4 h-4 inline text-green-600 mr-1" />,
      '❓': <AlertCircle className="w-4 h-4 inline text-orange-600 mr-1" />,
      '💡': <Lightbulb className="w-4 h-4 inline text-yellow-600 mr-1" />,
      '🔧': <Wrench className="w-4 h-4 inline text-blue-600 mr-1" />,
      '⚙️': <SettingsIcon className="w-4 h-4 inline text-gray-600 mr-1" />,
      '🎉': <Sparkles className="w-4 h-4 inline text-pink-600 mr-1" />,
      '❌': <XCircle className="w-4 h-4 inline text-red-600 mr-1" />,
      '💰': <DollarSign className="w-4 h-4 inline text-green-600 mr-1" />,
      '👥': <Users className="w-4 h-4 inline text-blue-600 mr-1" />,
      '🏆': <Award className="w-4 h-4 inline text-yellow-600 mr-1" />,
    };

    // Icon tag mapping for chat messages
    const iconMap: { [key: string]: JSX.Element } = {
      '[CHECK]': <CheckCircle className="w-3 h-3 inline text-green-600 mr-1" />,
      '[X]': <XCircle className="w-3 h-3 inline text-red-600 mr-1" />,
      '[ALERT]': <AlertCircle className="w-3 h-3 inline text-orange-600 mr-1" />,
      '[WARNING]': <AlertCircle className="w-3 h-3 inline text-orange-600 mr-1" />,
      '[WRENCH]': <Wrench className="w-3 h-3 inline text-blue-600 mr-1" />,
      '[SEARCH]': <Search className="w-3 h-3 inline text-indigo-600 mr-1" />,
      '[CLIPBOARD]': <Clipboard className="w-3 h-3 inline text-purple-600 mr-1" />,
      '[LIGHTBULB]': <Lightbulb className="w-3 h-3 inline text-yellow-600 mr-1" />,
      '[TRENDING]': <TrendingUp className="w-3 h-3 inline text-green-600 mr-1" />,
      '[ZAPLIGHTNING]': <Zap className="w-3 h-3 inline text-yellow-600 mr-1" />,
      '[CHART]': <BarChart3 className="w-3 h-3 inline text-blue-600 mr-1" />,
    };

    // Replace emojis with icons
    let processedContent = content;
    Object.keys(emojiMap).forEach(emoji => {
      if (processedContent.includes(emoji)) {
        const parts = processedContent.split(emoji);
        processedContent = parts.join(`__EMOJI_${emoji}__`);
      }
    });

    // Split content into lines and process each
    const lines = processedContent.split('\n');
    return lines.map((line, idx) => {
      // Check if line contains any icon tag
      let hasIcon = false;
      let iconElement = null;
      let cleanLine = line;

      Object.keys(iconMap).forEach(tag => {
        if (line.includes(tag)) {
          hasIcon = true;
          iconElement = iconMap[tag];
          cleanLine = line.replace(tag, '').trim();
        }
      });

      if (hasIcon && iconElement) {
        return (
          <span key={idx} className="flex items-start gap-1 mb-1">
            {iconElement}
            <span>{cleanLine}</span>
          </span>
        );
      }

      // Replace emoji placeholders with actual icons
      const parts = line.split(/(__EMOJI_.+?__)/);
      const elements = parts.map((part, partIdx) => {
        const emojiMatch = part.match(/__EMOJI_(.+)__/);
        if (emojiMatch) {
          const emoji = emojiMatch[1];
          return <span key={partIdx}>{emojiMap[emoji]}</span>;
        }
        return <span key={partIdx}>{part}</span>;
      });

      return <span key={idx}>{elements}{idx < lines.length - 1 && <br />}</span>;
    });
  };

  // Generate or get session ID
  useEffect(() => {
    let sid = localStorage.getItem('chatSessionId');
    if (!sid) {
      sid = createNewSession();
    }
    setSessionId(sid);
    
    // Show welcome message
    setMessages([{
      role: 'assistant',
      content: t('Assalomu alaykum! Men Biznes AI – avto servis yordamchisiman. Sizga qanday yordam bera olaman?', language),
      timestamp: new Date()
    }]);
  }, [language]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Attention animation every 5-10 seconds
  useEffect(() => {
    if (isOpen) return; // Faqat yopiq bo'lganda animatsiya

    const getRandomInterval = () => Math.floor(Math.random() * 5000) + 5000; // 5-10 sekund

    const triggerAnimation = () => {
      setShouldAnimate(true);
      setTimeout(() => setShouldAnimate(false), 2000); // 2 sekund animatsiya
    };

    // Birinchi animatsiya
    const firstTimeout = setTimeout(triggerAnimation, getRandomInterval());

    // Keyingi animatsiyalar
    const interval = setInterval(() => {
      triggerAnimation();
    }, getRandomInterval());

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, [isOpen]);

  const createNewSession = (): string => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('chatSessionId', newSessionId);
    return newSessionId;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    const messageContent = input.trim();
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatApi.sendMessage({
        message: messageContent,
        sessionId,
        language
      });

      // Create empty AI message first
      const aiMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);

      // Typewriter effect - show text word by word
      const words = response.message.split(' ');
      let currentText = '';
      
      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: currentText
          };
          return newMessages;
        });
        
        // Wait 50ms between words (adjust for speed)
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
    } catch (error: any) {
      console.error('Send message error:', error);
      
      const errorMessage = error.response?.data?.message || t('Xabar yuborishda xatolik', language);
      toast.error(errorMessage);
      
      // Remove user message on error
      setMessages(prev => prev.slice(0, -1));
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    try {
      await chatApi.clearHistory(sessionId);
      setMessages([{
        role: 'assistant',
        content: t('Assalomu alaykum! Men Biznes AI – avto servis yordamchisiman. Sizga qanday yordam bera olaman?', language),
        timestamp: new Date()
      }]);
      toast.success(t('Chat tarixi tozalandi', language));
    } catch (error) {
      toast.error(t('Tozalashda xatolik', language));
    }
  };

  const startNewChat = () => {
    const newSid = createNewSession();
    setSessionId(newSid);
    setMessages([{
      role: 'assistant',
      content: t('Assalomu alaykum! Men Biznes AI – avto servis yordamchisiman. Sizga qanday yordam bera olaman?', language),
      timestamp: new Date()
    }]);
  };

  // Quick action buttons based on user role
  const getQuickActions = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.role === 'master') {
      return [
        t('Shogirt ishini tekshirish', language),
        t('Vazifa berish', language),
        t('Hisobotlar', language),
        t('Qaysi mashinalar bor?', language),
        t('Qarzlar holati', language)
      ];
    } else if (user.role === 'apprentice') {
      return [
        t('Bugungi vazifalarim', language),
        t('Qanday topshiraman?', language),
        t('Ehtiyot qismlar', language),
        t("Xizmatlar ro'yxati", language)
      ];
    } else {
      return [
        t('Manzil qayerda?', language),
        t('Telefon raqam', language),
        t('Xizmatlar va narxlar', language),
        t('Ish vaqti', language),
        t('Qanday xizmatlar bor?', language)
      ];
    }
  };

  const quickActions = getQuickActions();

  if (!isOpen) {
    return (
      <button
        data-ai-chat-button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-4 sm:right-6 lg:bottom-6 lg:right-6 transition-all duration-300 hover:scale-105 z-30 group ${
          shouldAnimate ? 'animate-bounce-attention' : ''
        }`}
      >
        {isLandingPage ? (
          <div className="relative">
            <img 
              src="/logo.jpg" 
              alt="Biznes AI" 
              className="w-16 h-16 object-cover rounded-full shadow-2xl hover:shadow-3xl transition-shadow"
            />
            
            <span className={`absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg ${
              shouldAnimate ? 'animate-ping' : 'animate-pulse'
            }`}></span>
            {shouldAnimate && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></span>
            )}
            
            <div className={`absolute bottom-full right-0 mb-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-xl transition-opacity whitespace-nowrap pointer-events-none shadow-xl ${
              shouldAnimate ? 'opacity-100 animate-bounce-in' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>{t('AI bilan suhbatlashing', language)}</span>
              </div>
              <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <img 
              src="/logo.jpg" 
              alt="Biznes AI" 
              className={`w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-full shadow-xl ${shouldAnimate ? 'animate-wiggle' : ''}`} 
            />
            <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white ${
              shouldAnimate ? 'animate-ping' : 'animate-pulse'
            }`}></span>
            {shouldAnimate && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full animate-ping"></span>
            )}
            
            <div className={`absolute bottom-full right-0 mb-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-xl transition-opacity whitespace-nowrap pointer-events-none shadow-xl ${
              shouldAnimate ? 'opacity-100 animate-bounce-in' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>{t('AI bilan suhbatlashing', language)}</span>
              </div>
              <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-2 sm:right-6 lg:bottom-6 lg:right-6 w-[calc(100vw-16px)] sm:w-96 h-[calc(100vh-80px)] sm:h-[600px] lg:h-[600px] bg-white rounded-xl sm:rounded-2xl shadow-xl flex flex-col z-30 border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 sm:p-4 rounded-t-xl sm:rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <img src="/logo.jpg" alt="Biznes AI" className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-full shadow-lg" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white"></span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm sm:text-base truncate">Biznes AI</h3>
            <p className="text-xs text-purple-100 truncate">{t('Online • Avto Servis Yordamchisi', language)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={startNewChat}
            className="p-2 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
            title={t('Yangi chat', language)}
          >
            <Plus className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
          </button>
          <button
            onClick={handleClear}
            className="p-2 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
            title={t('Tarixni tozalash', language)}
          >
            <Trash2 className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-200'
              }`}
            >
              <div className="text-base sm:text-sm whitespace-pre-wrap leading-relaxed">
                {msg.role === 'assistant' ? formatMessageContent(msg.content) : msg.content}
              </div>
              <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-purple-100' : 'text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-white">
          <p className="text-xs text-gray-500 mb-2">{t('Tez savollar:', language)}</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => setInput(action)}
                className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 sm:p-4 border-t border-gray-200 bg-white rounded-b-2xl">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => {
              const value = e.target.value;
              const prevValue = input;
              
              // Birinchi harfni katta qilish
              if (value.length === 1 || (value.trim().length === 1 && prevValue.trim().length === 0)) {
                setInput(value.charAt(0).toUpperCase() + value.slice(1));
              }
              // Nuqta, savol yoki undov belgisidan keyin katta harf
              else if (value.length > prevValue.length) {
                const lastChars = prevValue.slice(-2);
                const newChar = value.slice(-1);
                
                // Agar oxirgi belgi nuqta/savol/undov + bo'shliq bo'lsa va yangi harf kiritilsa
                if ((lastChars.match(/[.!?]\s$/) || prevValue.match(/[.!?]$/)) && newChar.match(/[a-zA-Z]/)) {
                  setInput(value.slice(0, -1) + newChar.toUpperCase());
                } else {
                  setInput(value);
                }
              } else {
                setInput(value);
              }
            }}
            onKeyDown={handleKeyPress}
            placeholder={t('Xabar yozing...', language)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base sm:text-sm resize-none overflow-hidden"
            disabled={loading}
            autoCapitalize="sentences"
            rows={1}
            style={{
              minHeight: '48px',
              maxHeight: '140px',
              height: 'auto'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 140) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-6 h-6 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
