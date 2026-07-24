import React, { useMemo } from 'react';
import { Icon } from '../ui/Icon';
import MessageInput from './MessageInput'; 
import { useChatState } from '../context/ChatContext';

const ChatWindow = ({
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
  const { setActiveChatName } = useChatState();

  const wallpaperStyle = useMemo(() => {
    const wp = companionSettings?.chat_wallpaper;
    if (wp && wp !== 'default') {
      return {
        backgroundImage: `linear-gradient(to bottom, var(--tw-bg-opacity, rgba(250,250,250,0.93)), var(--tw-bg-opacity, rgba(250,250,250,0.93))), url(${wp})`
      };
    }
    return undefined;
  }, [companionSettings]);

  const handleBack = () => {
    if (typeof setActiveChat === 'function') setActiveChat(null);
    if (typeof setActiveChatName === 'function') setActiveChatName(null);
  };

  if (!activeChatData) {
    return (
      <section className="hidden sm:flex flex-1 flex-col items-center justify-center p-6 text-center bg-zinc-50/50 dark:bg-[#09090B] h-full border-l border-zinc-200/50 dark:border-zinc-800/50 transition-colors">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-[#121215] text-[#E11D48] border border-zinc-200/80 dark:border-zinc-800 shadow-sm animate-pulse">
          <Icon name="chat" className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">Выберите диалог</p>
        <p className="mt-1 max-w-xs text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed font-normal">
          Откройте существующий чат или воспользуйтесь поиском для начала общения.
        </p>
      </section>
    );
  }

  const renderMessageContent = (msg, isMe) => {
    const hasFile = !!msg.file_url;
    // Проверка mime-типа или расширения в URL
    const isImage = hasFile && (
      msg.file_type?.startsWith('image/') || 
      msg.file_url.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i)
    );

    if (!hasFile) {
      return <p className="leading-relaxed break-words whitespace-pre-wrap font-normal text-xs sm:text-sm">{msg.text}</p>;
    }

    return (
      <div className="space-y-2">
        {isImage ? (
          <div className="overflow-hidden rounded-xl border border-black/5 dark:border-white/10 max-w-full group relative">
            <img 
              src={msg.file_url} 
              alt="Изображение" 
              className="max-h-72 object-cover w-full rounded-xl group-hover:scale-[1.02] transition-transform duration-300 cursor-zoom-in"
              onClick={() => window.open(msg.file_url, '_blank')}
              loading="lazy"
            />
          </div>
        ) : (
          <a 
            href={msg.file_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
              isMe 
                ? 'bg-black/10 hover:bg-black/20 border-white/10 text-white' 
                : 'bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-[#18181B] dark:hover:bg-[#202024] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-white/15 text-white' : 'bg-[#E11D48]/10 text-[#E11D48]'}`}>
              <Icon name="file" className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold truncate">{msg.file_name || 'Скачать файл'}</p>
              <p className={`text-[9px] font-bold uppercase tracking-wider ${isMe ? 'text-white/70' : 'text-zinc-400 dark:text-zinc-500'} mt-0.5`}>Документ</p>
            </div>
          </a>
        )}
        {msg.text && <p className="leading-relaxed break-words whitespace-pre-wrap font-normal text-xs sm:text-sm pt-1">{msg.text}</p>}
      </div>
    );
  };

  return (
    <section className="flex-1 flex flex-col bg-zinc-50/50 dark:bg-[#09090B] h-full w-full min-w-0 transition-colors">
      {/* Шапка чата */}
      <header className="h-16 border-b border-zinc-200/60 dark:border-zinc-800/60 px-4 sm:px-6 flex items-center justify-between bg-white/70 dark:bg-[#121215]/70 backdrop-blur-xl flex-shrink-0 z-10 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            type="button"
            onClick={handleBack} 
            className="sm:hidden flex items-center justify-center p-2 -ml-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            aria-label="Назад к чатам"
          >
            <Icon name="back" className="w-5 h-5" /> 
          </button>
          
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight truncate text-zinc-900 dark:text-zinc-100">{activeChatData.companionName}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-xs shadow-emerald-500/50 animate-pulse" />
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide uppercase truncate max-w-[200px]">
                {companionSettings?.status_text || 'в сети'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Сообщения */}
      <div 
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-cover bg-center custom-scrollbar" 
        style={wallpaperStyle}
      >
        {messagesLoading ? (
          <div className="space-y-4">
            <div className="h-12 w-48 rounded-2xl rounded-bl-none bg-white dark:bg-[#121215] border border-zinc-200/60 dark:border-zinc-800 animate-pulse" />
            <div className="ml-auto h-14 w-60 rounded-2xl rounded-br-none bg-[#E11D48]/10 border border-[#E11D48]/10 animate-pulse" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center bg-white/80 dark:bg-[#121215]/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs">
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Здесь пока пусто</p>
              <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">Начните диалог с первого сообщения.</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
                <div className={`max-w-[85%] sm:max-w-[65%] p-3 px-3.5 rounded-2xl shadow-2xs transition-all ${
                  isMe 
                    ? 'rounded-br-xs bg-gradient-to-b from-[#E11D48] to-[#BE123C] text-white' 
                    : 'rounded-bl-xs bg-white dark:bg-[#121215] border border-zinc-200/70 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                }`}>
                  {renderMessageContent(msg, isMe)}
                  <span className={`block text-[9px] text-right mt-1 font-semibold font-mono tracking-tight ${
                    isMe ? 'text-white/70' : 'text-zinc-400 dark:text-zinc-500'
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSendMessage={onSendMessage} sending={sendingMessage} />
    </section>
  );
};

export default ChatWindow;