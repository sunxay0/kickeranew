import React, { useState, useEffect } from 'react';
import { Player, Field, PlayerCard } from '../types';
import { TrophyIcon, StarIcon, UsersIcon, MapIcon, LoadingSpinner, NewspaperIcon } from '../components/icons';
import { useSettings } from '../contexts/SettingsContext';
import { db } from '../firebase';
import { Tab } from '../components/TabBar';
import type firebase from 'firebase/compat/app';


interface NewsItem {
  id: string;
  type: 'friend_activity' | 'field_news' | 'tournament' | 'achievement' | 'professional_news';
  title: string;
  content: string;
  author?: Player;
  field?: Field;
  timestamp: string;
  image?: string;
  source?: { name: string; url: string };
  url?: string;
}

interface NewsFeedScreenProps {
  user: Player;
  fields: Field[];
  onViewProfile: (player: Player) => void;
  setSelectedField: (field: Field) => void;
  setActiveTab: (tab: Tab) => void;
}

const getRussianPlural = (number: number, titles: [string, string, string]): string => {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
};

const parseNewsDate = (timestamp: string): Date => {
    // Generated timestamps are ISO strings (e.g., "2024-07-28T10:30:00.000Z"), which are parsed correctly.
    // Professional news timestamps are 'YYYY-MM-DD HH:MM:SS' from Moscow (UTC+3), which are not.
    if (timestamp.includes('T') || timestamp.includes('Z')) {
        return new Date(timestamp);
    }
    
    // Manually parse the ambiguous date string as Moscow time.
    const parts = timestamp.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
    if (!parts) {
        return new Date(timestamp); // Best effort fallback
    }
    const [, year, month, day, hour, minute, second] = parts.map(Number);
    // Create a date object from the parts in UTC, adjusting for Moscow timezone (UTC+3)
    const utcTimestamp = Date.UTC(year, month - 1, day, hour - 3, minute, second);
    return new Date(utcTimestamp);
};

const formatTimeAgo = (dateString: string, now: number) => {
    const date = parseNewsDate(dateString);
    if (isNaN(date.getTime())) {
        return "a while ago";
    }

    const seconds = Math.floor((now - date.getTime()) / 1000);

    if (seconds < 60) {
        return "только что";
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} ${getRussianPlural(minutes, ['минуту', 'минуты', 'минут'])} назад`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} ${getRussianPlural(hours, ['час', 'часа', 'часов'])} назад`;
    }
    const days = Math.floor(hours / 24);
    if (days < 30) {
        return `${days} ${getRussianPlural(days, ['день', 'дня', 'дней'])} назад`;
    }
    const months = Math.floor(days / 30);
    if (months < 12) {
        return `${months} ${getRussianPlural(months, ['месяц', 'месяца', 'месяцев'])} назад`;
    }
    const years = Math.floor(days / 365);
    return `${years} ${getRussianPlural(years, ['год', 'года', 'лет'])} назад`;
};


const hydratePlayer = (doc: firebase.firestore.DocumentSnapshot): Player => {
  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name,
    handle: data.handle,
    email: data.email,
    avatar: data.avatar,
    joinDate: data.joinDate,
    stats: { gamesPlayed: 0, fieldsVisited: 0, reviewsLeft: 0, missionPoints: 0, ...(data.stats || {}) },
    authProvider: data.authProvider,
    favoriteFields: data.favoriteFields || [],
    friends: data.friends || [],
    friendRequestsSent: data.friendRequestsSent || [],
    friendRequestsReceived: data.friendRequestsReceived || [],
    currentFieldId: data.currentFieldId !== undefined ? data.currentFieldId : null,
    // FIX: Add missing checkInTime property.
    checkInTime: data.checkInTime || null,
    comments: data.comments || [],
    rating: data.rating || 50,
    level: data.level || 1,
    experience: data.experience || 0,
    achievements: data.achievements || [],
    playerCard: data.playerCard || {
      id: `card-${doc.id}`,
      playerId: doc.id,
      rarity: 'bronze',
      overallRating: data.rating || 50,
      characteristics: {
        speed: 50,
        shooting: 50,
        passing: 50,
        defending: 50,
        stamina: 50,
        technique: 50
      },
      specialAbilities: [],
      isSpecial: false
    },
    completedMissions: data.completedMissions || [],
  };
};


