import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const Register = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const cleanUsername = username.trim()
    const cleanEmail = email.trim()

    if (cleanUsername.length < 2) {
      setError('Никнейм должен быть хотя бы 2 символа.')
      setLoading(false)
      return
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { 
          username: cleanUsername 
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data?.session) {
      setLoading(false)
      navigate('/')
    } else {
      setLoading(false)
      setError('Регистрация успешна! Проверьте почту для подтверждения аккаунта.')
    }
  }

  return (
    <div className="min-h-dvh w-screen flex items-center justify-center bg-brand-lightBg dark:bg-brand-darkBg text-slate-900 dark:text-slate-100 p-4 transition-colors">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white dark:bg-brand-darkPanel border border-slate-200 dark:border-zinc-800 shadow-2xl shadow-brand-red/5">
        <div className="mb-7 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-brand-red">Messenger</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Создать аккаунт</h1>
          <p className="mt-2 text-sm text-slate-400 dark:text-zinc-500">Регистрация через email.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-500 dark:text-zinc-400">Никнейм</label>
            <input
              type="text"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="parviz_dev"
              autoComplete="username"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800/50 border border-transparent focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 outline-none transition-all text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-500 dark:text-zinc-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@mail.com"
              autoComplete="email"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800/50 border border-transparent focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 outline-none transition-all text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-500 dark:text-zinc-400">Пароль</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full pl-4 pr-12 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800/50 border border-transparent focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 outline-none transition-all text-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors focus:outline-none"
                title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 mt-2 bg-brand-red hover:bg-brand-redHover disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-red/20 active:scale-[0.98]">
            {loading ? 'Создаю...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="text-xs text-center text-slate-400 dark:text-zinc-500 mt-6">
          Уже есть аккаунт? <Link to="/login" className="text-brand-red font-bold hover:underline">Войти</Link>
        </p>
      </div>
    </div>
  )
}

export default Register