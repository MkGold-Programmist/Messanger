import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 

const ICON_PATHS = {
  back: <path d="M19 12H5M12 19l-7-7 7-7" />,
  camera: (
    <g>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </g>
  ),
  user: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
  lock: (
    <g>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </g>
  ),
  mail: (
    <g>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </g>
  )
};

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
);

const Settings = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email || '');
          setUsername(user.user_metadata?.username || '');
          setAvatarUrl(user.user_metadata?.avatar_url || '');
        }
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    getUserData();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Размер файла не должен превышать 2 МБ' });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (userId) => {
    if (!avatarFile) return avatarUrl;
    
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-assets') 
      .upload(filePath, avatarFile, { upsert: true, cacheControl: '3600' });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('chat-assets').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Пользователь не авторизован');

      // Пароль проверяется только если пользователь начал его вводить
      if (password && password.length < 6) {
        throw new Error('Новый пароль должен быть не менее 6 символов');
      }

      if (password && password !== confirmPassword) {
        throw new Error('Введенные пароли не совпадают');
      }

      let finalAvatarUrl = avatarUrl;
      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar(user.id);
      }

      const cleanUsername = username.trim();

      // 1. Обновляем Auth метаданные (для сессии)
      const updates = {
        data: { 
          username: cleanUsername,
          avatar_url: finalAvatarUrl
        }
      };

      if (password) {
        updates.password = password;
      }

      const { error: updateAuthError } = await supabase.auth.updateUser(updates);
      if (updateAuthError) throw updateAuthError;

      // 2. Синхронизируем изменения с публичной таблицей users для реактивности приложения
      const { error: updateDbError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          username: cleanUsername,
          email: user.email,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (updateDbError) throw updateDbError;

      setAvatarUrl(finalAvatarUrl);
      setAvatarFile(null);
      setPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Профиль успешно сохранен' });
      
      // Автоматически скрываем уведомление через 4 секунды
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);

    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Произошла непредвиденная ошибка' });
    } finally {
      setLoading(false);
    }
  };

  const getInitial = () => (username?.trim()?.[0] || email?.trim()?.[0] || '?').toUpperCase();

  if (initialLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <section className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-950 h-full w-full min-w-0 transition-colors duration-300">
      
      {/* Шапка Telegram-Style */}
      <header className="h-14 border-b border-slate-200/60 dark:border-zinc-900/80 px-4 flex items-center gap-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex-shrink-0 z-10 sticky top-0">
        <button 
          onClick={onBack}
          className="flex items-center justify-center p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 active:scale-95 transition-all cursor-pointer"
          aria-label="Назад к чатам"
        >
          <Icon name="back" className="w-5 h-5" /> 
        </button>
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Настройки</h2>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Изменение личных данных профиля</p>
        </div>
      </header>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl w-full mx-auto space-y-5">
        
        {/* Всплывающие уведомления */}
        {message.text && (
          <div className={`p-3.5 rounded-xl border text-xs font-medium transition-all duration-300 animate-fade-in ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-5">
          
          {/* Секция 1: Профессиональный Telegram-Аватар */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-900 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden shadow-xs">
            <div className="relative w-24 h-24 select-none mb-3">
              {avatarPreview || avatarUrl ? (
                <img 
                  src={avatarPreview || avatarUrl} 
                  alt="Аватар профиля" 
                  className="w-full h-full object-cover rounded-full ring-4 ring-slate-100 dark:ring-zinc-800 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-bold text-3xl flex items-center justify-center shadow-md ring-4 ring-slate-100 dark:ring-zinc-800">
                  {getInitial()}
                </div>
              )}
              
              {/* Парящая круглая кнопка изменения фото */}
              <label className="absolute bottom-0 right-0 bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-full cursor-pointer shadow-lg transition-all duration-200 hover:scale-110 active:scale-90 border-2 border-white dark:border-zinc-900 flex items-center justify-center">
                <Icon name="camera" className="w-4 h-4" />
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                />
              </label>
            </div>

            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{username || 'Пользователь'}</h3>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">{email}</p>
          </div>

          {/* Секция 2: Основная информация */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-900 p-5 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-2 mb-1">
              <span className="text-sky-500 dark:text-sky-400"><Icon name="user" className="w-4 h-4" /></span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-400">Личные данные</h4>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Зарегистрированный Email</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 dark:text-zinc-600"><Icon name="mail" className="w-4 h-4" /></span>
                  <input 
                    type="email" 
                    value={email} 
                    disabled 
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/80 outline-none text-slate-400 dark:text-zinc-600 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Имя пользователя (Никнейм)</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите имя пользователя"
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 focus:border-sky-500 dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all text-slate-900 dark:text-zinc-100 font-medium placeholder-slate-400 dark:placeholder-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Секция 3: Безопасность */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-900 p-5 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-2 mb-1">
              <span className="text-sky-500 dark:text-sky-400"><Icon name="lock" className="w-4 h-4" /></span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-400">Безопасность</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Новый пароль (Необязательно)</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Оставьте пустым"
                  minLength={6}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 focus:border-sky-500 dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all text-slate-900 dark:text-zinc-100 font-medium placeholder-slate-400 dark:placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Подтверждение пароля</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Оставьте пустым"
                  minLength={6}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 focus:border-sky-500 dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all text-slate-900 dark:text-zinc-100 font-medium placeholder-slate-400 dark:placeholder-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Кнопка отправки */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-xl text-xs transition-all active:scale-98 shadow-md hover:opacity-95 disabled:opacity-50 cursor-pointer flex items-center justify-center min-w-[140px]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Сохранить изменения'
              )}
            </button>
          </div>

        </form>
      </div>
    </section>
  );
};

export default Settings;