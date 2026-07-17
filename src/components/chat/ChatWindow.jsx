import React, { useMemo } from 'react'
import { Icon } from '../ui/Icon'
import { MessageInput } from './MessageInput'

export const ChatWindow = ({
  activeChatData,
  setActiveChat,
  messages,
  messagesLoading,
  currentUserId,
  companionSettings,
  sendingMessage,
  onSendMessage,
  messagesEndRef
}) => {

  const wallpaperStyle = useMemo(() => {
    const wp = companionSettings?.chat_wallpaper
    if (wp && wp !== 'default') {
      return {
        backgroundImage: `linear-gradient(rgba(var(--bg-overlay, 248,250,252), 0.85), rgba(var(--bg-overlay, 248,250,252), 0.85)), url(${wp})`
      }
    }
    return undefined
  }, [companionSettings])

  // Дизайнерская заглушка для десктопа (на мобилках скрыта, так как там виден сайдбар)
  if (!activeChatData) {
    return (
      <section className="hidden sm:flex flex-1 flex-col items-center justify-center text-slate-400 dark:text-zinc-600 p-6 text-center bg-slate-50 dark:bg-zinc-950 h-full">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 text-brand-red shadow-sm border border-slate-100 dark:border-zinc-900">
          <Icon name="message" className="w-7 h-7" />
        </div>
        <p className="text-sm font-bold text-slate-600 dark:text-zinc-300">Выберите чат</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed">Или найдите пользователя слева, чтобы начать новый диалог.</p>
      </section>
    )
  }

  return (
    <section className={`flex-1 flex flex-col bg-slate-50 dark:bg-zinc-950 h-full w-full ${activeChatData ? 'flex' : 'hidden sm:flex'}`}>
      {/* Шапка чата */}
      <header className="h-16 border-b border-slate-200 dark:border-zinc-900 px-4 sm:px-6 flex items-center gap-3 justify-between bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl z-10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => setActiveChat(null)} 
            className="sm:hidden flex items-center justify-center p-2 -ml-2 rounded-xl text-brand-red hover:bg-rose-500/10 active:scale-95 transition-all"
            aria-label="Назад к чатам"
          >
            <Icon name="x" className="rotate-90 w-5 h-5" /> 
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight truncate text-slate-900 dark:text-slate-100">{activeChatData.companionName}</h2>
            <p className="text-[10px] text-emerald-500 font-bold tracking-wide mt-0.5 uppercase truncate">
              {companionSettings?.status_text || 'в сети'}
            </p>
          </div>
        </div>
      </header>

      {/* Тело чата */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-cover bg-center custom-scrollbar" style={wallpaperStyle}>
        {messagesLoading ? (
          <div className="space-y-3">
            <div className="h-11 w-52 rounded-2xl bg-white dark:bg-zinc-900 animate-pulse" />
            <div className="ml-auto h-14 w-64 rounded-2xl bg-rose-500/20 animate-pulse" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 text-brand-red shadow-sm">
                <Icon name="message" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">Диалог пустой</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Напиши первое сообщение.</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl text-sm shadow-sm transition-all ${
                  isMe ? 'rounded-br-md bg-brand-red text-white shadow-brand-red/10' : 'rounded-bl-md bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/40 text-slate-800 dark:text-zinc-200'
                }`}>
                  <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                  <span className={`block text-[9px] text-right mt-1.5 font-medium ${isMe ? 'text-red-100/80' : 'text-slate-400 dark:text-zinc-500'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <MessageInput onSendMessage={onSendMessage} sending={sendingMessage} />
    </section>
  )
}