export const NewsFeedScreen: React.FC<NewsFeedScreenProps> = ({ user, fields, onViewProfile, setSelectedField, setActiveTab }) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'friends' | 'fields' | 'professional'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useSettings();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 60000); // update every minute
    return () => clearInterval(intervalId);
  }, []);


  useEffect(() => {
    const loadNews = async () => {
      setIsLoading(true);
      setError(null);
      
      const generatedNews: NewsItem[] = [];
      const potentialNewsGenerators = [];

      // Generator 1: Friend checked in
      if (user.friends.length > 0) {
        potentialNewsGenerators.push(async () => {
          const randomFriendId = user.friends[Math.floor(Math.random() * user.friends.length)];
          const friendDoc = await db.collection('users').doc(randomFriendId).get();
          if (friendDoc.exists) {
            const friendData = hydratePlayer(friendDoc);
            if (friendData.currentFieldId) {
              const fieldDoc = await db.collection('fields').doc(String(friendData.currentFieldId)).get();
              if (fieldDoc.exists) {
                const correctField = fieldDoc.data() as Field;
                return {
                  id: `friend-activity-${Date.now()}`,
                  type: 'friend_activity',
                  title: `${friendData.name} присоединился к игре`,
                  content: `на поле`,
                  author: friendData,
                  field: correctField,
                  timestamp: new Date().toISOString()
                };
              }
            }
          }
          return null;
        });
      }

      // Generator 2: New tournament on favorite field
      if (user.favoriteFields && user.favoriteFields.length > 0) {
          potentialNewsGenerators.push(async () => {
              const randomFavId = user.favoriteFields![Math.floor(Math.random() * user.favoriteFields!.length)];
              const fieldDoc = await db.collection('fields').doc(String(randomFavId)).get();
              if (fieldDoc.exists) {
                  const favField = fieldDoc.data() as Field;
                  return {
                      id: `tournament-${Date.now()}`,
                      type: 'tournament',
                      title: 'Новый турнир!',
                      content: `Объявлен турнир 5x5 на поле`,
                      field: favField,
                      timestamp: new Date().toISOString(),
                      image: `https://source.unsplash.com/800x400/?tournament,soccer&sig=${Date.now()}`
                  };
              }
              return null;
          });
      }

      // Execute a few random generators
      const shuffledGenerators = potentialNewsGenerators.sort(() => .5 - Math.random()).slice(0, 2);
      for (const generator of shuffledGenerators) {
          try {
              const newsItem = await generator();
              if (newsItem) {
                  generatedNews.push(newsItem as NewsItem);
              }
          } catch(e) {
              console.warn("Could not generate news item:", e);
          }
      }
      
       // Static achievement news for variety
       generatedNews.push({
        id: 'achievement-static',
        type: 'achievement',
        title: 'Новое достижение!',
        content: 'Вы получили достижение "Первые 10 игр"',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
       });

      try {
        const rssUrl = 'https://www.sports.ru/rss/rubric.xml?s=208';
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
        
        if (!response.ok) throw new Error('Failed to fetch RSS feed');
        const data = await response.json();
        if (data.status !== 'ok') throw new Error(data.message || 'RSS to JSON API error');
        
        const stripHtml = (html: string) => {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            return doc.body.textContent || "";
        }

        const professionalNews: NewsItem[] = data.items.map((item: any): NewsItem => ({
            id: item.guid,
            type: 'professional_news',
            title: item.title,
            content: stripHtml(item.description).substring(0, 200) + '...',
            timestamp: item.pubDate,
            image: item.thumbnail || undefined,
            source: { name: 'sports.ru', url: 'https://www.sports.ru' },
            url: item.link
        }));
        
        setNewsItems([...generatedNews, ...professionalNews].sort((a,b) => parseNewsDate(b.timestamp).getTime() - parseNewsDate(a.timestamp).getTime()));
      } catch (err: any) {
          console.error("Failed to load news via RSS:", err);
          setError('Не удалось загрузить профессиональные новости. Отображается лента активности.');
          setNewsItems(generatedNews.sort((a,b) => parseNewsDate(b.timestamp).getTime() - parseNewsDate(a.timestamp).getTime()));
      } finally {
        setIsLoading(false);
      }
    };

    loadNews();
  }, [user]);

  const handleFieldClick = (field: Field) => {
    setSelectedField(field);
    setActiveTab('map');
  };

  const filteredNews = newsItems.filter(item => {
    switch (selectedCategory) {
      case 'friends': return item.type === 'friend_activity';
      case 'fields': return item.type === 'field_news' || item.type === 'tournament';
      case 'professional': return item.type === 'professional_news';
      default: return true;
    }
  });

  const getItemIcon = (type: NewsItem['type']) => {
    switch (type) {
      case 'friend_activity': return <UsersIcon className="w-5 h-5" />;
      case 'field_news': return <MapIcon className="w-5 h-5" />;
      case 'tournament': return <TrophyIcon className="w-5 h-5" />;
      case 'achievement': return <StarIcon className="w-5 h-5" />;
      case 'professional_news': return <NewspaperIcon className="w-5 h-5" />;
      default: return <UsersIcon className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner className="w-12 h-12 text-indigo-600" />
        <p className="mt-4 text-gray-500">Загрузка новостей...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex space-x-2 px-2">
          {(['all', 'friends', 'fields', 'professional'] as const).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-1 p-3 text-sm font-semibold transition-colors rounded-t-md ${
                selectedCategory === category
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {t(category) || category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {error && (
            <div className="m-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 rounded-lg text-center text-sm">
                {error}
            </div>
        )}
        {filteredNews.map(item => (
          <div key={item.id} className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <div className="flex items-start gap-4">
              {item.author ? (
                <button
                    onClick={() => user.id !== item.author?.id && onViewProfile(item.author)}
                    disabled={user.id === item.author?.id}
                    className="disabled:cursor-default flex-shrink-0"
                >
                    <img src={item.author.avatar} alt={item.author.name} className="w-10 h-10 rounded-full mt-1" />
                </button>
              ) : (
                <div className="w-10 h-10 rounded-full flex-shrink-0 mt-1 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                  {getItemIcon(item.type)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">{item.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {item.author ? (
                            <button 
                                onClick={() => user.id !== item.author?.id && onViewProfile(item.author)}
                                disabled={user.id === item.author?.id}
                                className="font-semibold disabled:cursor-default hover:underline"
                            >
                                {item.author.name}
                            </button>
                          ) : item.source ? <span>{item.source.name}</span> : <span>KickEra News</span>}
                          <span>&middot;</span>
                          <span>{formatTimeAgo(item.timestamp, now)}</span>
                        </div>
                    </div>
                </div>
                
                {item.image && (
                  <img src={item.image} alt={item.title} className="w-full h-48 object-cover rounded-lg my-3 border border-gray-200 dark:border-gray-700" />
                )}
                
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
                  {item.content}
                  {item.field && (
                    <>
                      {' '}
                      <button 
                        onClick={() => handleFieldClick(item.field!)} 
                        className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        "{item.field.name}"
                      </button>
                    </>
                  )}
                </p>

                {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block">
                        Читать далее...
                    </a>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredNews.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <NewspaperIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
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