import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { languages } from '../translations';
import { XMarkIcon, InfoIcon, ShieldCheckIcon, LifebuoyIcon, EmailIcon, TikTokIcon, InstagramIcon, VKIcon, TelegramIcon, LogoutIcon, YouTubeIcon } from './icons';

interface SettingsPanelProps {
  onClose: () => void;
  onLogout: () => void;
}

const SettingsLinkItem: React.FC<{icon: React.ReactNode, label: string, href: string}> = ({ icon, label, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/80 transition-colors">
        <div className="text-gray-500 dark:text-gray-400">{icon}</div>
        <span className="ml-4 text-sm font-medium">{label}</span>
    </a>
);

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, onLogout }) => {
  const { theme, setTheme, language, setLanguage, t } = useSettings();

  const contacts = [
    { label: 'Email', href: 'mailto:kickera.sup@gmail.com', icon: <EmailIcon /> },
    { label: 'YouTube', href: 'https://youtube.com/@kickera-e3y?si=DE9ZJC3vtPDp9Rdz', icon: <YouTubeIcon /> },
    { label: 'TikTok', href: 'https://www.tiktok.com/@kick.era?_t=ZN-8zwySfGeZC2&_r=1', icon: <TikTokIcon /> },
    { label: 'Instagram', href: 'https://www.instagram.com/kick_era?igsh=M2RqMTR6NnV4bXB3', icon: <InstagramIcon /> },
    { label: 'VKontakte', href: 'https://vk.com/club232815218', icon: <VKIcon /> },
    { label: 'Telegram', href: 'https://t.me/kick_era', icon: <TelegramIcon /> },
  ];

  return (
    <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          <XMarkIcon />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">{t('settings')}</h2>
        
        <div className="space-y-6">
          {/* Language Setting */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('language')}</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {languages.map(({ code, name }) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>

          {/* Theme Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('theme')}</label>
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
              <button 
                onClick={() => setTheme('light')}
                className={`flex-1 p-2 rounded-md text-sm font-semibold transition ${theme === 'light' ? 'bg-indigo-500 text-white shadow' : 'hover:bg-gray-100 dark:hover:bg-gray-600'}`}
              >
                {t('light')}
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`flex-1 p-2 rounded-md text-sm font-semibold transition ${theme === 'dark' ? 'bg-indigo-500 text-white shadow' : 'hover:bg-gray-100 dark:hover:bg-gray-600'}`}
              >
                {t('dark')}
              </button>
            </div>
          </div>
          
           {/* Other Links */}
           <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
               <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-1 mb-2">{t('contacts')}</h3>
               {contacts.map(contact => (
                  <SettingsLinkItem key={contact.label} icon={contact.icon} label={contact.label} href={contact.href} />
               ))}
           </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 font-bold py-3 px-4 rounded-lg transition">
              <LogoutIcon />
              <span>{t('logOut')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};