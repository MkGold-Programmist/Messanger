import React, { useEffect, useLayoutEffect, useState, useRef } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
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
}

const Icon = ({ name, className = 'w-5 h-5' }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
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
          console.warn("Предупреждение: Запись пользователя в таблице 'users' еще не создана.")
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
          const { error: upsertError } = await supabase
            .from('user_settings')
            .upsert(
              { user_id: user.id, theme: fallbackTheme, status_text: '' }, 
              { onConflict: 'user_id' }
            )
          
          if (upsertError) {
            console.error('Ошибка инициализации настроек в БД:', upsertError.message)
          }

          if (isMounted.current) {
            setTheme(fallbackTheme)
            setStatusText('')
          }
        }
      } catch (err) {
        console.error('Ошибка инициализации данных приложения:', err)
      }
    }

    fetchUserDataAndSettings()

    return () => {
      isMounted.current = false
    }
  }, [navigate])

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)

    if (!userIdRef.current || !isProfileLoaded) {
      console.warn("Сохранение темы в БД отложено: профиль еще не подтвержден.")
      return
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: userIdRef.current, theme: nextTheme }, { onConflict: 'user_id' })

    if (error) {
      console.error('Ошибка сохранения темы в БД:', error.message)
      if (isMounted.current) setTheme(theme)
    }
  }

  const handleSaveStatus = async () => {
    if (!userIdRef.current || !isProfileLoaded) {
      console.error("Невозможно сохранить статус: отсутствует запись в таблице 'users'")
      return
    }

    setSavingStatus(true)
    const cleanStatus = statusText.trim().slice(0, 80)

    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: userIdRef.current, status_text: cleanStatus, theme }, { onConflict: 'user_id' })

    if (!isMounted.current) return
    setSavingStatus(false)

    if (error) {
      console.error('Ошибка сохранения статуса:', error.message)
      return
    }

    setStatusText(cleanStatus)
    setShowStatusInput(false)
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Ошибка при выходе:', err)
    } finally {
      navigate('/login')
    }
  }

  const avatarLetter = userProfile?.username ? userProfile.username[0].toUpperCase() : '?'
  const profileName = userProfile?.username || userProfile?.email || 'Мой профиль'

  return (
    <div className="h-dvh w-screen flex flex-col-reverse sm:flex-row overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 text-slate-900 dark:from-zinc-950 dark:to-zinc-900/20 dark:text-slate-100 font-sans transition-colors duration-300">

      <aside className="h-16 sm:h-full w-full sm:w-20 flex sm:flex-col items-center justify-between px-6 sm:px-0 sm:py-6 border-t sm:border-t-0 sm:border-r border-slate-200/80 dark:border-zinc-900/80 bg-white/80 dark:bg-zinc-950/40 backdrop-blur-md flex-shrink-0 z-20 transition-colors duration-300">
        
        <div className="flex sm:flex-col gap-5 sm:gap-6 items-center w-full justify-start sm:justify-start">
          <button className="relative cursor-pointer" onClick={() => setShowStatusInput(!showStatusInput)} title="Изменить статус" aria-label="Изменить статус">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-red to-rose-500 text-white flex items-center justify-center font-bold border border-rose-400/10 shadow-md shadow-brand-red/10 transition-all hover:scale-105 active:scale-95">
              {avatarLetter}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950 shadow-sm animate-pulse" />
          </button>

          <button className="p-2.5 rounded-xl text-brand-red bg-rose-500/10 dark:bg-rose-500/10 border border-rose-500/20 sm:w-12 sm:h-12 flex items-center justify-center transition-all shadow-sm shadow-brand-red/5" title="Чаты" aria-label="Чаты">
            <Icon name="chat" className="w-5 h-5" />
          </button>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-brand-red hover:bg-rose-500/10 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 sm:w-12 sm:h-12 flex items-center justify-center transition-all active:scale-95"
            title="Выйти из аккаунта"
            aria-label="Выйти из аккаунта"
          >
            <Icon name="logout" className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-800/60 transition-all text-base shadow-sm active:scale-95 sm:w-12 sm:h-12 flex items-center justify-center text-slate-600 dark:text-zinc-400"
          title={theme === 'dark' ? 'Включить светлую тему' : 'Включить темную тему'}
          aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить темную тему'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-5 h-5" />
        </button>
      </aside>

      {showStatusInput && (
        <>
          <button className="fixed inset-0 Brab-overlay z-30 bg-black/10 dark:bg-black/30 backdrop-blur-xs cursor-default transition-all" onClick={() => setShowStatusInput(false)} aria-label="Закрыть настройки статуса" />
          <div className="fixed sm:absolute left-4 right-4 bottom-20 sm:bottom-auto sm:right-auto sm:top-18 sm:left-24 z-40 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xl shadow-black/5 dark:shadow-black/30 sm:w-72 animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-left-4 duration-200">
            <p className="mb-3 text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">{profileName}</p>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Твой текущий статус</label>
            <input
              type="text"
              value={statusText}
              disabled={!isProfileLoaded}
              onChange={(event) => setStatusText(event.target.value)}
              maxLength={80}
              placeholder={isProfileLoaded ? "Что у тебя нового?" : "Профиль создается..."}
              className="w-full p-2.5 mb-3 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-red/50 focus:bg-white dark:focus:bg-zinc-900 transition-all disabled:opacity-50"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowStatusInput(false)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">Отмена</button>
              <button onClick={handleSaveStatus} disabled={savingStatus || !isProfileLoaded} className="text-xs px-3 py-1.5 rounded-lg bg-brand-red text-white font-medium hover:bg-brand-redHover disabled:opacity-60 transition-colors shadow-md shadow-brand-red/10">
                {savingStatus ? 'Сохраняю...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </>
      )}

      <main className="flex-1 flex overflow-hidden relative z-10 bg-transparent h-[calc(100vh-4rem)] sm:h-full">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout