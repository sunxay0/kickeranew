import React, { useState, useEffect, useRef } from 'react';
import { Player, ChatMessage } from '../types';
import { ArrowLeftIcon, PaperAirplaneIcon, SingleCheckIcon } from '../components/icons';
import { useSettings } from '../contexts/SettingsContext';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';

interface DirectChatScreenProps {
    currentUser: Player;
    otherUser: Player;
    onClose: () => void;
}

export const DirectChatScreen: React.FC<DirectChatScreenProps> = ({ currentUser, otherUser, onClose }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { t } = useSettings();

    const chatId = [currentUser.id, otherUser.id].sort().join('_');

    useEffect(() => {
        const messagesRef = db.collection('directChats').doc(chatId).collection('messages').orderBy('timestamp', 'asc');
        const unsubscribe = messagesRef.onSnapshot(snapshot => {
            const newMessages: ChatMessage[] = [];
            snapshot.forEach(doc => {
                newMessages.push({ id: doc.id, ...doc.data() } as ChatMessage);
            });
            setMessages(newMessages);
        });

        return () => unsubscribe();
    }, [chatId]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() === '') return;
    
        const chatRef = db.collection('directChats').doc(chatId);
        const messagesRef = chatRef.collection('messages');
    
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
    
            // 2. Update the lastMessage on the parent chat document
            batch.set(chatRef, {
                participants: [currentUser.id, otherUser.id],
                participantInfo: {
                    [currentUser.id]: { name: currentUser.name, avatar: currentUser.avatar },
                    [otherUser.id]: { name: otherUser.name, avatar: otherUser.avatar }
                },
                lastMessage: { ...newMessage, id: newMessageRef.id }
            }, { merge: true }); // Use merge to create if it doesn't exist, or update if it does
    
            await batch.commit();
    
            setMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
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
                <div className="flex items-center gap-3">
                    <img src={otherUser.avatar} alt={otherUser.name} className="w-9 h-9 rounded-full" />
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{otherUser.name}</h1>
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