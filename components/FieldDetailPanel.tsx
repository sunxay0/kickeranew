import React, { useState, useRef, useEffect } from 'react';
import { Field, Player, Review, ChatMessage } from '../types';
import { UsersIcon, StarIcon, ChatBubbleIcon, XMarkIcon, PaperAirplaneIcon, CheckCircleIcon, HeartIcon, TrophyIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';
import { TournamentSection } from './TournamentSection';

type Tab = 'players' | 'reviews' | 'tournaments';

interface FieldDetailPanelProps {
  field: Field | null;
  onClose: () => void;
  onUpdateField: (field: Field) => void;
  currentUser: Player;
  onOpenChat: (field: Field) => void;
  onUpdateUser: (user: Player) => void;
  onCheckIn: (field: Field) => void;
  onCheckOut: (field: Field) => void;
  onViewProfile: (playerOrId: Player | string) => void;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`relative flex-1 p-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
      active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    {children}
    {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />}
  </button>
);

const Stars: React.FC<{ rating: number, setRating?: (rating: number) => void }> = ({ rating, setRating }) => (
    <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon 
                key={star}
                className={`w-5 h-5 cursor-pointer ${star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                onClick={() => setRating && setRating(star)}
            />
        ))}
    </div>
);

export const FieldDetailPanel: React.FC<FieldDetailPanelProps> = ({ field, onClose, onUpdateField, currentUser, onOpenChat, onUpdateUser, onCheckIn, onCheckOut, onViewProfile }) => {
  const [activeTab, setActiveTab] = useState<Tab>('players');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const { t } = useSettings();
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  const formatCheckInDuration = (checkInTimeString: string | null): string => {
    if (!checkInTimeString) {
        return '';
    }
    const checkInDate = new Date(checkInTimeString);
    const diffInMillis = currentTime - checkInDate.getTime();
    
    const totalMinutes = Math.floor(diffInMillis / (1000 * 60));

    if (totalMinutes < 1) {
        return 'только что';
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
        return `${hours}ч ${minutes}м`;
    } else {
        return `${minutes}м`;
    }
  };


  useEffect(() => {
    if (field) {
      const userReview = field.reviews.find(r => r.author.id === currentUser.id);
      if (userReview) {
        setReviewRating(userReview.rating);
        setReviewText(userReview.comment);
      } else {
        setReviewRating(0);
        setReviewText('');
      }
      setActiveTab('players');
    }
  }, [field, currentUser.id]);

  if (!field) return null;

  const isCheckedIn = currentUser.currentFieldId === field.id;
  const isCheckedInElsewhere = currentUser.currentFieldId !== null && currentUser.currentFieldId !== field.id;
  
  const getCheckInButtonText = () => {
      if (isCheckedIn) return t('checkOut');
      if (isCheckedInElsewhere) return t('switchToThisField');
      return t('checkIn');
  };
  
  const handleCheckInToggle = () => {
      if (isCheckedIn) {
          onCheckOut(field);
      } else {
          onCheckIn(field);
      }
  };

  const currentUserRating = field?.reviews.find(r => r.author.id === currentUser.id)?.rating ?? 0;
  const isFavorite = field ? currentUser.favoriteFields?.includes(field.id) : false;

  const handleToggleFavorite = () => {
    if (!field) return;
    const updatedFavorites = isFavorite
        ? (currentUser.favoriteFields || []).filter(id => id !== field.id)
        : [...(currentUser.favoriteFields || []), field.id];
    onUpdateUser({ ...currentUser, favoriteFields: updatedFavorites });
  };

  const handleRateField = (newRating: number) => {
    if (!field) return;

    const existingReview = field.reviews.find(r => r.author.id === currentUser.id);
    let updatedReviews: Review[];
    
    if (existingReview) {
        updatedReviews = field.reviews.map(r => 
            r.id === existingReview.id ? { ...r, rating: newRating } : r
        );
    } else {
        const newReview: Review = {
            id: `review-${Date.now()}`,
            author: currentUser,
            rating: newRating,
            comment: '',
            createdAt: new Date().toISOString(),
        };
        updatedReviews = [...field.reviews, newReview];
        onUpdateUser({ ...currentUser, stats: { ...currentUser.stats, reviewsLeft: currentUser.stats.reviewsLeft + 1 } });
    }

    const newAvgRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length;
    
    onUpdateField({ 
        ...field, 
        reviews: updatedReviews, 
        rating: parseFloat(newAvgRating.toFixed(1)) 
    });
  };

  const handlePostReview = () => {
    if (!field || reviewText.trim() === '' || reviewRating === 0) return;

    const existingReviewIndex = field.reviews.findIndex(r => r.author.id === currentUser.id);
    const isNewReview = existingReviewIndex === -1;
    let updatedReviews: Review[];
    
    if (!isNewReview) {
        updatedReviews = field.reviews.map((r, index) => 
            index === existingReviewIndex
            ? { ...r, rating: reviewRating, comment: reviewText, createdAt: new Date().toISOString() } 
            : r
        );
    } else {
        const newReview: Review = {
            id: `review-${Date.now()}`,
            author: currentUser,
            rating: reviewRating,
            comment: reviewText,
            createdAt: new Date().toISOString(),
        };
        updatedReviews = [...field.reviews, newReview];
    }

    const newAvgRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length;
    
    onUpdateField({ 
        ...field, 
        reviews: updatedReviews, 
        rating: parseFloat(newAvgRating.toFixed(1)) 
    });
    
    if (isNewReview) {
        onUpdateUser({ ...currentUser, stats: { ...currentUser.stats, reviewsLeft: currentUser.stats.reviewsLeft + 1 } });
    }
  };


  return (
    <div className={`absolute top-0 right-0 h-full w-full md:w-96 bg-white/95 dark:bg-gray-900/90 backdrop-blur-sm shadow-2xl z-20 transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-gray-700 ${field ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-grow">
              <h2 className="text-xl font-bold">{field.name}</h2>
              <div className="flex items-center text-yellow-400 mt-1">
                <StarIcon className="w-5 h-5"/>
                <span className="ml-1 font-bold">{field.rating.toFixed(1)}</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">({field.reviews.length} {t('reviews')})</span>
              </div>
            </div>
            <div className="flex items-center">
                <button onClick={handleToggleFavorite} className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-red-500 bg-red-100 dark:bg-red-900/50' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    <HeartIcon filled={isFavorite} />
                </button>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><XMarkIcon /></button>
            </div>
          </div>
          <img src={field.photo} alt={field.name} className="mt-4 w-full h-32 object-cover rounded-lg"/>
          <button 
            onClick={handleCheckInToggle}
            className={`w-full mt-4 p-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-white ${isCheckedIn ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
            <CheckCircleIcon />
            {getCheckInButtonText()}
          </button>
          {isCheckedIn && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="text-sm font-semibold text-center text-gray-600 dark:text-gray-300 mb-2">{t('myRating')}</h3>
              <div className="flex justify-center">
                <Stars rating={currentUserRating} setRating={handleRateField} />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <TabButton active={activeTab === 'players'} onClick={() => setActiveTab('players')}><UsersIcon /> {t('players')} ({field.players.length})</TabButton>
          <TabButton active={false} onClick={() => onOpenChat(field)}><ChatBubbleIcon /> {t('openChat')}</TabButton>
          <TabButton active={activeTab === 'tournaments'} onClick={() => setActiveTab('tournaments')}><TrophyIcon /> {t('tournaments')}</TabButton>
          <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}><StarIcon /> {t('reviews')}</TabButton>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto">
          {activeTab === 'players' && (
            <ul className="space-y-3 p-4">
              {field.players.map(player => (
                <li key={player.id}>
                  <button 
                    onClick={() => player.id !== currentUser.id && onViewProfile(player.id)}
                    disabled={player.id === currentUser.id}
                    className="w-full flex items-center gap-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-lg text-left disabled:cursor-default hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <img src={player.avatar} alt={player.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-grow flex justify-between items-center min-w-0">
                        <span className="font-semibold truncate">{player.name}</span>
                        {player.checkInTime && (
                            <span className="text-sm text-green-500 dark:text-green-400 font-medium ml-2 flex-shrink-0">
                                {formatCheckInDuration(player.checkInTime)}
                            </span>
                        )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {activeTab === 'reviews' && (
             <div className="flex flex-col h-full p-4">
                <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg mb-4">
                    <h3 className="font-bold mb-2">{t('leaveReview')}</h3>
                    <Stars rating={reviewRating} setRating={setReviewRating} />
                    <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder={t('yourExperience')} rows={3} className="w-full bg-white dark:bg-gray-700 p-2 rounded-md mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 dark:border-gray-600"></textarea>
                    <button onClick={handlePostReview} className="bg-indigo-600 p-2 mt-2 w-full rounded-md hover:bg-indigo-700 font-semibold text-white">{t('postReview')}</button>
                </div>
                 <div className="flex-grow space-y-4">
                    {field.reviews.map(review => (
                        <div key={review.id} className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => review.author.id !== currentUser.id && onViewProfile(review.author)}
                                    disabled={review.author.id === currentUser.id}
                                    className="disabled:cursor-default"
                                >
                                    <img src={review.author.avatar} alt={review.author.name} className="w-10 h-10 rounded-full" />
                                </button>
                                <div>
                                    <button
                                        onClick={() => review.author.id !== currentUser.id && onViewProfile(review.author)}
                                        disabled={review.author.id === currentUser.id}
                                        className="font-semibold disabled:cursor-default text-left"
                                    >
                                        {review.author.name}
                                    </button>
                                    <Stars rating={review.rating} />
                                </div>
                            </div>
                            {review.comment && <p className="text-gray-700 dark:text-gray-300 mt-2 text-sm">{review.comment}</p>}
                        </div>
                    ))}
                 </div>
             </div>
          )}
          {activeTab === 'tournaments' && (
            <TournamentSection 
              field={field}
              currentUser={currentUser}
              onUpdateField={onUpdateField}
              onViewProfile={onViewProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
};