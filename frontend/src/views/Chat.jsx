import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Send, Search, MessageCircle, Loader2,
  User, CheckCheck, Clock, ArrowRight, BadgeCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { messagesAPI, usersAPI, API_BASE_URL } from '../services/api';

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

export default function Chat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(searchParams.get('to') || null);
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
    if (!localStorage.getItem('authToken')) {
      navigate('/login');
      return;
    }
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
      pollRef.current = setInterval(() => loadMessages(activeConvId, false), 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [activeConvId]);

  useEffect(() => {
    if (activeConvId && !activeConvName) {
      resolveConversationName(activeConvId);
    }
  }, [activeConvId, activeConvName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    setIsLoadingConvs(true);
    try {
      const data = await messagesAPI.getConversations();
      setConversations(data.conversations || []);

      // If a target user was passed via ?to=id, set their name from conversations
      const toId = searchParams.get('to');
      if (toId) {
        const found = data.conversations?.find(c => String(c.partner_id) === toId);
        if (found?.partner_name) {
          setActiveConvName(found.partner_name);
          setActiveConvPic(found.partner_profile_picture || null);
        } else {
          resolveConversationName(toId);
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
    setActiveConvId(String(conv.partner_id));
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
    if (!newMessage.trim() || !activeConvId) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const data = await messagesAPI.sendMessage(Number(activeConvId), content);
      setMessages(prev => [...prev, data.message]);
      loadConversations(); // refresh conversation list
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
    setActiveConvId(String(u.id));
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

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans">
      {/* Top Bar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 shrink-0">
        <button onClick={() => navigate('/')} className="text-slate-500 hover:text-red-600 transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-slate-900">Messages</h1>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Conversations */}
        <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0" style={{ display: activeConvId ? 'none' : 'flex' }} id="conv-panel">
          <style>{`@media(min-width:768px){#conv-panel{display:flex!important}}`}</style>

          {/* Search New User */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                value={searchUser}
                onChange={(e) => { setSearchUser(e.target.value); searchUsers(e.target.value); }}
                placeholder="Search users to message..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
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
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {isLoadingConvs ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="animate-spin text-slate-400" size={24} />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-14 px-4">
                <MessageCircle className="mx-auto text-slate-300 mb-3" size={40} />
                <p className="font-bold text-slate-500">No conversations yet</p>
                <p className="text-slate-400 text-sm mt-1">Search for a user above to start messaging</p>
              </div>
            ) : (
              conversations.map(conv => (
                <ConversationItem
                  key={conv.partner_id}
                  conv={conv}
                  isActive={String(conv.partner_id) === activeConvId}
                  onClick={() => openConversation(conv)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Messages */}
        {activeConvId ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
              <button
                onClick={() => setActiveConvId(null)}
                className="md:hidden text-slate-500 hover:text-red-600"
              >
                <ArrowLeft size={20} />
              </button>
              <Avatar name={activeConvName} picPath={activeConvPic} size={10} textSize="text-sm" />
              <div>
                <div className="flex items-center gap-1">
                  <p className="font-black text-slate-800">{activeConvName || 'User'}</p>
                  {activeConvVerified && <BadgeCheck size={16} className="text-blue-500 shrink-0" />}
                </div>
                <p className="text-xs text-slate-500">Donor — LifeLink Member</p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {isLoadingMsgs ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="animate-spin text-slate-400" size={30} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="text-slate-300 mb-3" size={48} />
                  <p className="font-bold text-slate-500">Start the conversation</p>
                  <p className="text-slate-400 text-sm mt-1">
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
              <div className="px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold border-t border-red-200">
                {error}
              </div>
            )}

            {/* Message Input */}
            <form onSubmit={sendMessage} className="bg-white border-t border-slate-200 px-4 py-4 flex gap-3">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-5 py-3 bg-slate-100 rounded-2xl text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="px-5 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 disabled:opacity-50 transition-all shrink-0"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex flex-col items-center justify-center text-center p-8">
            <MessageCircle className="text-slate-300 mb-4" size={64} />
            <h3 className="text-xl font-black text-slate-600 mb-2">Select a conversation</h3>
            <p className="text-slate-400">Choose from the left panel or search for a user to message</p>
          </div>
        )}
      </div>
    </div>
  );
}
