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
    <section className={`w-full h-full flex flex-col bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex-shrink-0 ${activeChat ? 'hidden sm:flex' : 'flex'}`}>
      <div className="p-4 flex flex-col gap-3 flex-shrink-0">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red">Messenger</p>
          <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Чаты</h1>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск людей по никнейму"
            className="w-full pl-9 pr-9 py-2 text-sm rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 focus:border-brand-red/40 focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-zinc-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500">
            <Icon name="search" className="w-4 h-4" />
          </span>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-red transition-colors" aria-label="Очистить поиск">
              <Icon name="x" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="mx-4 mb-3 flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400">
          <span className="truncate flex-1 mr-2">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-300">
            <Icon name="x" className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-0.5 px-2 pb-4 custom-scrollbar">
        {searchTerm ? (
          <div className="space-y-1 pt-1">
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 px-3 mb-2 uppercase tracking-wider">Глобальный поиск</p>
            {searchLoading ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-6">Ищу людей...</p>
            ) : globalUsers.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-6">Никого не найдено</p>
            ) : (
              globalUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-red to-rose-500 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                    {getInitial(user.username || user.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold truncate text-slate-900 dark:text-slate-100">{user.username || 'Без имени'}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => onStartChat(user)}
                    disabled={startingChatId === user.id}
                    className="ml-auto text-[11px] py-1.5 px-3 bg-brand-red hover:bg-rose-600 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors shadow-sm active:scale-95"
                  >
                    {startingChatId === user.id ? '...' : 'Написать'}
                  </button>
                </div>
              ))
            )}
          </div>
        ) : chatsLoading ? (
          <div className="space-y-2 px-2 pt-1">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-14 rounded-xl bg-slate-100 dark:bg-zinc-800/50 animate-pulse" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500">
              <Icon name="chat" className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">Пока нет диалогов</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400 dark:text-zinc-500">Найдите собеседника по никнейму выше.</p>
          </div>
        ) : (
          chats.map((chat) => {
            const selected = activeChat === chat.id
            return (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`relative w-full flex items-center gap-3 p-3 rounded-xl text-left cursor-pointer transition-all ${
                  selected 
                    ? 'bg-slate-100 dark:bg-zinc-800/70 shadow-sm' 
                    : 'hover:bg-slate-50 dark:hover:bg-zinc-800/30'
                }`}
              >
                {selected && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md bg-brand-red animate-in fade-in duration-200" />
                )}

                <div className={`w-10 h-10 shrink-0 rounded-xl font-bold flex items-center justify-center text-sm transition-colors ${
                  selected 
                    ? 'bg-brand-red text-white shadow-sm shadow-brand-red/10' 
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