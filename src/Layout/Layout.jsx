import React, { useEffect, useLayoutEffect, useState, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'

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
  const location = useLocation()

  const isInsideChat = location.pathname.includes('/chat/') || (location.pathname.split('/').length > 2)

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
          setStatusText('')
          setIsProfileLoaded(false)
          return
        }

        setUserProfile(profile)
        setIsProfileLoaded(true) 

        const { data: settingsData } = await supabase
          .from('user_settings')
          .select('theme, status_text')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!isMounted.current) return

        if (settingsData) {
          setTheme(settingsData.theme || fallbackTheme)
          setStatusText(settingsData.status_text || '')
        } else {
          await supabase
            .from('user_settings')
            .upsert({ user_id: user.id, theme: fallbackTheme, status_text: '' }, { onConflict: 'user_id' })
          
          if (isMounted.current) {
            setTheme(fallbackTheme)
            setStatusText('')
          }
        }
      } catch (err) {
        console.error('Ошибка инициализации данных:', err)
      }
    }

    fetchUserDataAndSettings()

    return () => { isMounted.current = false }
  }, [navigate])

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    if (!userIdRef.current || !isProfileLoaded) return

    await supabase
      .from('user_settings')
      .upsert({ user_id: userIdRef.current, theme: nextTheme }, { onConflict: 'user_id' })
  }

  const handleSaveStatus = async () => {
    if (!userIdRef.current || !isProfileLoaded) return
    setSavingStatus(true)
    const cleanStatus = statusText.trim().slice(0, 80)

    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: userIdRef.current, status_text: cleanStatus, theme }, { onConflict: 'user_id' })

    if (!isMounted.current) return
    setSavingStatus(false)
    if (!error) {
      setStatusText(cleanStatus)
      setShowStatusInput(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      navigate('/login')
    }
  }

  const avatarLetter = userProfile?.username ? userProfile.username[0].toUpperCase() : '?'
  const profileName = userProfile?.username || userProfile?.email || 'Мой профиль'

  return (
    <div className="h-dvh w-screen flex flex-col sm:flex-row overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 text-slate-900 dark:from-zinc-950 dark:to-zinc-900/20 dark:text-slate-100 font-sans transition-colors duration-300">

      {isInsideChat && (
        <header className="flex sm:hidden h-16 w-full items-center justify-between px-4 border-b border-slate-200/80 dark:border-zinc-900/80 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-md z-50 animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-3">

            <button 
              onClick={() => navigate('/chats')} // Замени на свой основной роут списка чатов, если он отличается
              className="p-2 -ml-2 rounded-full text-slate-600 dark:text-zinc-400 active:bg-slate-100 dark:active:bg-zinc-900 transition-colors"
              aria-label="Назад к чатам"
            >
              <Icon name="back" className="w-6 h-6" />
            </button>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-red to-rose-500 text-white flex items-center justify-center font-bold shadow-sm shadow-brand-red/10">
              C
            </div>

            <div>
              <p className="text-sm font-semibold tracking-tight max-w-[180px] truncate">Чат</p>
              <p className="text-[10px] text-emerald-500 dark:text-emerald-400 font-medium animate-pulse">в сети</p>
            </div>
          </div>
        </header>
      )}

      <aside className={`${isInsideChat ? 'hidden sm:flex' : 'flex'} h-16 sm:h-full w-full sm:w-20 sm:flex-col items-center justify-between px-4 sm:px-0 sm:py-6 border-b sm:border-b-0 sm:border-r border-slate-200/80 dark:border-zinc-900/80 bg-white/80 dark:bg-zinc-950/40 backdrop-blur-md flex-shrink-0 z-50 transition-all duration-300`}>
        <div className="flex sm:flex-col gap-4 sm:gap-6 items-center w-full justify-between sm:justify-start px-2 sm:px-0">

          <button className="relative cursor-pointer flex-shrink-0" onClick={() => setShowStatusInput(!showStatusInput)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-red to-rose-500 text-white flex items-center justify-center font-bold border border-rose-400/10 shadow-md shadow-brand-red/10 transition-all hover:scale-105 active:scale-95">
              {avatarLetter}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950 shadow-sm" />
          </button>

          <div className="flex sm:flex-col gap-3 sm:gap-6 items-center">
            <button className="p-2.5 rounded-xl text-brand-red bg-rose-500/10 dark:bg-rose-500/10 border border-rose-500/20 sm:w-12 sm:h-12 flex items-center justify-center shadow-sm" title="Чаты">
              <Icon name="chat" className="w-5 h-5" />
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-brand-red hover:bg-rose-500/10 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 sm:w-12 sm:h-12 flex items-center justify-center transition-all active:scale-95"
              title="Выйти"
            >
              <Icon name="logout" className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 flex sm:hidden items-center justify-center text-slate-600 dark:text-zinc-400"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-800/60 hidden sm:flex sm:w-12 sm:h-12 items-center justify-center text-slate-600 dark:text-zinc-400 transition-all active:scale-95"
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-5 h-5" />
        </button>
      </aside>

      {showStatusInput && (
        <>
          <button className="fixed inset-0 z-50 bg-black/10 dark:bg-black/30 backdrop-blur-xs" onClick={() => setShowStatusInput(false)} />
          <div className="fixed sm:absolute left-4 right-4 top-18 sm:top-18 sm:left-24 z-50 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xl sm:w-72 animate-in fade-in slide-in-from-top-4 duration-200">
            <p className="mb-3 text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">{profileName}</p>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Твой статус</label>
            <input
              type="text"
              value={statusText}
              disabled={!isProfileLoaded}
              onChange={(event) => setStatusText(event.target.value)}
              maxLength={80}
              placeholder={isProfileLoaded ? "Что у тебя нового?" : "Загрузка..."}
              className="w-full p-2.5 mb-3 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-red/50 transition-all"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowStatusInput(false)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-400">Отмена</button>
              <button onClick={handleSaveStatus} disabled={savingStatus || !isProfileLoaded} className="text-xs px-3 py-1.5 rounded-lg bg-brand-red text-white font-medium disabled:opacity-60 transition-colors">
                {savingStatus ? '...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </>
      )}

      <main className="flex-1 min-h-0 min-w-0 flex overflow-hidden relative z-10 bg-transparent h-[calc(100vh-4rem)] sm:h-full">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout