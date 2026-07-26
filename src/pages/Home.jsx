import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/chat/SideBar'
import ChatWindow from '../components/chat/ChatWindow'
import { useChatState } from '../components/context/ChatContext'

const CHAT_SELECT = `
  id,
  created_at,
  user1:user1_id (id, username, email),
  user2:user2_id (id, username, email)
`

const getDisplayName = (user) => user?.username || user?.email?.split('@')[0] || 'Пользователь'

const formatChat = (chat, currentUserId) => {
  const isUser1Me = chat.user1?.id === currentUserId
  const companion = isUser1Me ? chat.user2 : chat.user1

  return {
    id: chat.id,
    createdAt: chat.created_at,
    companionId: companion?.id,
    companionName: getDisplayName(companion),
    companionEmail: companion?.email || '',
    lastMessage: chat.lastMessage || null,
    unreadCount: chat.unreadCount || 0,
  }
}

const appendUniqueMessage = (messages, message) => {
  if (!message?.id || messages.some((item) => item.id === message.id)) return messages
  return [...messages, message].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

const sanitizeFileName = (fileName) => {
  const ext = fileName.split('.').pop()
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'))
  const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_')
  return `${cleanName}_${Date.now()}.${ext}`
}

const Home = () => {
  const [currentUser, setCurrentUser] = useState(null)
  const [activeChat, setActiveChat] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState([])
  const [globalUsers, setGlobalUsers] = useState([])
  const [activeCompanionSettings, setActiveCompanionSettings] = useState(null)

  const [chatsLoading, setChatsLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [startingChatId, setStartingChatId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  const searchTerm = searchQuery.trim()

  const { activeChatName, setActiveChatName } = useChatState()
  
  const isInsideChat = !!activeChat

  useEffect(() => {
    if (!activeChatName && activeChat !== null) {
      setActiveChat(null)
    }
  }, [activeChatName, activeChat])

  useEffect(() => {
    if (!errorMessage) return
    const timer = setTimeout(() => setErrorMessage(''), 5000)
    return () => clearTimeout(timer)
  }, [errorMessage])

  useEffect(() => {
    let mounted = true
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (!mounted) return
      if (error) {
        setErrorMessage('Не удалось получить данные сессии.')
        setChatsLoading(false)
        return
      }
      setCurrentUser(user)
    }
    getUser()
    return () => { mounted = false }
  }, [])

  // Загрузка всех чатов вместе с информацией о последнем сообщении и непрочитанных
  const fetchChats = useCallback(async () => {
    if (!currentUser) return

    setChatsLoading(true)
    const { data: chatsData, error } = await supabase
      .from('chats')
      .select(CHAT_SELECT)
      .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      setChatsLoading(false)
      setErrorMessage(`Ошибка загрузки чатов: ${error.message}`)
      return
    }

    // Для каждого чата запрашиваем последнее сообщение и количество непрочитанных
    const chatsWithDetails = await Promise.all(
      (chatsData || []).map(async (chat) => {
        // Последнее сообщение
        const { data: lastMsgData } = await supabase
          .from('messages')
          .select('text, created_at, file_url, sender_id')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Счётчик непрочитанных сообщений (где sender_id !== currentUser.id и is_read == false)
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .neq('sender_id', currentUser.id)
          .eq('is_read', false)

        return {
          ...chat,
          lastMessage: lastMsgData || null,
          unreadCount: unreadCount || 0,
        }
      })
    )

    setChatsLoading(false)

    const formattedChats = chatsWithDetails
      .map((chat) => formatChat(chat, currentUser.id))
      .filter((chat) => chat.companionId)

    setChats(formattedChats)
  }, [currentUser])

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  // Глобальная подписка на новые сообщения для обновления сайдбара в реальном времени
  useEffect(() => {
    if (!currentUser) return

    const globalChannel = supabase
      .channel('global-messages-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new

          setChats((prevChats) =>
            prevChats.map((chat) => {
              if (chat.id === newMsg.chat_id) {
                const isCurrentActive = chat.id === activeChat
                const isFromMe = newMsg.sender_id === currentUser.id

                return {
                  ...chat,
                  lastMessage: {
                    text: newMsg.text,
                    created_at: newMsg.created_at,
                    file_url: newMsg.file_url,
                    sender_id: newMsg.sender_id,
                  },
                  // Если сообщение не от нас и чат сейчас не открыт — увеличиваем счётчик
                  unreadCount:
                    !isFromMe && !isCurrentActive
                      ? chat.unreadCount + 1
                      : chat.unreadCount,
                }
              }
              return chat
            })
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(globalChannel)
    }
  }, [currentUser, activeChat])

  const activeChatData = useMemo(
    () => chats.find((chat) => chat.id === activeChat),
    [activeChat, chats]
  )

  // Пометить сообщения чата как прочитанные
  const markMessagesAsRead = useCallback(async (chatId) => {
    if (!currentUser || !chatId) return

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('chat_id', chatId)
      .neq('sender_id', currentUser.id)
      .eq('is_read', false)

    // Обнуляем счётчик непрочитанных в state
    setChats((prevChats) =>
      prevChats.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    )
  }, [currentUser])

  const handleSetActiveChat = (chatId) => {
    setActiveChat(chatId)
    if (!chatId) {
      setActiveChatName(null)
      return
    }
    const selectedChat = chats.find((c) => c.id === chatId)
    if (selectedChat) {
      setActiveChatName(selectedChat.companionName)
    }
    markMessagesAsRead(chatId)
  }

  useEffect(() => {
    if (!activeChat) {
      setMessages([])
      setActiveCompanionSettings(null)
      return
    }

    let mounted = true
    setMessagesLoading(true)

    const fetchMessagesAndSettings = async () => {
      try {
        const fetchMessages = supabase
          .from('messages')
          .select('*')
          .eq('chat_id', activeChat)
          .order('created_at', { ascending: true })

        const fetchSettings = activeChatData?.companionId
          ? supabase
              .from('user_settings')
              .select('status_text, chat_wallpaper')
              .eq('user_id', activeChatData.companionId)
          : Promise.resolve({ data: [], error: null })

        const [messagesRes, settingsRes] = await Promise.all([
          fetchMessages,
          fetchSettings,
        ])

        if (!mounted) return

        setMessagesLoading(false)

        if (messagesRes.error) {
          setErrorMessage(`Ошибка загрузки сообщений: ${messagesRes.error.message}`)
          return
        }

        setMessages(messagesRes.data || [])
        setActiveCompanionSettings(settingsRes.data?.[0] || null)

        // Помечаем прочитанными при открытии
        markMessagesAsRead(activeChat)
      } catch (err) {
        if (!mounted) return
        setMessagesLoading(false)
        setErrorMessage(`Ошибка получения данных: ${err.message}`)
      }
    }

    fetchMessagesAndSettings()

    const channel = supabase
      .channel(`chat-${activeChat}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${activeChat}`, 
      }, (payload) => {
        if (mounted) {
          setMessages((prev) => appendUniqueMessage(prev, payload.new))
          markMessagesAsRead(activeChat)
        }
      })
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [activeChat, activeChatData?.companionId, markMessagesAsRead])

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  useEffect(() => {
    if (!searchTerm || !currentUser) {
      setGlobalUsers([])
      setSearchLoading(false)
      return
    }

    let cancelled = false
    setSearchLoading(true)

    const searchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email')
        .ilike('username', `%${searchTerm}%`)
        .neq('id', currentUser.id)
        .limit(12)

      if (cancelled) return
      setSearchLoading(false)

      if (error) {
        setErrorMessage(`Ошибка поиска: ${error.message}`)
        return
      }
      setGlobalUsers(data || [])
    }

    const delayDebounce = setTimeout(searchUsers, 300)
    return () => {
      cancelled = true
      clearTimeout(delayDebounce)
    }
  }, [currentUser, searchTerm])

  const handleSendMessage = async (cleanText, file = null) => {
    if (!activeChat || !currentUser || sendingMessage) return

    setSendingMessage(true)
    setErrorMessage('')

    let file_url = null
    let file_name = null
    let file_type = null

    try {
      if (file) {
        file_name = file.name
        file_type = file.type

        const sanitizedName = sanitizeFileName(file.name)
        const filePath = `${currentUser.id}/${sanitizedName}`

        const { error: uploadError } = await supabase.storage
          .from('chat-assets')
          .upload(filePath, file, { cacheControl: '3600', upsert: false })

        if (uploadError) {
          throw new Error(`Ошибка загрузки файла: ${uploadError.message}`)
        }

        const { data: publicUrlData } = supabase.storage
          .from('chat-assets')
          .getPublicUrl(filePath)

        file_url = publicUrlData.publicUrl
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([{ 
          chat_id: activeChat, 
          sender_id: currentUser.id, 
          text: cleanText,
          file_url,
          file_name,
          file_type,
          is_read: false
        }])
        .select('*')
        .maybeSingle()

      if (error) throw error

      if (data) {
        setMessages((prev) => appendUniqueMessage(prev, data))
      }
    } catch (err) {
      setErrorMessage(err.message || 'Произошла ошибка при отправке')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleStartChat = async (companion) => {
    if (!currentUser || startingChatId) return

    const existingChat = chats.find((chat) => chat.companionId === companion.id)
    if (existingChat) {
      handleSetActiveChat(existingChat.id)
      setSearchQuery('')
      return
    }

    setStartingChatId(companion.id)
    setErrorMessage('')

    const { data: newChat, error } = await supabase
      .from('chats')
      .insert([{ user1_id: currentUser.id, user2_id: companion.id }])
      .select(CHAT_SELECT)
      .maybeSingle()

    setStartingChatId(null)

    if (error) {
      setErrorMessage(`Не получилось создать чат: ${error.message}`)
      return
    }

    if (newChat) {
      const formatted = formatChat(newChat, currentUser.id)
      setChats((prev) => [formatted, ...prev.filter((chat) => chat.id !== formatted.id)])
      handleSetActiveChat(newChat.id)
      setSearchQuery('')
    }
  }

  return (
    <div className="relative flex flex-1 overflow-hidden w-full h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-[#E11D48]/30 selection:text-[#E11D48]">
      {errorMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 backdrop-blur-xl text-red-400 text-xs font-medium rounded-2xl shadow-2xl shadow-red-500/10 animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>{errorMessage}</span>
          <button 
            onClick={() => setErrorMessage('')}
            className="ml-2 text-red-400/60 hover:text-red-400 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      <aside 
        className={`
          ${isInsideChat ? 'hidden sm:flex' : 'flex'} 
          w-full sm:w-80 md:w-96 
          border-r border-zinc-800/60 
          h-full flex-col flex-shrink-0 
          bg-zinc-900/40 backdrop-blur-2xl 
          z-20 transition-all duration-300 ease-out
        `}
      >
        <Sidebar
          chats={chats}
          activeChat={activeChat}
          setActiveChat={handleSetActiveChat}
          chatsLoading={chatsLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          globalUsers={globalUsers}
          searchLoading={searchLoading}
          startingChatId={startingChatId}
          onStartChat={handleStartChat}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />
      </aside>

      <main 
        ref={chatContainerRef}
        className={`
          ${isInsideChat ? 'flex' : 'hidden sm:flex'} 
          flex-1 h-full min-w-0 
          bg-zinc-950/80 backdrop-blur-xl 
          z-10 flex-col relative transition-all duration-300 ease-out
        `}
      >
        <ChatWindow
          activeChatData={activeChatData}
          setActiveChat={handleSetActiveChat}
          messages={messages}
          messagesLoading={messagesLoading}
          currentUserId={currentUser?.id}
          companionSettings={activeCompanionSettings}
          sendingMessage={sendingMessage}
          onSendMessage={handleSendMessage}
          messagesEndRef={messagesEndRef}
        />
      </main>
    </div>
  )
}

export default Home