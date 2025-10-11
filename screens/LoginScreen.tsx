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
      <div className="h-screen w-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700">
            <FootballIcon />
          </div>
          <h1 className="text-4xl font-bold mt-4">Kickora</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Восстановление пароля</p>
        </div>

        <div className="mt-10 w-full max-w-sm">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6">{t('restorePassword')}</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t('emailAddress')}</label>
                <input
                  type="email"
                  id="reset-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              {error && <p className="text-red-500 text-xs text-center pt-2">{error}</p>}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:bg-indigo-400"
              >
                {loading ? <LoadingSpinner /> : t('sendResetEmail')}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <button onClick={() => setShowForgotPassword(false)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              {t('backToLogin')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700">
            <FootballIcon />
        </div>
        <h1 className="text-4xl font-bold mt-4">Kickora</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{t('welcomeMessage')}</p>
      </div>

      <div className="mt-10 w-full max-w-sm">
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6">{isLoginView ? t('login') : t('signUp')}</h2>
            
            {/* Методы входа */}
            {isLoginView && (
              <div className="mb-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setLoginMethod('email')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      loginMethod === 'email' 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => setLoginMethod('phone')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      loginMethod === 'phone' 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Телефон
                  </button>
                  <button
                    onClick={() => setLoginMethod('userId')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      loginMethod === 'userId' 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
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
                    <label htmlFor="email" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t('emailAddress')}</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                  </div>
                )}
                
                {loginMethod === 'phone' && (
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t('phoneNumber')}</label>
                    <input
                        type="tel"
                        id="phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="+7 (999) 123-45-67"
                        required
                    />
                  </div>
                )}
                
                {loginMethod === 'userId' && (
                  <div>
                    <label htmlFor="userId" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t('userId')}</label>
                    <input
                        type="text"
                        id="userId"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="user123"
                        required
                    />
                  </div>
                )}
                
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t('password')}</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                        minLength={6}
                    />
                </div>
                
                {!isLoginView && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t('confirmPassword')}</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                        minLength={6}
                    />
                  </div>
                )}
                
                {error && <p className="text-red-500 text-xs text-center pt-2">{error}</p>}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:bg-indigo-400"
                >
                    {loading ? <LoadingSpinner /> : (isLoginView ? t('login') : t('signUp'))}
                </button>
            </form>
            
            {/* Google авторизация */}
            <div className="mt-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 flex items-center justify-center disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
{t('signInWithGoogle')}
              </button>
            </div>
        </div>

        <div className="mt-6 text-center">
            <button onClick={() => setIsLoginView(!isLoginView)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                {isLoginView ? t('dontHaveAccount') : t('alreadyHaveAccount')}
            </button>
        </div>
        
        {isLoginView && (
          <div className="mt-4 text-center">
            <button onClick={() => setShowForgotPassword(true)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              {t('forgotPassword')}
            </button>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
          {t('termsOfService')}
        </p>
      </div>
    </div>
  );
};