import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ChatContext = createContext();

export function useChatContext() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeUserId, setActiveUserId] = useState(null);
  
  const location = useLocation();

  // Close chat when navigating to another major page, optional but good UX
  useEffect(() => {
    // If we want chat to persist across navigation, we don't close it.
    // However, if we want it to close on page change, we could uncomment:
    // setIsOpen(false);
  }, [location.pathname]);

  const openChat = (userId = null) => {
    setActiveUserId(userId);
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setActiveUserId(null);
    setIsMaximized(false);
  };

  const toggleMaximize = () => {
    setIsMaximized(prev => !prev);
  };

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        isMaximized,
        activeUserId,
        openChat,
        closeChat,
        toggleMaximize,
        setActiveUserId
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
