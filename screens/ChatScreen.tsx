import React, { useState, useEffect, useRef } from 'react';
import { Field, Player, ChatMessage } from '../types';
import { ArrowLeftIcon, PaperAirplaneIcon } from '../components/icons';
import { useSettings } from '../contexts/SettingsContext';

interface ChatScreenProps {
    field: Field;
    currentUser: Player;
    onClose: () => void;
    onUpdateField: (field: Field) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ field, currentUser, onClose, onUpdateField }) => {
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { t } = useSettings();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [field.chat]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() === '') return;

        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            author: currentUser,
            message: message,
            timestamp: new Date().toISOString(),
        };

        const updatedField = { ...field, chat: [...field.chat, newMessage] };
        onUpdateField(updatedField);
        setMessage('');
    };

    return (
        <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900 z-40 flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0">
            {/* Header */}
            <header className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md p-3 flex items-center gap-4 z-20 w-full flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <ArrowLeftIcon />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{field.name}</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{field.players.length} {t('playersOnField')}</p>
                </div>
            </header>

            {/* Message List */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {field.chat.map(msg => (
                    <div key={msg.id} className={`flex gap-2 items-end ${msg.author.id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                        {msg.author.id !== currentUser.id && <img src={msg.author.avatar} alt={msg.author.name} className="w-8 h-8 rounded-full" />}
                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.isAnnouncement ? 'bg-yellow-600/20 border border-yellow-500 text-center w-full text-yellow-800 dark:text-yellow-200' : (msg.author.id === currentUser.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-transparent')}`}>
                            {msg.author.id !== currentUser.id && !msg.isAnnouncement && <p className="text-xs font-bold text-green-500 dark:text-green-300 mb-1">{msg.author.name}</p>}
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <input
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={t('typeMessagePlaceholder')}
                    className="flex-grow bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 dark:border-transparent"
                />
                <button type="submit" className="bg-blue-600 p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 text-white" disabled={!message.trim()}>
                    <PaperAirplaneIcon />
                </button>
            </form>
        </div>
    );
};