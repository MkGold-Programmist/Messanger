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
    <section className={`w-full sm:w-80 md:w-88 flex-col border-r border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/60 flex-shrink-0 ${activeChat ? 'hidden sm:flex' : 'flex'}`}>
      <div className="p-4 flex flex-col gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-red">Messenger</p>
          <h1 className="text-2xl font-black tracking-tight">Чаты</h1>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск людей по никнейму"
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-zinc-950 border border-transparent focus:border-brand-red outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-zinc-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="search" />
          </span>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-red" aria-label="Очистить поиск">
              <Icon name="x" />
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <button onClick={() => setErrorMessage('')} className="mx-4 mb-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-left text-xs font-medium text-rose-600 dark:text-rose-300">
          {errorMessage}
        </button>
      )}

      <div className="flex-1 overflow-y-auto space-y-1 px-2 pb-4">
        {searchTerm ? (
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 px-3 mb-2 uppercase tracking-wider">Глобальный поиск</p>
            {searchLoading ? (
              <p className="text-xs text-slate-400 text-center py-6">Ищу людей...</p>
            ) : globalUsers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Никого не найдено</p>
            ) : (
              globalUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800/40 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-red to-rose-500 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-brand-red/10">
                    {getInitial(user.username || user.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold truncate">{user.username || 'Без имени'}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => onStartChat(user)}
                    disabled={startingChatId === user.id}
                    className="ml-auto text-[10px] py-1.5 px-3 bg-brand-red text-white rounded-lg font-bold hover:bg-brand-redHover disabled:opacity-60 transition-colors shadow-sm shadow-brand-red/10"
                  >
                    {startingChatId === user.id ? '...' : 'Написать'}
                  </button>
                </div>
              ))
            )}
          </div>
        ) : chatsLoading ? (
          <div className="space-y-2 px-2">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-16 rounded-xl bg-slate-100 dark:bg-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-brand-red">
              <Icon name="spark" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">Пока нет диалогов</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400 dark:text-zinc-500">Найди человека по никнейму и начни первый чат.</p>
          </div>
        ) : (
          chats.map((chat) => {
            const selected = activeChat === chat.id
            return (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left cursor-pointer transition-all ${
                  selected ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'hover:bg-slate-100 dark:hover:bg-zinc-800/40'
                }`}
              >
                <span className={`w-10 h-10 shrink-0 rounded-xl font-bold flex items-center justify-center text-sm shadow-inner ${
                  selected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}>
                  {getInitial(chat.companionName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{chat.companionName}</span>
                  <span className={`block truncate text-[11px] ${selected ? 'text-rose-100' : 'text-slate-400 dark:text-zinc-500'}`}>
                    {chat.companionEmail || 'Личный чат'}
                  </span>
                </span>
              </button>
            )
          })
        )}
      </div>
    </section>
  )
}