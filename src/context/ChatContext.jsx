import React, { createContext, useState, useContext } from 'react'

const ChatContext = createContext()

export const ChatProvider = ({ children }) => {
  const [activeChatName, setActiveChatName] = useState(null)
  return (
    <ChatContext.Provider value={{ activeChatName, setActiveChatName }}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChatState = () => useContext(ChatContext)