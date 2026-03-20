import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Send, ArrowLeft, Loader2, User, 
  MessageCircle, Trash2, Check, CheckCheck, 
  Clock, Droplet, Heart, MapPin, BadgeCheck
} from 'lucide-react';
import { messagesAPI, authAPI, usersAPI, API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChatView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConvName, setActiveConvName] = useState('');

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const toId = params.get('to');
    if (toId) {
      setActiveUserId(toId);
    }
    loadConversations();
  }, [location.search]);

  useEffect(() => {
    if (activeUserId) {
      loadMessages(activeUserId);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => loadMessages(activeUserId, false), 5000);
      resolveConversationName(activeUserId);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    setIsLoadingConvs(true);
    try {
      const data = await messagesAPI.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConvs(false);
    }
  };

  const loadMessages = async (userId, showLoading = true) => {
    if (showLoading) setIsLoadingMsgs(true);
    try {
      const data = await messagesAPI.getMessages(userId);
      setMessages(data.messages || []);
      // Mark as read if we're active
      if (data.messages.some(m => !m.is_read && m.sender_id === Number(userId))) {
        await messagesAPI.markRead(userId);
        loadConversations(); // refresh unread counts
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoadingMsgs(false);
    }
  };

  const resolveConversationName = async (userId) => {
    const conv = conversations.find(c => String(c.partner_id) === String(userId));
    if (conv) {
      setActiveConvName(conv.partner_name);
    } else {
      try {
        const data = await usersAPI.getById(userId);
        setActiveConvName(data.user?.name || 'User');
      } catch {
        setActiveConvName('User');
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeUserId || isSending) return;

    setIsSending(true);
    try {
      await messagesAPI.sendMessage(Number(activeUserId), newMessage.trim());
      setNewMessage('');
      loadMessages(activeUserId, false);
      loadConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.partner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar: Conversations */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col bg-white border-r border-slate-200 ${activeUserId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-red-600">
               <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black text-slate-900">Messages</h1>
          </div>
          <button onClick={() => navigate('/')} className="hidden md:flex p-2 text-slate-400 hover:text-red-600 transition-colors">
            <ArrowLeft size={18} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-red-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingConvs ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-red-600" size={24} />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400 text-sm font-medium">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv.partner_id}
                onClick={() => {
                   setActiveUserId(String(conv.partner_id));
                   navigate(`/chat?to=${conv.partner_id}`, { replace: true });
                }}
                className={`w-full p-4 flex items-center gap-4 transition-all hover:bg-slate-50 ${
                  activeUserId === String(conv.partner_id) ? 'bg-red-50 border-r-4 border-red-600' : ''
                }`}
              >
                <div className="relative">
                  {conv.partner_profile_picture ? (
                    <img
                      src={`${API_BASE_URL}${conv.partner_profile_picture}`}
                      className="w-12 h-12 rounded-2xl object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center font-bold">
                      {getInitials(conv.partner_name)}
                    </div>
                  )}
                  {Number(conv.unread_count) > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-bold text-slate-900 truncate">{conv.partner_name}</h3>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{conv.last_message || 'No messages yet'}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-white ${!activeUserId ? 'hidden md:flex' : 'flex'}`}>
        {activeUserId ? (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveUserId(null)} className="md:hidden p-2 -ml-2 text-slate-400">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <User size={20} className="text-slate-400" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 leading-none">{activeConvName}</h2>
                  <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
              {isLoadingMsgs && messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-red-600" size={32} />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <MessageCircle size={48} className="opacity-20" />
                  <p className="font-medium">Start a new conversation</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] md:max-w-[70%] group`}>
                      <div className={`p-3 md:p-4 rounded-2xl shadow-sm text-sm ${
                        msg.sender_id === user?.id 
                          ? 'bg-red-600 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                      <div className={`flex items-center gap-1.5 mt-1 px-1 ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.sender_id === user?.id && (
                          msg.is_read ? <CheckCheck size={12} className="text-blue-500" /> : <Check size={12} className="text-slate-300" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 transition-all"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="bg-red-600 text-white p-3 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 shadow-md shadow-red-100 active:scale-95"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center text-red-600">
              <MessageCircle size={48} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">Your Conversations</h2>
              <p className="text-slate-500 max-w-xs mx-auto mt-2">
                Select a person from the list to start messaging or view previous chats.
              </p>
            </div>
            <button 
              onClick={() => navigate('/find-donors')}
              className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100"
            >
              Start New Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
