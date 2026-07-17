import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const Register = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
        data: { username: cleanUsername },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data?.user) {
      const { error: dbError } = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          username: cleanUsername,
          email: cleanEmail,
          theme_preference: localStorage.getItem('theme') || 'dark',
        }, { onConflict: 'id' })

      if (dbError) {
        setError(dbError.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    navigate('/')
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
              autoComplete="nickname"
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
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800/50 border border-transparent focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 outline-none transition-all text-sm font-medium"
            />
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
