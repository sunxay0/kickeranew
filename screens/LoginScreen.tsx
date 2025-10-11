import React, { useState } from 'react';
import { FootballIcon, LoadingSpinner } from '../components/icons';
import { auth } from '../firebase';
import { useSettings } from '../contexts/SettingsContext';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';

export const LoginScreen: React.FC = () => {
  const { t } = useSettings();
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userId, setUserId] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone' | 'userId'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const translateFirebaseError = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return t('invalidEmailError');
      case 'auth/user-not-found':
        return t('userNotFoundError');
      case 'auth/wrong-password':
        return t('wrongPasswordError');
      case 'auth/email-already-in-use':
        return t('emailInUseError');
      case 'auth/weak-password':
        return t('weakPasswordError');
      case 'auth/operation-not-allowed':
        return t('authOperationNotAllowed');
      default:
        return t('genericAuthError');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(translateFirebaseError(err.code));
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Введите email для восстановления пароля');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Письмо для восстановления пароля отправлено на ваш email');
    } catch (err: any) {
      setError(translateFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLoginView) {
        if (loginMethod === 'email') {
          await signInWithEmailAndPassword(auth, email, password);
        } else if (loginMethod === 'phone') {
          // Для входа по номеру телефона нужно использовать phoneAuth
          setError('Вход по номеру телефона временно недоступен');
          setLoading(false);
          return;
        } else if (loginMethod === 'userId') {
          // Для входа по userID нужно найти пользователя в базе данных
          setError('Вход по ID пользователя временно недоступен');
          setLoading(false);
          return;
        }
      } else {
        if (password !== confirmPassword) {
          setError('Пароли не совпадают');
          setLoading(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // On success, onAuthStateChanged in App.tsx will handle the rest.
    } catch (err: any) {
      setError(translateFirebaseError(err.code));
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
              <span className="text-white text-3xl font-bold">⚽</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">Kickora</h1>
            <p className="text-white/80 text-lg">Восстановление пароля</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-center mb-6 text-white">{t('restorePassword')}</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }} className="space-y-6">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-white/80 mb-2">{t('emailAddress')}</label>
                <input
                  type="email"
                  id="reset-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 transition-all duration-300"
                  placeholder="example@email.com"
                  required
                />
              </div>
              
              {error && <p className="text-red-300 text-sm text-center pt-2 bg-red-500/20 rounded-lg p-2">{error}</p>}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center disabled:opacity-50 disabled:transform-none"
              >
                {loading ? <LoadingSpinner /> : t('sendResetEmail')}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <button onClick={() => setShowForgotPassword(false)} className="text-sm text-white/80 hover:text-white transition-colors duration-300">
              {t('backToLogin')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300">
            <span className="text-white text-3xl font-bold">⚽</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
            Kickora
          </h1>
          <p className="text-white/80 text-lg">
            {t('welcomeMessage')}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-center mb-6 text-white">{isLoginView ? t('login') : t('signUp')}</h2>
            
            {/* Методы входа */}
            {isLoginView && (
              <div className="mb-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setLoginMethod('email')}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                      loginMethod === 'email' 
                        ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm' 
                        : 'bg-white/10 text-white/70 hover:bg-white/15'
                    }`}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => setLoginMethod('phone')}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                      loginMethod === 'phone' 
                        ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm' 
                        : 'bg-white/10 text-white/70 hover:bg-white/15'
                    }`}
                  >
                    Телефон
                  </button>
                  <button
                    onClick={() => setLoginMethod('userId')}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                      loginMethod === 'userId' 
                        ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm' 
                        : 'bg-white/10 text-white/70 hover:bg-white/15'
                    }`}
                  >
                    ID
                  </button>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {loginMethod === 'email' && (
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">{t('emailAddress')}</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 transition-all duration-300"
                        placeholder="example@email.com"
                        required
                    />
                  </div>
                )}
                
                {loginMethod === 'phone' && (
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-2">{t('phoneNumber')}</label>
                    <input
                        type="tel"
                        id="phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 transition-all duration-300"
                        placeholder="+7 (999) 123-45-67"
                        required
                    />
                  </div>
                )}
                
                {loginMethod === 'userId' && (
                  <div>
                    <label htmlFor="userId" className="block text-sm font-medium text-white/80 mb-2">{t('userId')}</label>
                    <input
                        type="text"
                        id="userId"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 transition-all duration-300"
                        placeholder="user123"
                        required
                    />
                  </div>
                )}
                
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">{t('password')}</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 transition-all duration-300"
                        placeholder="••••••••"
                        required
                        minLength={6}
                    />
                </div>
                
                {!isLoginView && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">{t('confirmPassword')}</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 transition-all duration-300"
                        placeholder="••••••••"
                        required
                        minLength={6}
                    />
                  </div>
                )}
                
                {error && <p className="text-red-300 text-sm text-center pt-2 bg-red-500/20 rounded-lg p-2">{error}</p>}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center disabled:opacity-50 disabled:transform-none"
                >
                    {loading ? <LoadingSpinner /> : (isLoginView ? t('login') : t('signUp'))}
                </button>
            </form>
            
            {/* Google авторизация */}
            <div className="mt-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-4 px-6 rounded-xl border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('signInWithGoogle')}
              </button>
            </div>
        </div>

        <div className="mt-8 text-center space-y-3">
            <button onClick={() => setIsLoginView(!isLoginView)} className="text-sm text-white/80 hover:text-white transition-colors duration-300">
                {isLoginView ? t('dontHaveAccount') : t('alreadyHaveAccount')}
            </button>
            
            {isLoginView && (
              <div>
                <button onClick={() => setShowForgotPassword(true)} className="text-sm text-white/80 hover:text-white transition-colors duration-300">
                  {t('forgotPassword')}
                </button>
              </div>
            )}
        </div>

        <p className="mt-8 text-center text-xs text-white/60">
          {t('termsOfService')}
        </p>
      </div>
    </div>
  );
};