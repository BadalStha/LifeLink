import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatContext } from '../context/ChatContext';
import { messagesAPI, usersAPI, API_BASE_URL } from '../services/api';
import {
  X, Maximize2, Minimize2, ArrowLeft, Send, Search, MessageCircle, Loader2,
  BadgeCheck, Droplets
} from 'lucide-react';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getProfilePicUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

function Avatar({ name, picPath, size = 11, textSize = 'text-sm' }) {
  const picUrl = getProfilePicUrl(picPath);
  const sizeClass = `w-${size} h-${size}`;
  if (picUrl) {
    return (
      <img
        src={picUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover shrink-0 border-2 border-white`}
      />
    );
  }
  return (
    <div className={`${sizeClass} bg-red-600 rounded-full flex items-center justify-center text-white font-black ${textSize} shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

function ConversationItem({ conv, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${
        isActive ? 'bg-red-50 border border-red-200' : 'hover:bg-slate-50'
      }`}
    >
      <Avatar name={conv.partner_name} picPath={conv.partner_profile_picture} size={11} textSize="text-sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`font-bold text-sm truncate ${isActive ? 'text-red-700' : 'text-slate-800'}`}>
            {conv.partner_name || 'User'}
          </p>
          <span className="text-xs text-slate-400 shrink-0 ml-2">{formatTime(conv.last_message_at)}</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-slate-500 truncate">{conv.last_message || 'No messages yet'}</p>
          {Number(conv.unread_count) > 0 && (
            <span className="ml-2 min-w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shrink-0">
              {conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ msg, myId }) {
  const isMine = msg.sender_id === myId;
  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
      {!isMine && (
        <Avatar name={msg.sender_name} picPath={msg.sender_profile_picture} size={8} textSize="text-xs" />
      )}
      <div
        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isMine
            ? 'bg-red-600 text-white rounded-br-sm'
            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
        }`}
      >
        <p>{msg.content}</p>
        <p className={`text-xs mt-1 ${isMine ? 'text-red-200' : 'text-slate-400'} text-right`}>
          {formatTime(msg.created_at)}
        </p>
      </div>
    </div>
  );
}

export default function GlobalChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isOpen, activeUserId, openChat, closeChat, setActiveUserId } = useChatContext();

  const [conversations, setConversations] = useState([]);
  const [activeConvName, setActiveConvName] = useState('');
  const [activeConvPic, setActiveConvPic] = useState(null);
  const [activeConvVerified, setActiveConvVerified] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const myId = user?.id;

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeUserId) {
      loadMessages(activeUserId);
      pollRef.current = setInterval(() => loadMessages(activeUserId, false), 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [activeUserId]);

  useEffect(() => {
    if (activeUserId && !activeConvName) {
      resolveConversationName(activeUserId);
    }
  }, [activeUserId, activeConvName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Don't render on the full chat page itself
  if (location.pathname === '/chat') return null;

  // Don't render bubble/window unless user is authenticated
  if (!localStorage.getItem('authToken')) return null;

  // Render floating bubble if chat is closed
  if (!isOpen) {
    return (
      <button
        onClick={() => openChat(null)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl hover:bg-red-700 hover:scale-110 transition-all z-[90] flex items-center justify-center group"
        title="Open Messages"
      >
        <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
        {conversations.some(c => Number(c.unread_count) > 0) && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-black">
             {conversations.reduce((sum, c) => sum + Number(c.unread_count), 0)}
          </span>
        )}
      </button>
    );
  }

  const loadConversations = async () => {
    setIsLoadingConvs(true);
    try {
      const data = await messagesAPI.getConversations();
      setConversations(data.conversations || []);

      if (activeUserId) {
        const found = data.conversations?.find(c => String(c.partner_id) === String(activeUserId));
        if (found?.partner_name) {
          setActiveConvName(found.partner_name);
          setActiveConvPic(found.partner_profile_picture || null);
        } else {
          resolveConversationName(activeUserId);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConvs(false);
    }
  };

  const resolveConversationName = async (userId) => {
    if (!userId) return;
    try {
      const data = await usersAPI.getById(userId);
      if (data?.user?.name) {
        setActiveConvName(data.user.name);
        setActiveConvPic(data.user.profile_picture || null);
        setActiveConvVerified(data.user.verification_status === 'approved');
      }
    } catch (err) {
      console.error('Failed to resolve conversation name:', err);
    }
  };

  const loadMessages = async (userId, showLoader = true) => {
    if (showLoader) setIsLoadingMsgs(true);
    try {
      const data = await messagesAPI.getMessages(userId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (showLoader) setIsLoadingMsgs(false);
    }
  };

  const openConversation = (conv) => {
    setActiveUserId(String(conv.partner_id));
    setActiveConvName(conv.partner_name || '');
    setActiveConvPic(conv.partner_profile_picture || null);
    setActiveConvVerified(false);
    setMessages([]);
    setError('');
    usersAPI.getById(conv.partner_id).then(data => {
      setActiveConvVerified(data?.user?.verification_status === 'approved');
    }).catch(() => {});
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeUserId) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const data = await messagesAPI.sendMessage(Number(activeUserId), content);
      setMessages(prev => [...prev, data.message]);
      loadConversations();
    } catch (err) {
      setError(err.message || 'Message failed to send');
      setNewMessage(content);
    } finally {
      setIsSending(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) { setSearchResults([]); return; }
    try {
      const data = await usersAPI.search({ search: query, limit: 5 });
      setSearchResults(data.users || []);
    } catch {
      setSearchResults([]);
    }
  };

  const startConversation = (u) => {
    setActiveUserId(String(u.id));
    setActiveConvName(u.name || 'User');
    setActiveConvPic(u.profile_picture || null);
    setActiveConvVerified(u.verification_status === 'approved');
    setSearchUser('');
    setSearchResults([]);
    setMessages([]);

    if (!conversations.find(c => String(c.partner_id) === String(u.id))) {
      setConversations(prev => [{
        partner_id: u.id,
        partner_name: u.name,
        partner_profile_picture: u.profile_picture || null,
        last_message: '',
        last_message_at: new Date().toISOString(),
        unread_count: 0,
      }, ...prev]);
    }
  };

  const handleBackToList = () => {
    setActiveUserId(null);
  };

  const popupClasses = 'fixed bottom-4 right-4 w-[380px] h-[600px] max-h-[calc(100vh-120px)] z-[40] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden border border-slate-200 transition-all duration-300';

  const handleMaximize = () => {
    const targetUrl = activeUserId ? `/chat?to=${activeUserId}` : '/chat';
    navigate(targetUrl);
    closeChat();
  };

  return (
    <div className={popupClasses}>
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex flex-row items-center gap-2">
          {activeUserId && (
             <button onClick={handleBackToList} className="mr-1 hover:text-red-400 transition-colors">
               <ArrowLeft size={18} />
             </button>
          )}
          <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
            <Droplets size={12} className="text-white" />
          </div>
          <span className="font-bold text-sm">LifeLink Messages</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleMaximize} className="hover:text-slate-300 transition-colors" title="Maximize to full screen">
            <Maximize2 size={16} />
          </button>
          <button onClick={closeChat} className="hover:text-red-400 transition-colors ml-1" title="Close">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden h-full">
        <div 
          className={`flex flex-col bg-white border-r border-slate-200 shrink-0 ${
            activeUserId ? 'hidden' : 'w-full'
          }`}
        >
          {/* Search New User */}

          {/* Search New User */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                value={searchUser}
                onChange={(e) => { setSearchUser(e.target.value); searchUsers(e.target.value); }}
                placeholder="Search users..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden absolute z-10 w-[calc(100%-2rem)] left-4">
                {searchResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => startConversation(u)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-all text-left"
                  >
                    <Avatar name={u.name} picPath={u.profile_picture} size={8} textSize="text-xs" />
                    <div>
                      <p className="font-bold text-sm text-slate-800">{u.name}</p>
                      {u.blood_type && <p className="text-xs text-red-600">{u.blood_type}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingConvs ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="animate-spin text-slate-400" size={24} />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-10 px-4">
                <MessageCircle className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="font-bold text-slate-500 text-sm">No conversations</p>
                <p className="text-slate-400 text-xs mt-1">Search above to start messaging</p>
              </div>
            ) : (
              conversations.map(conv => (
                <ConversationItem
                  key={conv.partner_id}
                  conv={conv}
                  isActive={String(conv.partner_id) === activeUserId}
                  onClick={() => openConversation(conv)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Messages */}
        {activeUserId && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 flex">
            {/* Extended Chat Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <Avatar name={activeConvName} picPath={activeConvPic} size={9} textSize="text-xs" />
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-bold text-sm text-slate-800">{activeConvName || 'User'}</p>
                    {activeConvVerified && <BadgeCheck size={14} className="text-blue-500 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Donor Member</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
              {isLoadingMsgs ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="animate-spin text-slate-400" size={24} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="text-slate-300 mb-2" size={40} />
                  <p className="font-bold text-slate-500 text-sm">Start the conversation</p>
                  <p className="text-slate-400 text-xs mt-1 max-w-[200px]">
                    Introduce yourself and explain your medical need clearly.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} myId={myId} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error */}
            {error && (
              <div className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold border-t border-red-200">
                {error}
              </div>
            )}

            {/* Message Input */}
            <form onSubmit={sendMessage} className="bg-white border-t border-slate-200 px-3 py-3 flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-slate-100 rounded-xl text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all shrink-0 flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
