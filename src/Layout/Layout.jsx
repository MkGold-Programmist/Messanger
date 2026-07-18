import React, { useEffect, useLayoutEffect, useState, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useChatState } from '../context/ChatContext'

const ICON_PATHS = {
  chat: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />,
  settings: (
    <g>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </g>
  ),
  logout: (
    <g>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </g>
  ),
  sun: (
    <g>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </g>
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
    strokeWidth="2.2" 
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
  const [isProfileLoaded, setIsProfileLoaded] = useState(false)
  
  const userIdRef = useRef(null) 
  const isMounted = useRef(true)
  const navigate = useNavigate()
  const location = useLocation()
  
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
          .select('theme')
          .eq('user_id', user.id)
          .maybeSingle()

        if (settingsData && isMounted.current) {
          setTheme(settingsData.theme || fallbackTheme)
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

  const handleLogout = async () => {
    try { await supabase.auth.signOut() } finally { navigate('/login') }
  }

  const avatarLetter = userProfile?.username ? userProfile.username[0].toUpperCase() : '?'
  const chatAvatarLetter = activeChatName ? activeChatName[0].toUpperCase() : '?'

  const isSettingsPage = location.pathname === '/settings'

  return (
    <div className="h-screen w-screen flex flex-col sm:flex-row overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {isInsideChat && !isSettingsPage && (
        <header className="flex sm:hidden h-14 w-full items-center justify-between px-4 border-b border-slate-200/80 dark:border-zinc-900 bg-white dark:bg-zinc-900 z-50 flex-shrink-0 shadow-3xs">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveChatName(null)}
              className="p-2 -ml-2 rounded-xl text-slate-500 dark:text-zinc-400 active:bg-slate-100 dark:active:bg-zinc-800 transition-colors"
              aria-label="Назад к списку чатов"
            >
              <Icon name="back" className="w-5 h-5" />
            </button>
            
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-red to-rose-500 text-white flex items-center justify-center font-bold shadow-xs">
              {chatAvatarLetter}
            </div>

            <div>
              <p className="text-xs font-bold tracking-tight max-w-[180px] truncate">{activeChatName}</p>
              <p className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5 uppercase tracking-wider">
                <span className="w-1 h-1 rounded-full bg-emerald-500" /> в сети
              </p>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 min-w-0 flex overflow-hidden relative bg-transparent h-full order-1 sm:order-2">
        <Outlet />
      </main>

      <aside className={`
        ${isInsideChat ? 'hidden sm:flex' : 'flex'} 
        fixed bottom-0 left-0 right-0 h-16 w-full border-t 
        sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:h-full sm:w-20 sm:border-t-0 sm:border-r 
        flex-row sm:flex-col items-center justify-between px-6 sm:px-0 sm:py-6 
        border-slate-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md
        z-40 flex-shrink-0 transition-all duration-300 order-2 sm:order-1 shadow-lg sm:shadow-none
      `}>
        
        <div className="flex flex-row sm:flex-col gap-2 sm:gap-6 items-center w-full justify-between sm:justify-start px-0 sm:px-2">
      
          <div className="relative flex-shrink-0 hidden sm:block mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-red to-rose-500 text-white flex items-center justify-center font-bold shadow-md">
              {avatarLetter}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900" />
          </div>

          <div className="flex flex-row sm:flex-col gap-1 sm:gap-3.5 items-center w-full justify-around sm:justify-center">
            {/* Кнопка Чаты */}
            <button 
              onClick={() => { setActiveChatName(null); navigate('/'); }}
              className={`p-2.5 sm:p-3 rounded-xl sm:w-12 sm:h-12 flex flex-col sm:flex-row items-center justify-center transition-all duration-200 relative group cursor-pointer ${
                !isSettingsPage 
                  ? 'text-brand-red bg-rose-500/10 border border-rose-500/20 shadow-xs' 
                  : 'text-slate-400 dark:text-zinc-500 border border-transparent hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <Icon name="chat" className="w-5 h-5 transition-transform group-active:scale-90" />
              <span className="text-[9px] sm:hidden font-medium mt-0.5">Чаты</span>
            </button>

            <button
              onClick={() => navigate('/settings')}
              className={`p-2.5 sm:p-3 rounded-xl sm:w-12 sm:h-12 flex flex-col sm:flex-row items-center justify-center transition-all duration-200 relative group cursor-pointer ${
                isSettingsPage 
                  ? 'text-brand-red bg-rose-500/10 border border-rose-500/20 shadow-xs' 
                  : 'text-slate-400 dark:text-zinc-500 border border-transparent hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
              }`}
              title="Настройки"
            >
              <Icon name="settings" className="w-5 h-5 transition-transform group-active:scale-90" />
              <span className="text-[9px] sm:hidden font-medium mt-0.5">Настройки</span>
            </button>

            <button 
              onClick={toggleTheme} 
              className="p-2.5 rounded-xl flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 sm:hidden cursor-pointer"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-5 h-5" />
              <span className="text-[9px] font-medium mt-0.5">Тема</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 sm:p-3 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-brand-red hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 sm:w-12 sm:h-12 flex flex-col sm:flex-row items-center justify-center transition-all active:scale-95 cursor-pointer"
              title="Выйти"
            >
              <Icon name="logout" className="w-5 h-5" />
              <span className="text-[9px] sm:hidden font-medium mt-0.5">Выйти</span>
            </button>
          </div>

        </div>

        <button 
          onClick={toggleTheme} 
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-slate-200/60 dark:border-zinc-700 hidden sm:flex sm:w-12 sm:h-12 items-center justify-center text-slate-600 dark:text-zinc-400 transition-all active:scale-95 cursor-pointer"
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-5 h-5" />
        </button>
      </aside>

    </div>
  )
}

export default Layout