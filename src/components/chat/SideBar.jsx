import React from 'react'
import { Icon } from '../ui/Icon'

const getInitial = (value) => (value?.trim()?.[0] || '?').toUpperCase()

export const Sidebar = ({
  chats,
  activeChat,
  setActiveChat,
  chatsLoading,
  searchQuery,
  setSearchQuery,
  globalUsers,
  searchLoading,
  startingChatId,
  onStartChat,
  errorMessage,
  setErrorMessage
}) => {
  const searchTerm = searchQuery.trim()

  return (
    <section className="w-full h-full flex flex-col bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800/40 flex-shrink-0">
      <div className="p-4 flex flex-col gap-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red">Messenger</p>
            <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Чаты</h1>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск людей..."
            className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 focus:border-brand-red/40 focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-zinc-500 shadow-2xs"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500">
            <Icon name="search" className="w-3.5 h-3.5" />
          </span>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-red transition-colors cursor-pointer" 
              aria-label="Очистить поиск"
            >
              <Icon name="x" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="mx-4 mb-3 flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 animate-in fade-in zoom-in-95 duration-150">
          <span className="truncate flex-1 mr-2">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-600 cursor-pointer">
            <Icon name="x" className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-1 px-3 pb-4 custom-scrollbar">
        {searchTerm ? (
          <div className="space-y-1 pt-1">
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 px-2 mb-2 uppercase tracking-wider">Глобальный поиск</p>
            {searchLoading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-xs text-slate-400 dark:text-zinc-500">
                <div className="w-4 h-4 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                <span>Ищу людей...</span>
              </div>
            ) : globalUsers.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-8">Никого не найдено</p>
            ) : (
              globalUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/40 bg-slate-50/50 dark:bg-zinc-950/20 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-all duration-200">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-red to-rose-500 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                    {getInitial(user.username || user.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">{user.username || 'Без имени'}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">{user.email}</p>
                  </div>
                  <button
                    onClick={() => onStartChat(user)}
                    disabled={startingChatId === user.id}
                    className="ml-auto text-[10px] py-1.5 px-3 bg-brand-red hover:bg-rose-600 text-white rounded-lg font-bold disabled:opacity-50 transition-all shadow-2xs active:scale-95 cursor-pointer"
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
              <div key={item} className="h-[60px] rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/20 animate-pulse" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-500 border border-slate-100 dark:border-zinc-800/60">
              <Icon name="chat" className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">Пока нет диалогов</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400 dark:text-zinc-500 max-w-[200px] mx-auto">Найдите собеседника по никнейму через поиск.</p>
          </div>
        ) : (
          chats.map((chat) => {
            const selected = activeChat === chat.id
            return (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`relative w-full flex items-center gap-3 p-3 rounded-xl text-left cursor-pointer border transition-all duration-200 group ${
                  selected 
                    ? 'bg-slate-100/80 dark:bg-zinc-800/60 border-slate-200/60 dark:border-zinc-700 shadow-2xs' 
                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/25'
                }`}
              >
                {selected && (
                  <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-md bg-brand-red animate-in fade-in duration-200" />
                )}

                <div className={`w-10 h-10 shrink-0 rounded-xl font-bold flex items-center justify-center text-sm transition-all duration-200 ${
                  selected 
                    ? 'bg-brand-red text-white shadow-sm shadow-brand-red/10 group-hover:scale-102' 
                    : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>
                  {getInitial(chat.companionName)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{chat.companionName}</span>
                  </div>
                  <span className="block truncate text-[11px] text-slate-400 dark:text-zinc-500">
                    {chat.companionEmail || 'Личный чат'}
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>
    </section>
  )
}