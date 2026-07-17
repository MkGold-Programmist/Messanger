import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Sidebar } from '../components/chat/SideBar'
import { ChatWindow } from '../components/chat/ChatWindow'
import { useChatState } from '../context/ChatContext'

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
  }
}

const appendUniqueMessage = (messages, message) => {
  if (!message?.id || messages.some((item) => item.id === message.id)) return messages
  return [...messages, message].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
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
  const searchTerm = searchQuery.trim()

  // Подключаем наш созданный контекст
  const { activeChatName, setActiveChatName } = useChatState()

  // ИСПРАВЛЕНИЕ: Объявляем переменную для проверки, открыт ли сейчас чат
  const isInsideChat = !!activeChatName

  useEffect(() => {
    if (!activeChatName) {
      setActiveChat(null)
    }
  }, [activeChatName])

  useEffect(() => {
    let mounted = true
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (!mounted) return
      if (error) {
        setErrorMessage('Не получилось получить пользователя.')
        setChatsLoading(false)
        return
      }
      setCurrentUser(user)
    }
    getUser()
    return () => { mounted = false }
  }, [])

  const fetchChats = useCallback(async () => {
    if (!currentUser) return

    setChatsLoading(true)
    const { data, error } = await supabase
      .from('chats')
      .select(CHAT_SELECT)
      .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false })

    setChatsLoading(false)

    if (error) {
      setErrorMessage(`Ошибка загрузки чатов: ${error.message}`)
      return
    }

    const formattedChats = (data || [])
      .map((chat) => formatChat(chat, currentUser.id))
      .filter((chat) => chat.companionId)

    setChats(formattedChats)
  }, [currentUser])

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  const activeChatData = useMemo(
    () => chats.find((chat) => chat.id === activeChat),
    [activeChat, chats],
  )

  const handleSetActiveChat = (chatId) => {
    setActiveChat(chatId)
    const selectedChat = chats.find(c => c.id === chatId)
    if (selectedChat) {
      setActiveChatName(selectedChat.companionName)
    }
  }

  useEffect(() => {
    if (!activeChat) {
      setMessages([])
      setActiveCompanionSettings(null)
      return
    }

    let mounted = true
    setMessagesLoading(true)
    setMessages([])

    const fetchMessagesAndSettings = async () => {
      const messagesRequest = supabase
        .from('messages')
        .select('*')
        .eq('chat_id', activeChat)
        .order('created_at', { ascending: true })

      const settingsRequest = activeChatData?.companionId
        ? supabase
          .from('user_settings')
          .select('status_text, chat_wallpaper')
          .eq('user_id', activeChatData.companionId)
        : Promise.resolve({ data: [] })

      const [{ data: messagesData, error: messagesError }, { data: settingsData }] = await Promise.all([
        messagesRequest,
        settingsRequest,
      ])

      if (!mounted) return

      setMessagesLoading(false)
      if (messagesError) {
        setErrorMessage(`Ошибка загрузки сообщений: ${messagesError.message}`)
        return
      }

      setMessages(messagesData || [])
      setActiveCompanionSettings(settingsData?.[0] || null)
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
        setMessages((prev) => appendUniqueMessage(prev, payload.new))
      })
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [activeChat, activeChatData?.companionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, messagesLoading])

  useEffect(() => {
    if (!searchTerm || !currentUser) {
      setGlobalUsers([])
      setSearchLoading(false)
      return
    }

    let cancelled = false
    const searchUsers = async () => {
      setSearchLoading(true)
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

  const handleSendMessage = async (cleanText) => {
    if (!activeChat || !currentUser || sendingMessage) return

    setSendingMessage(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('messages')
      .insert([{ chat_id: activeChat, sender_id: currentUser.id, text: cleanText }])
      .select('*')
      .maybeSingle()

    setSendingMessage(false)

    if (error) {
      setErrorMessage(`Ошибка отправки: ${error.message}`)
      return
    }

    if (data) {
      setMessages((prev) => appendUniqueMessage(prev, data))
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
    <div className="flex flex-1 overflow-hidden w-full h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100">
      <div className={`${isInsideChat ? 'hidden sm:block' : 'block'} w-full sm:w-80 border-r border-slate-200 dark:border-zinc-900 h-full`}>
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
      </div>

      <div className={`${isInsideChat ? 'block' : 'hidden sm:block'} flex-1 h-full`}>
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
      </div>
    </div>
  )
}

export default Home