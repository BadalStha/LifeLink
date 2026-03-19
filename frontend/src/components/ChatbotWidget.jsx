import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Globe } from 'lucide-react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hi there! I am the LifeLink Assistant. How can I help you regarding blood or organ donation today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = () => setIsOpen(!isOpen);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ne' : 'en';
    setLanguage(newLang);
    // Add a system welcome message when language changes
    const welcomeMsg = newLang === 'en' 
      ? 'Language changed to English. How can I help you?' 
      : 'भाषा नेपालीमा परिवर्तन भयो। म तपाईंलाई कसरी मद्दत गर्न सक्छु?';
    setMessages((prev) => [...prev, { role: 'model', text: welcomeMsg }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage, 
          history: messages,
          language: language
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages((prev) => [...prev, { role: 'model', text: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: 'model', text: data.error || 'Oops, something went wrong. Please try again later.' }]);
      }
    } catch (error) {
       setMessages((prev) => [...prev, { role: 'model', text: 'Network error. Please make sure you are connected.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle Button */}
      {!isOpen && (
        <button 
          onClick={toggleChat}
          className="bg-red-600 hover:bg-red-700 text-white text-xl rounded-full p-4 shadow-lg transition-transform hover:scale-105 flex items-center justify-center cursor-pointer"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-[350px] max-w-[calc(100vw-2rem)] h-[500px] flex flex-col border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 p-4 text-white flex justify-between items-center rounded-t-2xl">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <h3 className="font-semibold text-lg">LifeLink AI</h3>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={toggleLanguage} 
                className="flex items-center space-x-1 text-xs bg-red-700 hover:bg-red-800 px-2 py-1 rounded-full transition-colors cursor-pointer border border-red-500"
                title="Switch Language"
              >
                <Globe className="w-3 h-3" />
                <span>{language === 'en' ? 'EN' : 'NE'}</span>
              </button>
              <button onClick={toggleChat} className="text-white hover:text-red-200 transition-colors cursor-pointer border-l border-red-500 pl-3">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-red-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'
                  }`}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-500 border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-200">
            <div className="flex items-center space-x-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about donation..."
                className="flex-1 border border-gray-300 rounded-full py-2 px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-800 bg-white"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed absolute right-1 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
