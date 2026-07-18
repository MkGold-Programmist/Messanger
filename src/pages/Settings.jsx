import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 

const ICON_PATHS = {
  back: <path d="M19 12H5M12 19l-7-7 7-7" />,
  edit: (
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        setUsername(user.user_metadata?.username || '');
        setAvatarUrl(user.user_metadata?.avatar_url || '');
      }
    };
    getUserData();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (userId) => {
    if (!avatarFile) return avatarUrl;
    
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-assets') 
      .upload(filePath, avatarFile, { upsert: true });

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

      if (password && password !== confirmPassword) {
        throw new Error('Пароли не совпадают');
      }

      let finalAvatarUrl = avatarUrl;
      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar(user.id);
      }

      const updates = {
        data: { 
          username: username.trim(),
          avatar_url: finalAvatarUrl
        }
      };

      if (password) {
        updates.password = password;
      }

      const { error: updateError } = await supabase.auth.updateUser(updates);
      if (updateError) throw updateError;

      setAvatarUrl(finalAvatarUrl);
      setPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Настройки успешно обновлены!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Произошла ошибка при сохранении' });
    } finally {
      setLoading(false);
    }
  };

  const getInitial = () => (username?.trim()?.[0] || email?.trim()?.[0] || '?').toUpperCase();

  return (
    <section className="flex-1 flex flex-col bg-slate-100 dark:bg-zinc-950 h-full w-full min-w-0 transition-colors duration-300">
      <header className="h-14 border-b border-slate-200 dark:border-zinc-900 px-4 flex items-center gap-2 bg-white dark:bg-zinc-900 flex-shrink-0 z-10 shadow-xs">
        <button 
          onClick={onBack}
          className="flex items-center justify-center p-2 rounded-full text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
          aria-label="Назад к чатам"
        >
          <Icon name="back" className="w-5 h-5" /> 
        </button>
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">Настройки профиля</h2>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Конфиденциальность и личные данные</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl w-full mx-auto">
        <form onSubmit={handleSaveSettings} className="space-y-4">
    
          {message.text && (
            <div className={`p-3 rounded-xl border text-xs font-medium ${
              message.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400'
            }`}>
              {message.text}
            </div>
          )}

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-5 shadow-xs">
            <div className="relative group w-20 h-20 shrink-0">
              {avatarPreview || avatarUrl ? (
                <img 
                  src={avatarPreview || avatarUrl} 
                  alt="Avatar preview" 
                  className="w-full h-full object-cover rounded-full border border-slate-200 dark:border-zinc-800"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-sm">
                  {getInitial()}
                </div>
              )}
              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-full flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-all duration-200 backdrop-blur-xs">
                <Icon name="edit" className="w-4 h-4 mb-1" />
                <span>ИЗМЕНИТЬ</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                />
              </label>
            </div>
            <div className="text-center sm:text-left min-w-0">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Фото профиля</h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 leading-relaxed">
                Добавьте свое лицо или изображение для идентификации в списке чатов. Поддерживаются форматы JPEG и PNG.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 p-5 rounded-2xl space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-sky-500 dark:text-sky-400 uppercase tracking-wider mb-1">Основная информация</h3>
            
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Email (Регистрационный)</label>
              <input 
                type="email" 
                value={email} 
                disabled 
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 outline-none text-slate-400 dark:text-zinc-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Имя пользователя (Никнейм)</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ваш никнейм"
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-sky-500 dark:focus:border-sky-400 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 p-5 rounded-2xl space-y-4 shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-sky-500 dark:text-sky-400 uppercase tracking-wider">Безопасность учетной записи</h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Заполните поля ниже, только если хотите обновить текущий пароль</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Новый пароль</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-sky-500 dark:focus:border-sky-400 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Подтвердите пароль</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-sky-500 dark:focus:border-sky-400 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-xl text-xs transition-all active:scale-95 shadow-sm hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Сохранение изменений...' : 'Сохранить профиль'}
            </button>
          </div>

        </form>
      </div>
    </section>
  );
};

export default Settings;