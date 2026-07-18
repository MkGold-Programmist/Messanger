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
        backgroundImage: `linear-gradient(to bottom, var(--tw-bg-opacity, rgba(248,250,252,0.9)), var(--tw-bg-opacity, rgba(248,250,252,0.9))), url(${wp})`
      }
    }
    return undefined
  }, [companionSettings])

  if (!activeChatData) {
    return (
      <section className="hidden sm:flex flex-1 flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-zinc-950 h-full border-l border-transparent dark:border-zinc-900/40">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 border border-slate-100 dark:border-zinc-800/60 shadow-xs">
          <Icon name="chat" className="w-5 h-5" />
        </div>
        <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">Выберите диалог</p>
        <p className="mt-1 max-w-xs text-[11px] text-slate-400 dark:text-zinc-500 leading-relaxed">Начните общение, выбрав существующий чат или найдите пользователя через поиск.</p>
      </section>
    )
  }

  return (
    <section className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-950 h-full w-full min-w-0">
      <header className="h-16 border-b border-slate-200 dark:border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between bg-white dark:bg-zinc-900 flex-shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => setActiveChat(null)} 
            className="sm:hidden flex items-center justify-center p-2 -ml-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 transition-all"
            aria-label="Назад к чатам"
          >
            <Icon name="back" className="w-5 h-5" /> 
          </button>
          
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight truncate text-slate-900 dark:text-white">{activeChatData.companionName}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <p className="text-[10px] text-emerald-500 dark:text-emerald-400 font-semibold tracking-wide uppercase truncate max-w-[200px]">
                {companionSettings?.status_text || 'в сети'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div 
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-cover bg-center custom-scrollbar [--tw-bg-opacity:rgba(248,250,252,0.92)] dark:[--tw-bg-opacity:rgba(9,9,11,0.94)]" 
        style={wallpaperStyle}
      >
        {messagesLoading ? (
          <div className="space-y-4">
            <div className="h-10 w-44 rounded-2xl rounded-bl-md bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 animate-pulse" />
            <div className="ml-auto h-12 w-56 rounded-2xl rounded-br-md bg-brand-red/10 dark:bg-brand-red/5 border border-brand-red/20 animate-pulse" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 dark:text-zinc-500">Здесь пока пусто</p>
              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-600">Отправьте первое сообщение ниже.</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
                <div className={`max-w-[85%] sm:max-w-[65%] p-3 rounded-2xl text-xs shadow-xs transition-all ${
                  isMe 
                    ? 'rounded-br-xs bg-gradient-to-b from-brand-red to-rose-600 text-white shadow-sm shadow-brand-red/5' 
                    : 'rounded-bl-xs bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 text-slate-800 dark:text-zinc-200'
                }`}>
                  <p className="leading-relaxed break-words whitespace-pre-wrap font-normal">{msg.text}</p>
                  <span className={`block text-[9px] text-right mt-1 font-medium tracking-tight ${
                    isMe ? 'text-rose-100/70' : 'text-slate-400 dark:text-zinc-500'
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSendMessage={onSendMessage} sending={sendingMessage} />
    </section>
  )
}