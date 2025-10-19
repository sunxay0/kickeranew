import React, { useState, useEffect, useRef } from 'react';
import { Field, Player, ChatMessage } from '../types';
import { ArrowLeftIcon, PaperAirplaneIcon, SingleCheckIcon } from '../components/icons';
import { useSettings } from '../contexts/SettingsContext';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';


interface ChatScreenProps {
    field: Field;
    currentUser: Player;
    onClose: () => void;
    onUpdateField: (field: Field) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ field, currentUser, onClose, onUpdateField }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { t } = useSettings();

    useEffect(() => {
        const messagesRef = db.collection('fields').doc(String(field.id)).collection('chat').orderBy('timestamp', 'asc');
        const unsubscribe = messagesRef.onSnapshot(snapshot => {
            const newMessages: ChatMessage[] = [];
            snapshot.forEach(doc => {
                newMessages.push({ id: doc.id, ...doc.data() } as ChatMessage);
            });
            setMessages(newMessages);
        });

        return () => unsubscribe();
    }, [field.id]);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() === '') return;

        const fieldRef = db.collection('fields').doc(String(field.id));
        const messagesRef = fieldRef.collection('chat');

        const newMessage: Omit<ChatMessage, 'id'> = {
            author: currentUser,
            message: message.trim(),
            timestamp: new Date().toISOString(),
        };
        
        try {
            const batch = db.batch();

            // 1. Add the new message to the subcollection
            const newMessageRef = messagesRef.doc(); // Auto-generate ID
            batch.set(newMessageRef, newMessage);

            // 2. Update the lastMessage on the parent field document
            const lastMessage = { ...newMessage, id: newMessageRef.id };
            batch.update(fieldRef, { lastMessage });

            await batch.commit();

            // Optimistically update local state so the UI updates
            onUpdateField({ ...field, lastMessage });
            setMessage('');
        } catch (error) {
            console.error("Error sending field chat message:", error);
            alert("Failed to send message.");
        }
    };

    return (
        <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900 z-40 flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0 chat-background">
            {/* Header */}
            <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm p-3 flex items-center gap-4 z-20 w-full flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <ArrowLeftIcon />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{field.name}</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{field.players.length} {t('playersOnField')}</p>
                </div>
            </header>

            {/* Message List */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map(msg => {
                    const isSent = msg.author.id === currentUser.id;
                    return (
                        <div key={msg.id} className={`flex items-end gap-3 ${isSent ? 'justify-end' : 'justify-start'}`}>
                            {!isSent && <img src={msg.author.avatar} alt={msg.author.name} className="w-8 h-8 rounded-full" />}
                            
                            <div className={`p-3 rounded-lg max-w-xs md:max-w-md shadow ${isSent 
                                ? 'bg-green-100 dark:bg-green-900/50 rounded-br-none' 
                                : 'bg-white dark:bg-gray-700 rounded-bl-none'
                            }`}>
                                {!isSent && <p className="text-sm font-bold text-indigo-500 dark:text-indigo-300 mb-1">{msg.author.name}</p>}
                                <p className="text-sm text-gray-800 dark:text-gray-100" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {msg.message}
                                </p>
                                <div className={`text-xs mt-1 flex items-center ${isSent ? 'justify-end text-green-800/70 dark:text-green-200/70' : 'justify-end text-gray-500 dark:text-gray-400'}`}>
                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {isSent && (
                                        <span className="inline-block ml-1">
                                            <SingleCheckIcon className="w-4 h-4" />
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex-shrink-0 p-3 bg-transparent border-t border-black/10 dark:border-white/10 flex items-center gap-3">
                <input
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={t('typeMessagePlaceholder')}
                    className="flex-grow bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 dark:border-gray-700 shadow-sm"
                />
                <button type="submit" className="bg-indigo-600 w-12 h-12 flex items-center justify-center rounded-full hover:bg-indigo-700 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white shadow-lg" disabled={!message.trim()}>
                    <PaperAirplaneIcon className="w-6 h-6" />
                </button>
            </form>
        </div>
    );
};