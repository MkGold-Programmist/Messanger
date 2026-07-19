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
  const [hasAvatarImageError, setHasAvatarImageError] = useState(false);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email || '');
          
          const { data: dbUser } = await supabase
            .from('users')
            .select('username')
            .eq('id', user.id)
            .maybeSingle();

          setUsername(dbUser?.username || user.user_metadata?.username || '');
          
          const { data: settings } = await supabase
            .from('user_settings')
            .select('avatar_url')
            .eq('user_id', user.id)
            .maybeSingle();

          if (settings?.avatar_url) {
            setAvatarUrl(settings.avatar_url);
          } else {
            setAvatarUrl(user.user_metadata?.avatar_url || '');
          }
        }
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    getUserData();

    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Размер файла не должен превышать 2 МБ' });
        return;
      }
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setHasAvatarImageError(false);
    }
  };

  const uploadAvatar = async (userId) => {
    if (!avatarFile) return avatarUrl;
    
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('chat-assets') 
      .upload(filePath, avatarFile, { upsert: true, cacheControl: '0' });
  
    if (uploadError) throw uploadError;
  
    const tenYearsInSeconds = 10 * 365 * 24 * 60 * 60;
    const { data, error: signError } = await supabase.storage
      .from('chat-assets')
      .createSignedUrl(filePath, tenYearsInSeconds);

    if (signError) throw signError;
    
    return data.signedUrl;
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Пользователь не авторизован');

      const isPasswordTargeted = password.length > 0 || confirmPassword.length > 0;

      if (isPasswordTargeted) {
        if (password.length < 6) {
          throw new Error('Новый пароль должен быть не менее 6 символов');
        }
        if (password !== confirmPassword) {
          throw new Error('Введенные пароли не совпадают');
        }
      }

      let finalAvatarUrl = avatarUrl;
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(user.id);
        
        try {
          const urlObj = new URL(uploadedUrl);
          urlObj.searchParams.set('t', Date.now().toString());
          finalAvatarUrl = urlObj.toString();
        } catch {
          finalAvatarUrl = uploadedUrl;
        }
      }

      const cleanUsername = username.trim();

      const { error: updateDbError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          username: cleanUsername,
          email: user.email
        }, { onConflict: 'id' });

      if (updateDbError) throw updateDbError;

      const { error: upsertSettingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          avatar_url: finalAvatarUrl
        }, { onConflict: 'user_id' });

      if (upsertSettingsError) throw upsertSettingsError;

      const updates = {
        data: { 
          username: cleanUsername,
          avatar_url: finalAvatarUrl
        }
      };

      if (isPasswordTargeted) {
        updates.password = password;
      }

      const { error: updateAuthError } = await supabase.auth.updateUser(updates);
      if (updateAuthError) throw updateAuthError;

      await supabase.auth.refreshSession();

      setAvatarUrl(finalAvatarUrl);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview('');
      setAvatarFile(null);
      setHasAvatarImageError(false);
      setPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Профиль успешно сохранен!' });
      
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
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] dark:bg-[#09090B]">
        <div className="w-8 h-8 border-2 border-[#E11D48] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentDisplayAvatar = avatarPreview || avatarUrl;

  return (
    <section className="flex-1 flex flex-col bg-[#FAFAFA] dark:bg-[#09090B] h-full w-full min-w-0 transition-colors duration-300">

      <header className="h-14 border-b border-[#E11D48]/10 dark:border-[#18181B] px-4 flex items-center gap-3 bg-[#FFFFFF]/80 dark:bg-[#18181B]/80 backdrop-blur-md flex-shrink-0 z-10 sticky top-0">
        <button 
          type="button"
          onClick={onBack}
          className="flex items-center justify-center p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-[#FAFAFA] dark:hover:bg-[#09090B] hover:text-[#E11D48] active:scale-95 transition-all cursor-pointer"
          aria-label="Назад"
        >
          <Icon name="back" className="w-5 h-5" /> 
        </button>
        <div>
          <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-[#FFFFFF]">Настройки</h2>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">Конфигурация учетной записи</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl w-full mx-auto space-y-5">
 
        {message.text && (
          <div className={`p-3.5 rounded-xl border text-xs font-semibold transition-all duration-300 animate-fade-in ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
              : 'bg-[#E11D48]/10 border-[#E11D48]/20 text-[#E11D48]'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-5" autoComplete="off">

          <div className="bg-[#FFFFFF] dark:bg-[#18181B] border border-[#E11D48]/5 dark:border-[#18181B] rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden shadow-xs">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-transparent" />
            
            <div className="relative w-24 h-24 select-none mb-3">
              {currentDisplayAvatar && !hasAvatarImageError ? (
                <img 
                  src={currentDisplayAvatar} 
                  alt="Аватар" 
                  className="w-full h-full object-cover rounded-full ring-4 ring-[#FAFAFA] dark:ring-[#09090B] transition-transform duration-300"
                  onError={() => setHasAvatarImageError(true)}
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-b from-[#E11D48] to-[#BE123C] text-[#FFFFFF] font-black text-3xl flex items-center justify-center shadow-lg ring-4 ring-[#FAFAFA] dark:ring-[#09090B]">
                  {getInitial()}
                </div>
              )}
              
              <label className="absolute bottom-0 right-0 bg-[#E11D48] hover:bg-[#BE123C] text-[#FFFFFF] p-2 rounded-full cursor-pointer shadow-md transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-[#FFFFFF] dark:border-[#18181B] flex items-center justify-center">
                <Icon name="camera" className="w-4 h-4" />
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                />
              </label>
            </div>

            <h3 className="text-sm font-bold text-zinc-800 dark:text-[#FFFFFF]">{username || 'Пользователь'}</h3>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-mono">{email}</p>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#18181B] border border-[#E11D48]/5 dark:border-[#18181B] p-5 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/40 pb-2.5 mb-1">
              <span className="text-[#E11D48]"><Icon name="user" className="w-4 h-4" /></span>
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Личные данные</h4>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">Зарегистрированный Email</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-zinc-400 dark:text-zinc-600"><Icon name="mail" className="w-4 h-4" /></span>
                  <input 
                    type="email" 
                    value={email} 
                    disabled 
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-[#FAFAFA] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800/80 outline-none text-zinc-400 dark:text-zinc-600 cursor-not-allowed font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">Имя пользователя (Никнейм)</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите никнейм"
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAFAFA] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 focus:border-[#E11D48] dark:focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10 outline-none transition-all text-zinc-900 dark:text-[#FFFFFF] font-medium"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#18181B] border border-[#E11D48]/5 dark:border-[#18181B] p-5 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/40 pb-2.5 mb-1">
              <span className="text-[#E11D48]"><Icon name="lock" className="w-4 h-4" /></span>
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Безопасность</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">Новый пароль</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Оставьте пустым"
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAFAFA] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 focus:border-[#E11D48] dark:focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10 outline-none transition-all text-zinc-900 dark:text-[#FFFFFF] font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">Подтверждение</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Оставьте пустым"
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAFAFA] dark:bg-[#09090B] border border-zinc-200 dark:border-zinc-800 focus:border-[#E11D48] dark:focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/10 outline-none transition-all text-zinc-900 dark:text-[#FFFFFF] font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#E11D48] to-[#BE123C] hover:from-[#BE123C] hover:to-[#E11D48] text-[#FFFFFF] font-bold rounded-xl text-xs transition-all active:scale-98 shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center min-w-[145px]"
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