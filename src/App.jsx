import React, { useEffect, useMemo, useState } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Home from './pages/Home'
import Layout from './Layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import { ChatProvider } from './context/ChatContext'

const ProtectedRoute = ({ children, session }) => {
  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}

const App = () => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setSession(session)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const router = useMemo(() => createBrowserRouter([
    {
      path: '/',
      element: (
        <ProtectedRoute session={session}>
          {/* Оборачиваем Layout и все его дочерние элементы (включая Home) в ChatProvider */}
          <ChatProvider>
            <Layout />
          </ChatProvider>
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <Home />,
        },
      ],
    },
    {
      path: '/login',
      element: session ? <Navigate to="/" replace /> : <Login />,
    },
    {
      path: '/register',
      element: session ? <Navigate to="/" replace /> : <Register />,
    },
    {
      path: '*',
      element: <Navigate to={session ? '/' : '/login'} replace />,
    },
  ]), [session])

  if (loading) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Загрузка</p>
        </div>
      </div>
    )
  }

  return <RouterProvider router={router} />
}

export default App