import React, { useEffect, useLayoutEffect, useState, useRef } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useChatState } from '../context/ChatContext'

const ICON_PATHS = {
  chat: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />,
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </>
  ),
  moon: <path d="M20.99 12.55A9 9 0 1 1 11.45 3a7 7 0 0 0 9.54 9.55z" />,
  back: <path d="M19 12H5M12 19l-7-7 7-7" />,
}

const Icon = ({ name, className = 'w-5 h-5' }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    aria-hidden="true"
  >
    {ICON_PATHS[name]}
  </svg>
)

const Layout = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [userProfile, setUserProfile] = useState(null)
  const [statusText, setStatusText] = useState('')
  const [showStatusInput, setShowStatusInput] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [isProfileLoaded, setIsProfileLoaded] = useState(false)
  
  const userIdRef = useRef(null) 
  const isMounted = useRef(true)
  const navigate = useNavigate()
  
  const { activeChatName, setActiveChatName } = useChatState()
  const isInsideChat = !!activeChatName

  useLayoutEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    isMounted.current = true
    const fetchUserDataAndSettings = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          if (isMounted.current) navigate('/login')
          return
        }
        userIdRef.current = user.id

        const { data: profile } = await supabase
          .from('users')
          .select('username, email')
          .eq('id', user.id)
          .maybeSingle()

        if (!isMounted.current) return
        const fallbackTheme = localStorage.getItem('theme') || 'dark'

        if (!profile) {
          setUserProfile({ username: user.email?.split('@')[0], email: user.email })
          setTheme(fallbackTheme)
          return
        }

        setUserProfile(profile)
        setIsProfileLoaded(true) 

        const { data: settingsData } = await supabase
          .from('user_settings')
          .select('theme, status_text')
          .eq('user_id', user.id)
          .maybeSingle()

        if (settingsData && isMounted.current) {
          setTheme(settingsData.theme || fallbackTheme)
          setStatusText(settingsData.status_text || '')
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchUserDataAndSettings()
    return () => { isMounted.current = false }
  }, [navigate])

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    if (!userIdRef.current || !isProfileLoaded) return
    await supabase.from('user_settings').upsert({ user_id: userIdRef.current, theme: nextTheme }, { onConflict: 'user_id' })
  }

  const handleSaveStatus = async () => {
    if (!userIdRef.current || !isProfileLoaded) return
    setSavingStatus(true)
    const cleanStatus = statusText.trim().slice(0, 80)
    await supabase.from('user_settings').upsert({ user_id: userIdRef.current, status_text: cleanStatus, theme }, { onConflict: 'user_id' })
    setSavingStatus(false)
    setShowStatusInput(false)
  }

  const handleLogout = async () => {
    try { await supabase.auth.signOut() } finally { navigate('/login') }
  }

  const avatarLetter = userProfile?.username ? userProfile.username[0].toUpperCase() : '?'
  const chatAvatarLetter = activeChatName ? activeChatName[0].toUpperCase() : '?'

  return (
    <div className="h-dvh w-screen flex flex-col sm:flex-row overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {isInsideChat && (
        <header className="flex sm:hidden h-16 w-full items-center justify-between px-4 border-b border-slate-200/60 dark:border-zinc-900/80 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-md z-50 animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-3">

            <button 
              onClick={() => setActiveChatName(null)} // Клик по кнопке закрывает чат
              className="p-2 -ml-2 rounded-full text-slate-500 dark:text-zinc-400 active:bg-slate-100 dark:active:bg-zinc-900 transition-colors"
              aria-label="Назад к списку чатов"
            >
              <Icon name="back" className="w-6 h-6" />
            </button>
            
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-red to-rose-500 text-white flex items-center justify-center font-bold shadow-md shadow-brand-red/10">
              {chatAvatarLetter}
            </div>

            <div>
              <p className="text-sm font-bold tracking-tight max-w-[180px] truncate">{activeChatName}</p>
              <p className="text-[11px] text-emerald-500 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> в сети
              </p>
            </div>
          </div>
        </header>
      )}

      <aside className={`${isInsideChat ? 'hidden sm:flex' : 'flex'} h-16 sm:h-full w-full sm:w-20 sm:flex-col items-center justify-between px-4 sm:px-0 sm:py-6 border-b sm:border-b-0 sm:border-r border-slate-200/80 dark:border-zinc-900/80 bg-white/80 dark:bg-zinc-950/40 backdrop-blur-md flex-shrink-0 z-50 transition-all duration-300`}>
        <div className="flex sm:flex-col gap-4 sm:gap-6 items-center w-full justify-between sm:justify-start px-2 sm:px-0">
          
          <button className="relative cursor-pointer flex-shrink-0" onClick={() => setShowStatusInput(!showStatusInput)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-red to-rose-500 text-white flex items-center justify-center font-bold shadow-md shadow-brand-red/10 transition-all hover:scale-105 active:scale-95">
              {avatarLetter}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950" />
          </button>

          <div className="flex sm:flex-col gap-3 sm:gap-6 items-center">
            <button className="p-2.5 rounded-xl text-brand-red bg-rose-500/10 border border-rose-500/20 sm:w-12 sm:h-12 flex items-center justify-center shadow-sm">
              <Icon name="chat" className="w-5 h-5" />
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-brand-red hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 sm:w-12 sm:h-12 flex items-center justify-center transition-all active:scale-95"
              title="Выйти"
            >
              <Icon name="logout" className="w-5 h-5" />
            </button>
          </div>

          <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 flex sm:hidden items-center justify-center text-slate-600 dark:text-zinc-400">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-5 h-5" />
          </button>
        </div>

        <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-800/60 hidden sm:flex sm:w-12 sm:h-12 items-center justify-center text-slate-600 dark:text-zinc-400 transition-all active:scale-95">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-5 h-5" />
        </button>
      </aside>

      {showStatusInput && (
        <>
          <button className="fixed inset-0 z-50 bg-black/20 dark:bg-black/40 backdrop-blur-xs" onClick={() => setShowStatusInput(false)} />
          <div className="fixed sm:absolute left-4 right-4 top-18 sm:top-18 sm:left-24 z-50 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl sm:w-72 animate-in fade-in slide-in-from-top-4 duration-200">
            <p className="mb-3 text-sm font-bold truncate">{userProfile?.username || 'Профиль'}</p>
            <input
              type="text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              maxLength={80}
              placeholder="Что нового?"
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-red/50 transition-all"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowStatusInput(false)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-400">Отмена</button>
              <button onClick={handleSaveStatus} className="text-xs px-3 py-1.5 rounded-lg bg-brand-red text-white font-medium">
                {savingStatus ? '...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </>
      )}

      <main className="flex-1 min-h-0 min-w-0 flex overflow-hidden relative z-10 bg-transparent h-full">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout