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
        backgroundImage: `linear-gradient(to bottom, var(--tw-bg-opacity, rgba(250,250,250,0.93)), var(--tw-bg-opacity, rgba(250,250,250,0.93))), url(${wp})`
      }
    }
    return undefined
  }, [companionSettings])

  if (!activeChatData) {
    return (
      <section className="hidden sm:flex flex-1 flex-col items-center justify-center p-6 text-center bg-[#FAFAFA] dark:bg-[#09090B] h-full border-l border-zinc-100 dark:border-[#18181B] transition-colors duration-300">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-[#18181B] text-zinc-400 dark:text-zinc-500 border border-zinc-100 dark:border-[#18181B] shadow-3xs">
          <Icon name="chat" className="w-5 h-5 text-[#E11D48]" />
        </div>
        <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Выберите диалог</p>
        <p className="mt-1 max-w-xs text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed font-medium">Начните общение, выбрав существующий чат или найдите пользователя через поиск.</p>
      </section>
    )
  }

  const renderMessageContent = (msg, isMe) => {
    const hasFile = !!msg.file_url;
    const isImage = hasFile && (msg.file_url.match(/\.(jpeg|jpg|gif|png|webp)/i) || msg.file_type?.startsWith('image/'));

    if (!hasFile) {
      return <p className="leading-relaxed break-words whitespace-pre-wrap font-medium text-xs">{msg.text}</p>;
    }

    return (
      <div className="space-y-2">
        {isImage ? (
          <div className="overflow-hidden rounded-xl border border-zinc-200/50 dark:border-zinc-800 max-w-full shadow-2xs">
            <img 
              src={msg.file_url} 
              alt="Изображение" 
              className="max-h-60 object-cover w-full hover:scale-[1.01] transition-transform duration-200 cursor-zoom-in"
              onClick={() => window.open(msg.file_url, '_blank')}
            />
          </div>
        ) : (
          <a 
            href={msg.file_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
              isMe 
                ? 'bg-black/15 hover:bg-black/25 border-white/5 text-white' 
                : 'bg-[#FAFAFA] hover:bg-zinc-100 dark:bg-[#09090B] dark:hover:bg-[#18181B] border-zinc-200 dark:border-[#18181B] text-zinc-900 dark:text-[#FFFFFF]'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-white/10 text-white' : 'bg-[#E11D48]/10 text-[#E11D48]'}`}>
              <Icon name="file" className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold truncate">{msg.file_name || 'Скачать файл'}</p>
              <p className={`text-[9px] font-bold uppercase tracking-wider ${isMe ? 'text-zinc-200/60' : 'text-zinc-400 dark:text-zinc-500'} mt-0.5`}>Документ</p>
            </div>
          </a>
        )}
        {msg.text && <p className="leading-relaxed break-words whitespace-pre-wrap font-medium text-xs mt-1">{msg.text}</p>}
      </div>
    );
  };

  return (
    <section className="flex-1 flex flex-col bg-[#FAFAFA] dark:bg-[#09090B] h-full w-full min-w-0 transition-colors duration-300">
      {/* Шапка чата */}
      <header className="h-16 border-b border-zinc-100 dark:border-[#18181B] px-4 sm:px-6 flex items-center justify-between bg-white/80 dark:bg-[#18181B]/80 backdrop-blur-md flex-shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => setActiveChat(null)} 
            className="sm:hidden flex items-center justify-center p-2 -ml-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
            aria-label="Назад к чатам"
          >
            <Icon name="back" className="w-5 h-5" /> 
          </button>
          
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight truncate text-zinc-900 dark:text-[#FFFFFF]">{activeChatData.companionName}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-sm shadow-emerald-500/40 animate-pulse" />
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tracking-wide uppercase truncate max-w-[200px]">
                {companionSettings?.status_text || 'в сети'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Окно сообщений */}
      <div 
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-cover bg-center custom-scrollbar" 
        style={wallpaperStyle}
      >
        {messagesLoading ? (
          <div className="space-y-4">
            <div className="h-10 w-44 rounded-2xl rounded-bl-none bg-white dark:bg-[#18181B] border border-zinc-100 dark:border-zinc-800 animate-pulse" />
            <div className="ml-auto h-12 w-56 rounded-2xl rounded-br-none bg-[#E11D48]/10 border border-[#E11D48]/10 animate-pulse" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center bg-white/60 dark:bg-[#18181B]/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40 shadow-3xs">
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Здесь пока пусто</p>
              <p className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Отправьте первое сообщение ниже.</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] sm:max-w-[65%] p-3 rounded-2xl shadow-3xs transition-all ${
                  isMe 
                    ? 'rounded-br-none bg-gradient-to-b from-[#E11D48] to-[#BE123C] text-white' 
                    : 'rounded-bl-none bg-white dark:bg-[#18181B] border border-zinc-100 dark:border-[#18181B] text-zinc-800 dark:text-zinc-200'
                }`}>
                  {renderMessageContent(msg, isMe)}
                  <span className={`block text-[9px] text-right mt-1.5 font-bold font-mono tracking-tight ${
                    isMe ? 'text-zinc-200/70' : 'text-zinc-400 dark:text-zinc-500'
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

      {/* Поле ввода */}
      <MessageInput onSendMessage={onSendMessage} sending={sendingMessage} />
    </section>
  )
}