import React from 'react'
import { Icon } from '../ui/Icon'

const getInitial = (value) => (value?.trim()?.[0] || '?').toUpperCase()

const Sidebar = ({
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
    <section className="w-full h-full flex flex-col bg-[#FAFAFA] dark:bg-[#09090B] border-r border-[#E11D48]/10 dark:border-[#18181B] flex-shrink-0 transition-colors duration-300">

      <div className="p-4 flex flex-col gap-3 flex-shrink-0 bg-white/80 dark:bg-[#18181B]/40 backdrop-blur-md border-b border-zinc-100 dark:border-transparent">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E11D48]">LearnIT</p>
            <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-[#FFFFFF]">Чаты</h1>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск людей по никнейму..."
            className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl bg-[#FAFAFA] dark:bg-[#09090B] border border-zinc-200 dark:border-[#18181B] focus:border-[#E11D48] dark:focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10 outline-none transition-all text-zinc-900 dark:text-[#FFFFFF] placeholder-zinc-400 dark:placeholder-zinc-500 font-medium"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
            <Icon name="search" className="w-4 h-4" />
          </span>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#E11D48] transition-colors cursor-pointer p-0.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800" 
              aria-label="Очистить поиск"
            >
              <Icon name="x" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-[#E11D48]/20 bg-[#E11D48]/5 px-3 py-2.5 text-xs font-semibold text-[#E11D48] animate-fade-in">
          <span className="truncate flex-1 mr-2 font-medium">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-[#E11D48] hover:text-[#BE123C] cursor-pointer p-0.5 rounded-md">
            <Icon name="x" className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-1 px-3 py-3 custom-scrollbar">
        {searchTerm ? (
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 px-2 mb-2 uppercase tracking-wider">Глобальный поиск</p>
            {searchLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                <div className="w-5 h-5 border-2 border-[#E11D48] border-t-transparent rounded-full animate-spin" />
                <span>Ищу людей...</span>
              </div>
            ) : globalUsers.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-12 font-medium">Никого не найдено</p>
            ) : (
              globalUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 dark:border-[#18181B] bg-white dark:bg-[#18181B]/40 hover:border-[#E11D48]/20 dark:hover:border-[#E11D48]/20 transition-all duration-200 shadow-3xs">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E11D48] to-[#BE123C] text-white font-black text-xs flex items-center justify-center shadow-sm">
                    {getInitial(user.username || user.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate text-zinc-900 dark:text-[#FFFFFF]">{user.username || 'Без имени'}</h4>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5 font-mono">{user.email}</p>
                  </div>
                  <button
                    onClick={() => onStartChat(user)}
                    disabled={startingChatId === user.id}
                    className="ml-auto text-[10px] py-1.5 px-3 bg-gradient-to-r from-[#E11D48] to-[#BE123C] hover:from-[#BE123C] hover:to-[#E11D48] text-white rounded-lg font-black disabled:opacity-50 transition-all shadow-xs active:scale-95 cursor-pointer uppercase tracking-wider"
                  >
                    {startingChatId === user.id ? '...' : 'Написать'}
                  </button>
                </div>
              ))
            )}
          </div>
        ) : chatsLoading ? (
          <div className="space-y-2 pt-1">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="h-[64px] rounded-xl bg-white dark:bg-[#18181B]/60 border border-zinc-100 dark:border-zinc-800/20 animate-pulse" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="px-4 py-20 text-center flex flex-col items-center justify-center">
            <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-[#18181B] text-zinc-400 dark:text-zinc-500 border border-zinc-100 dark:border-[#18181B] shadow-3xs">
              <Icon name="chat" className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Пока нет диалогов</p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500 max-w-[200px] font-medium">Найдите собеседника по никнейму через верхний поиск.</p>
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
                    ? 'bg-white dark:bg-[#18181B] border-[#E11D48]/10 dark:border-[#18181B] shadow-xs' 
                    : 'bg-transparent border-transparent hover:bg-white/60 dark:hover:bg-[#18181B]/20 hover:border-zinc-100 dark:hover:border-transparent'
                }`}
              >
                {selected && (
                  <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-md bg-[#E11D48] animate-fade-in" />
                )}

                <div className={`w-10 h-10 shrink-0 rounded-xl font-black flex items-center justify-center text-xs transition-all duration-200 ${
                  selected 
                    ? 'bg-gradient-to-b from-[#E11D48] to-[#BE123C] text-white shadow-md shadow-[#E11D48]/10 group-hover:scale-102' 
                    : 'bg-white dark:bg-[#18181B] text-zinc-700 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800/60'
                }`}>
                  {getInitial(chat.companionName)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="truncate text-xs font-bold text-zinc-900 dark:text-[#FFFFFF]">{chat.companionName}</span>
                  </div>
                  <span className={`block truncate text-[11px] font-medium transition-colors ${
                    selected ? 'text-[#E11D48] dark:text-[#E11D48]' : 'text-zinc-400 dark:text-zinc-500'
                  }`}>
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

export default Sidebar