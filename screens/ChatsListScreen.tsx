import React, { useMemo, useState, useEffect } from 'react';
import { Player, Field, ChatMessage, PlayerCard, DirectChat } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { ChatBubblesIcon, UserIcon, MapIcon } from '../components/icons';

const getRussianPlural = (number: number, titles: [string, string, string]): string => {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
};

const formatTimeAgo = (dateString: string, now: number) => {
    const date = new Date(dateString);
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
    return `${days} ${getRussianPlural(days, ['день', 'дня', 'дней'])} назад`;
};


interface ChatsListScreenProps {
  user: Player;
  fields: Field[];
  directChats: DirectChat[];
  onOpenChat: (field: Field) => void;
  onOpenDirectChat: (user: Player) => void;
}

type ChatItem = {
    type: 'field' | 'direct';
    id: string | number;
    name: string;
    photo: string;
    lastMessage: ChatMessage | null;
    timestamp: number;
    target: Field | Player;
};


export const ChatsListScreen: React.FC<ChatsListScreenProps> = ({ user, fields, directChats, onOpenChat, onOpenDirectChat }) => {
    const { t } = useSettings();
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const intervalId = setInterval(() => setNow(Date.now()), 60000); // update every minute
        return () => clearInterval(intervalId);
    }, []);
    
    const allChats = useMemo(() => {
        // FIX: Replaced `field.chat` with `field.lastMessage` as chat has been moved to a subcollection.
        // The filter now includes fields that have a last message or fields the user is currently checked into.
        const fieldChatItems: ChatItem[] = fields
            .filter(field => field.lastMessage || field.players.some(p => p.id === user.id))
            .map(field => {
                const lastMessage = field.lastMessage ?? null;
                return {
                    type: 'field' as const,
                    target: field,
                    id: field.id,
                    name: field.name,
                    photo: field.photo,
                    lastMessage,
                    timestamp: lastMessage ? new Date(lastMessage.timestamp).getTime() : 0,
                };
            });

        const directChatItems: ChatItem[] = directChats.map(chat => {
            const otherParticipantId = chat.participants.find(p => p !== user.id)!;
            const otherParticipantInfo = chat.participantInfo[otherParticipantId] || { name: 'Unknown User', avatar: '' };
            // Create a partial Player object for the handler. It only needs id, name, and avatar.
            const partner: Player = {
                id: otherParticipantId,
                name: otherParticipantInfo.name,
                avatar: otherParticipantInfo.avatar,
                handle: '', email: '', joinDate: '',
                stats: { gamesPlayed: 0, fieldsVisited: 0, reviewsLeft: 0 },
                friends: [], friendRequestsSent: [], friendRequestsReceived: [],
                currentFieldId: null, checkInTime: null, rating: 0, level: 0,
                experience: 0, achievements: [], playerCard: {} as PlayerCard, comments: []
            };
            return {
                type: 'direct' as const,
                target: partner,
                id: chat.id,
                name: otherParticipantInfo.name,
                photo: otherParticipantInfo.avatar,
                lastMessage: chat.lastMessage || null,
                timestamp: chat.lastMessage ? new Date(chat.lastMessage.timestamp).getTime() : new Date(0).getTime(),
            };
        });

        // Combine and sort
        return [...fieldChatItems, ...directChatItems].sort((a, b) => b.timestamp - a.timestamp);
    }, [fields, directChats, user.id]);


    if (allChats.length === 0) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center text-center p-4 bg-gray-50 dark:bg-gray-900">
                <ChatBubblesIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    {t('noDirectChats')}
                </h3>
                <p className="text-gray-400 dark:text-gray-500 max-w-xs">
                    {t('chatsExplanation')}
                </p>
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="p-2 space-y-2">
                {allChats.map(chat => (
                    <button 
                        key={`${chat.type}-${chat.id}`} 
                        onClick={() => {
                            if (chat.type === 'field') {
                                onOpenChat(chat.target as Field);
                            } else {
                                onOpenDirectChat(chat.target as Player);
                            }
                        }}
                        className="w-full flex items-center gap-3 bg-white dark:bg-gray-800 border border-transparent hover:border-green-500 dark:hover:border-green-400 p-3 rounded-lg text-left transition-colors shadow-sm"
                    >
                        <div className="relative flex-shrink-0">
                            <img src={chat.photo} alt={chat.name} className="w-14 h-14 rounded-lg object-cover" />
                             <div className="absolute -bottom-1 -right-1 bg-gray-700 dark:bg-gray-900 p-1 rounded-full border-2 border-white dark:border-gray-800">
                                {chat.type === 'field' ? <MapIcon className="w-3 h-3 text-white" /> : <UserIcon className="w-3 h-3 text-white" />}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-gray-900 dark:text-white truncate pr-2">{chat.name}</h4>
                                {chat.lastMessage && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                                        {formatTimeAgo(chat.lastMessage.timestamp, now)}
                                    </span>
                                )}
                            </div>
                            {chat.lastMessage ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                                    <span className="font-medium">{chat.lastMessage.author.id === user.id ? 'Вы' : chat.lastMessage.author.name.split(' ')[0]}: </span>
                                    {chat.lastMessage.message}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">
                                    Нет сообщений
                                </p>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};