
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
    <div className="h-full w-full flex flex-col">
      {/* Категории */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            selectedCategory === 'all' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Все
        </button>
        <button
          onClick={() => setSelectedCategory('friends')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            selectedCategory === 'friends' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Друзья
        </button>
        <button
          onClick={() => setSelectedCategory('fields')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            selectedCategory === 'fields' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Поля
        </button>
        <button
          onClick={() => setSelectedCategory('tournaments')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            selectedCategory === 'tournaments' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Турниры
        </button>
        <button
          onClick={() => setSelectedCategory('professional')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            selectedCategory === 'professional' 
              ? 'text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Профи
        </button>
      </div>

      {/* Лента новостей */}
      <div className="flex-1 overflow-y-auto">
        {getCategoryItems().map(item => (
          <div key={item.id} className="border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start gap-3">
              {item.author && (
                <img 
                  src={item.author.avatar} 
                  alt={item.author.name}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getItemIcon(item.type)}
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{item.content}</p>
                {item.image && (
                  <img 
                    src={item.image} 
                    alt="News image"
                    className="w-full h-48 object-cover rounded-lg mb-2"
                  />
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{item.timestamp}</span>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleLike(item.id)}
                      className={`flex items-center gap-1 hover:text-indigo-600 ${
                        item.isLiked ? 'text-indigo-600' : 'text-gray-500'
                      }`}
                    >
                      <HeartIcon filled={item.isLiked} className="w-4 h-4" />
                      {item.likes}
                    </button>
                    <button className="flex items-center gap-1 hover:text-indigo-600 text-gray-500">
                      <ChatBubbleIcon className="w-4 h-4" />
                      {item.comments}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {getCategoryItems().length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <HeartIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Нет новостей
            </h3>
            <p className="text-gray-400 dark:text-gray-500">
              В этой категории пока нет новостей
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
