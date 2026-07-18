import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 
import { Icon } from '../ui/Icon';

export const Settings = ({ onBack }) => {
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
      .from('chat-assets') // Название вашего бакета в Supabase Storage
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
      // 1. Загружаем аватар, если файл изменен
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
    <section className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-950 h-full w-full min-w-0">
      <header className="h-16 border-b border-slate-200 dark:border-zinc-900 px-4 sm:px-6 flex items-center gap-3 bg-white dark:bg-zinc-900 flex-shrink-0 z-10">
        <button 
          onClick={onBack}
          className="flex items-center justify-center p-2 -ml-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 transition-all"
          aria-label="Назад к чатам"
        >
          <Icon name="back" className="w-5 h-5" /> 
        </button>
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Профиль</h2>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Управление вашими персональными данными</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
        <form onSubmit={handleSaveSettings} className="max-w-xl mx-auto space-y-6">
          {message.text && (
            <div className={`p-3.5 rounded-xl border text-xs font-semibold ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}>
              {message.text}
            </div>
          )}

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-5 shadow-xs">
            <div className="relative group w-20 h-20 shrink-0">
              {avatarPreview || avatarUrl ? (
                <img 
                  src={avatarPreview || avatarUrl} 
                  alt="Avatar preview" 
                  className="w-full h-full object-cover rounded-2xl border border-slate-200 dark:border-zinc-800"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-brand-red to-rose-500 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-brand-red/10">
                  {getInitial()}
                </div>
              )}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-all duration-200 backdrop-blur-xs">
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
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Фото профиля</h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                Поддерживаются форматы JPG, PNG. Рекомендуется квадратное разрешение.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-5 rounded-2xl space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Основная информация</h3>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Email (только чтение)</label>
              <input 
                type="email" 
                value={email} 
                disabled 
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 outline-none text-slate-400 dark:text-zinc-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Отображаемое имя</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ваш никнейм"
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 focus:border-brand-red/40 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-5 rounded-2xl space-y-4 shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Безопасность</h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Оставьте поля пустыми, если не хотите менять пароль</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Новый пароль</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 focus:border-brand-red/40 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wide">Повторите пароль</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 focus:border-brand-red/40 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-brand-red hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm shadow-brand-red/10 cursor-pointer"
            >
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>

        </form>
      </div>
    </section>
  );
};