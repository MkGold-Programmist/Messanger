import React from 'react';
import { Icon } from '../ui/Icon';

const getInitial = (value) => (value?.trim()?.[0] || '?').toUpperCase();

const Sidebar = ({
  chats = [],
  activeChat,
  setActiveChat,
  chatsLoading,
  searchQuery = '',
  setSearchQuery,
  globalUsers = [],
  searchLoading,
  startingChatId,
  onStartChat,
  errorMessage,
  setErrorMessage
}) => {
  const searchTerm = searchQuery?.trim() || '';

  return (
    <section className="w-full h-full flex flex-col bg-zinc-50/80 dark:bg-[#09090B] border-r border-zinc-200/60 dark:border-zinc-800/60 flex-shrink-0 transition-colors">

      <div className="p-4 flex flex-col gap-3 flex-shrink-0 bg-white/70 dark:bg-[#121215]/70 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E11D48]">LearnIT</p>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Сообщения</h1>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по никнейму..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-zinc-100/80 dark:bg-[#18181B] border border-transparent focus:border-[#E11D48]/30 focus:ring-4 focus:ring-[#E11D48]/5 focus:bg-white dark:focus:bg-[#121215] outline-none transition-all text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 font-medium"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            <Icon name="search" className="w-3.5 h-3.5" />
          </span>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#E11D48] transition-colors cursor-pointer p-1 rounded-md" 
              aria-label="Очистить поиск"
            >
              <Icon name="x" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-[#E11D48]/20 bg-[#E11D48]/10 px-3 py-2 text-xs font-semibold text-[#E11D48] animate-in fade-in duration-200">
          <span className="truncate flex-1 mr-2">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="hover:opacity-75 cursor-pointer p-0.5">
            <Icon name="x" className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-1 p-2.5 custom-scrollbar">
        {searchTerm ? (
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-2 mb-2 uppercase tracking-wider">Глобальный поиск</p>
            {searchLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2.5 text-xs text-zinc-400 font-medium">
                <div className="w-5 h-5 border-2 border-[#E11D48] border-t-transparent rounded-full animate-spin" />
                <span>Поиск контактов...</span>
              </div>
            ) : globalUsers.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-10 font-medium">Пользователи не найдены</p>
            ) : (
              globalUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-[#121215] shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E11D48] to-[#BE123C] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitial(user.username || user.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-100">{user.username || 'Без имени'}</h4>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5 font-mono">{user.email}</p>
                  </div>
                  <button
                    onClick={() => onStartChat(user)}
                    disabled={startingChatId === user.id}
                    className="ml-auto text-[10px] py-1.5 px-3 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-lg font-bold disabled:opacity-50 transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                  >
                    {startingChatId === user.id ? '...' : 'Написать'}
                  </button>
                </div>
              ))
            )}
          </div>
        ) : chatsLoading ? (
          <div className="space-y-2 pt-1">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-14 rounded-xl bg-white dark:bg-[#121215] border border-zinc-200/40 dark:border-zinc-800/40 animate-pulse" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="px-4 py-16 text-center flex flex-col items-center justify-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-[#121215] text-zinc-400 border border-zinc-200/60 dark:border-zinc-800 shadow-2xs">
              <Icon name="chat" className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Нет диалогов</p>
            <p className="mt-1 text-[11px] text-zinc-400 max-w-[180px]">Воспользуйтесь поиском выше для начала общения.</p>
          </div>
        ) : (
          chats.map((chat) => {
            const selected = activeChat === chat.id;
            return (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`relative w-full flex items-center gap-3 p-2.5 rounded-xl text-left cursor-pointer transition-all duration-200 group ${
                  selected 
                    ? 'bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800 shadow-xs' 
                    : 'bg-transparent border border-transparent hover:bg-white/60 dark:hover:bg-[#121215]/50'
                }`}
              >
                {selected && (
                  <div className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-[#E11D48]" />
                )}

                <div className={`w-10 h-10 shrink-0 rounded-xl font-bold flex items-center justify-center text-xs transition-all ${
                  selected 
                    ? 'bg-gradient-to-tr from-[#E11D48] to-[#F43F5E] text-white shadow-xs shadow-[#E11D48]/30' 
                    : 'bg-zinc-200/70 dark:bg-[#18181B] text-zinc-700 dark:text-zinc-300'
                }`}>
                  {getInitial(chat.companionName)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">{chat.companionName}</span>
                  </div>
                  <span className={`block truncate text-[11px] font-normal transition-colors ${
                    selected ? 'text-[#E11D48] dark:text-[#E11D48] font-medium' : 'text-zinc-400 dark:text-zinc-500'
                  }`}>
                    {chat.companionEmail || 'Личный чат'}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
};

export default Sidebar;