
import React, { useState, useEffect } from 'react';
import { Player, Field } from '../types';
import { HeartIcon, ChatBubbleIcon, TrophyIcon, StarIcon, UsersIcon, MapIcon } from '../components/icons';
import { useSettings } from '../contexts/SettingsContext';

interface NewsItem {
  id: string;
  type: 'friend_activity' | 'field_news' | 'tournament' | 'achievement' | 'professional_news';
  title: string;
  content: string;
  author?: Player;
  field?: Field;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  image?: string;
}

interface NewsFeedScreenProps {
  user?: Player;
}

export const NewsFeedScreen: React.FC<NewsFeedScreenProps> = ({ user }) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'friends' | 'fields' | 'tournaments' | 'professional'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useSettings();

  useEffect(() => {
    // Симуляция загрузки новостей
    const loadNews = async () => {
      setIsLoading(true);
      
      // Генерируем моковые данные
      const mockNews: NewsItem[] = [
        {
          id: '1',
          type: 'friend_activity',
          title: 'Алексей присоединился к игре',
          content: 'Алексей присоединился к игре на поле "Центральный стадион"',
          author: {
            id: 'friend1',
            name: 'Алексей Петров',
            handle: 'alexey',
            email: 'alexey@example.com',
            avatar: 'https://i.pravatar.cc/150?u=alexey',
            joinDate: '2024-01-15',
            stats: { gamesPlayed: 25, fieldsVisited: 8, reviewsLeft: 12 },
            authProvider: 'email',
            favoriteFields: [],
            friends: [],
            friendRequestsSent: [],
            friendRequestsReceived: [],
            currentFieldId: null
          },
          timestamp: '2 часа назад',
          likes: 5,
          comments: 2,
          isLiked: false
        },
        {
          id: '2',
          type: 'field_news',
          title: 'Новый турнир на поле "Спартак"',
          content: 'Объявлен турнир 5x5 на поле "Спартак". Призовой фонд: 10,000 рублей',
          field: {
            id: 1,
            name: 'Спартак',
            lat: 55.7558,
            lng: 37.6173,
            photo: 'https://source.unsplash.com/800x600/?soccer,stadium',
            rating: 4.5,
            status: 'available',
            surface: 'grass',
            hasLighting: true,
            players: [],
            reviews: [],
            chat: []
          },
          timestamp: '4 часа назад',
          likes: 12,
          comments: 8,
          isLiked: true,
          image: 'https://source.unsplash.com/800x400/?tournament,soccer'
        },
        {
          id: '3',
          type: 'achievement',
          title: 'Новое достижение!',
          content: 'Вы получили достижение "Первые 10 игр"',
          timestamp: '1 день назад',
          likes: 3,
          comments: 1,
          isLiked: false
        },
        {
          id: '4',
          type: 'professional_news',
          title: 'Новости российского футбола',
          content: 'Сборная России обыграла команду Бразилии со счетом 2:1',
          timestamp: '2 дня назад',
          likes: 45,
          comments: 23,
          isLiked: false,
          image: 'https://source.unsplash.com/800x400/?football,stadium'
        }
      ];

      setTimeout(() => {
        setNewsItems(mockNews);
        setIsLoading(false);
      }, 1000);
    };

    loadNews();
  }, []);

  const handleLike = (itemId: string) => {
    setNewsItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            isLiked: !item.isLiked, 
            likes: item.isLiked ? item.likes - 1 : item.likes + 1 
          }
        : item
    ));
  };

  const getCategoryItems = () => {
    switch (selectedCategory) {
      case 'friends':
        return newsItems.filter(item => item.type === 'friend_activity');
      case 'fields':
        return newsItems.filter(item => item.type === 'field_news');
      case 'tournaments':
        return newsItems.filter(item => item.type === 'tournament');
      case 'professional':
        return newsItems.filter(item => item.type === 'professional_news');
      default:
        return newsItems;
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'friend_activity':
        return <UsersIcon className="w-5 h-5" />;
      case 'field_news':
        return <MapIcon className="w-5 h-5" />;
      case 'tournament':
        return <TrophyIcon className="w-5 h-5" />;
      case 'achievement':
        return <StarIcon className="w-5 h-5" />;
      default:
        return <HeartIcon className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-500">Загрузка новостей...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Категории */}
      <div className="flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/50 shadow-lg">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex-1 p-4 text-sm font-medium transition-all duration-300 ${
            selectedCategory === 'all' 
              ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
          }`}
        >
          Все
        </button>
        <button
          onClick={() => setSelectedCategory('friends')}
          className={`flex-1 p-4 text-sm font-medium transition-all duration-300 ${
            selectedCategory === 'friends' 
              ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
          }`}
        >
          Друзья
        </button>
        <button
          onClick={() => setSelectedCategory('fields')}
          className={`flex-1 p-4 text-sm font-medium transition-all duration-300 ${
            selectedCategory === 'fields' 
              ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
          }`}
        >
          Поля
        </button>
        <button
          onClick={() => setSelectedCategory('tournaments')}
          className={`flex-1 p-4 text-sm font-medium transition-all duration-300 ${
            selectedCategory === 'tournaments' 
              ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
          }`}
        >
          Турниры
        </button>
        <button
          onClick={() => setSelectedCategory('professional')}
          className={`flex-1 p-4 text-sm font-medium transition-all duration-300 ${
            selectedCategory === 'professional' 
              ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
          }`}
        >
          Профи
        </button>
      </div>

      {/* Лента новостей */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {getCategoryItems().map(item => (
          <div key={item.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-start gap-4">
              {item.author && (
                <div className="relative">
                  <img 
                    src={item.author.avatar} 
                    alt={item.author.name}
                    className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-white dark:border-gray-700 shadow-lg"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white">
                    {getItemIcon(item.type)}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{item.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 leading-relaxed">{item.content}</p>
                {item.image && (
                  <img 
                    src={item.image} 
                    alt="News image"
                    className="w-full h-48 object-cover rounded-xl mb-3 shadow-lg"
                  />
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    {item.timestamp}
                  </span>
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => handleLike(item.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                        item.isLiked 
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
                      }`}
                    >
                      <HeartIcon filled={item.isLiked} className="w-4 h-4" />
                      <span className="font-medium">{item.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300">
                      <ChatBubbleIcon className="w-4 h-4" />
                      <span className="font-medium">{item.comments}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {getCategoryItems().length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <HeartIcon className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-3">
              Нет новостей
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
              В этой категории пока нет новостей. Проверьте другие разделы!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
