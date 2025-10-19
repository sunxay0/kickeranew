


import React, { useState, useMemo, useEffect } from 'react';
import { Field, Player, Tournament, TournamentFormat, TeamFormat, Match, TournamentTeam } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { ArrowLeftIcon, LoadingSpinner, PencilIcon, TrophyIcon } from './icons';
import { TranslationKey } from '../translations';
import { db } from '../firebase';
// FIX: Use Firebase v8 compat imports
import 'firebase/compat/firestore';

interface TournamentSectionProps {
    field: Field;
    currentUser: Player;
    onUpdateField: (field: Field) => void;
    onViewProfile: (playerOrId: Player | string) => void;
}

// --- UTILITY COMPONENTS ---

const FormRow: React.FC<{label: string, children: React.ReactNode, className?: string}> = ({ label, children, className }) => (
    <div className={className}>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</label>
        {children}
    </div>
);

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select
        {...props}
        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
);

const DetailRow: React.FC<{label: TranslationKey, value: string | React.ReactNode}> = ({label, value}) => {
    const { t } = useSettings();
    return (
        <div className="flex justify-between items-center text-sm py-2">
            <span className="font-semibold text-gray-500 dark:text-gray-400">{t(label)}:</span>
            <span className="font-medium text-right">{value}</span>
        </div>
    );
}

// --- DATA FETCHING HOOK ---
const useFetchPlayer = (playerId: string): [Player | null, boolean] => {
    const [player, setPlayer] = useState<Player | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!playerId) return;
        
        const fetchPlayer = async () => {
            setLoading(true);
            try {
                // FIX: Use v8 compat Firestore syntax
                const playerRef = db.collection("users").doc(playerId);
                const playerSnap = await playerRef.get();
                if (playerSnap.exists) {
                    setPlayer(playerSnap.data() as Player);
                }
            } catch (error) {
                console.error("Failed to fetch player", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlayer();
    }, [playerId]);
    
    return [player, loading];
}

// --- VIEWS / SUB-COMPONENTS ---

const TournamentList: React.FC<{
    tournaments: Tournament[];
    onCreateClick: () => void;
    onViewTournament: (tournament: Tournament) => void;
}> = ({ tournaments, onCreateClick, onViewTournament }) => {
    const { t } = useSettings();
    const [listTab, setListTab] = useState<'current' | 'history'>('current');

    const now = new Date();
    const currentTournaments = tournaments.filter(t => new Date(t.applicationDeadline) > now);
    const pastTournaments = tournaments.filter(t => new Date(t.applicationDeadline) <= now);

    const renderList = (list: Tournament[]) => {
        if (list.length === 0) {
            return <p className="text-center text-gray-500 dark:text-gray-400 py-8">{listTab === 'current' ? t('noCurrentTournaments') : t('noPastTournaments')}</p>
        }
        return (
            <div className="space-y-3 mt-4">
                {list.map(tourney => {
                    const teamFormatMap: Record<TeamFormat, TranslationKey> = {
                        [TeamFormat.FiveVFive]: 'fiveVFive',
                        [TeamFormat.ElevenVEleven]: 'elevenVEleven',
                        [TeamFormat.NVN]: 'nvn',
                    };
                    const teamFormatDisplay = tourney.teamFormat === TeamFormat.NVN 
                        ? `${tourney.customTeamSize} ${t('vs')} ${tourney.customTeamSize}` 
                        : t(teamFormatMap[tourney.teamFormat]);

                    return (
                        <button key={tourney.id} onClick={() => onViewTournament(tourney)} className="w-full text-left bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                            <h4 className="font-bold">{tourney.name}, <span className="font-medium text-gray-600 dark:text-gray-300">{teamFormatDisplay}</span></h4>
                            
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                <p><span className="font-semibold">{t('startTime')}:</span> {new Date(tourney.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                                <p><span className="font-semibold">{t('applicationDeadline')}:</span> {new Date(tourney.applicationDeadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="p-4 flex flex-col h-full">
            <div className="flex-grow">
                <div className="flex bg-gray-200 dark:bg-gray-900 rounded-lg p-1">
                    <button onClick={() => setListTab('current')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition ${listTab === 'current' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>{t('currentTournaments')}</button>
                    <button onClick={() => setListTab('history')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition ${listTab === 'history' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>{t('tournamentHistory')}</button>
                </div>
                {listTab === 'current' && renderList(currentTournaments)}
                {listTab === 'history' && renderList(pastTournaments)}
            </div>
            <button onClick={onCreateClick} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition mt-4">{t('createTournament')}</button>
        </div>
    );
}

const TournamentDetailsView: React.FC<{
    tournament: Tournament;
    currentUser: Player;
    onBack: () => void;
    onApply: (tournament: Tournament) => void;
    onEdit: (tournament: Tournament) => void;
    onManage: (tournament: Tournament) => void;
}> = ({ tournament, currentUser, onBack, onApply, onEdit, onManage }) => {
    const { t } = useSettings();
    const [creator, isLoadingCreator] = useFetchPlayer(tournament.creatorId);
    const [activeTab, setActiveTab] = useState<'info' | 'participants' | 'grid'>('info');

    const isCreator = currentUser.id === tournament.creatorId;

    const tournamentFormatMap: Record<TournamentFormat, TranslationKey> = {
        [TournamentFormat.Championship]: 'championship',
        [TournamentFormat.ChampionshipPlayoff]: 'championshipPlayoff',
        [TournamentFormat.Playoff]: 'playoff',
    };
    const teamFormatMap: Record<TeamFormat, TranslationKey> = {
        [TeamFormat.FiveVFive]: 'fiveVFive',
        [TeamFormat.ElevenVEleven]: 'elevenVEleven',
        [TeamFormat.NVN]: 'nvn',
    };

    const teamFormatDisplay = tournament.teamFormat === TeamFormat.NVN 
        ? `${tournament.customTeamSize} ${t('vs')} ${tournament.customTeamSize}` 
        : t(teamFormatMap[tournament.teamFormat]);

    const handleApply = () => onApply(tournament);
    
    const isApplied = tournament.applicants.includes(currentUser.id);
    const isEligible = currentUser.stats.gamesPlayed >= tournament.minGamesPlayed;

    const getApplyButton = () => {
        if (isApplied) {
            return <button className="w-full p-3 rounded-lg font-bold text-white bg-gray-500 cursor-default">{t('applicationSent')}</button>;
        }
        if (!isEligible) {
            return <button className="w-full p-3 rounded-lg font-bold text-white bg-red-500 cursor-default" title={t('notEligibleRequirement')}>{t('notEligibleRequirement')}</button>;
        }
        return <button onClick={handleApply} className="w-full p-3 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700">{t('apply')}</button>;
    }
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 p-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ArrowLeftIcon/></button>
                <h3 className="text-xl font-bold truncate">{tournament.name}</h3>
            </div>
            
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                { (['info', 'participants', 'grid'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 p-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === tab ? 'border-b-2 border-green-500 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {t(tab)}
                    </button>
                ))}
            </div>

            <div className="overflow-y-auto flex-grow p-4 space-y-4">
                {activeTab === 'info' && (
                    <>
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                            <h4 className="font-bold mb-2">{t('tournamentName')}</h4>
                            <DetailRow label="tournamentFormat" value={t(tournamentFormatMap[tournament.tournamentFormat])} />
                            <DetailRow label="teamFormat" value={teamFormatDisplay} />
                            <DetailRow label="prizeFund" value={tournament.prizeFund || 'N/A'} />
                            <DetailRow label="startTime" value={new Date(tournament.startTime).toLocaleString()} />
                            <DetailRow label="endTime" value={new Date(tournament.endTime).toLocaleString()} />
                            <DetailRow label="applicationDeadline" value={new Date(tournament.applicationDeadline).toLocaleString()} />
                            <DetailRow label="creator" value={isLoadingCreator ? <LoadingSpinner /> : (creator?.name || 'Unknown')} />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                            <h4 className="font-bold mb-2">{t('participationRequirements')}</h4>
                            <DetailRow label="minRequiredRating" value={`${tournament.minRating.toFixed(1)} ★`} />
                            <DetailRow label="minRequiredGames" value={tournament.minGamesPlayed.toString()} />
                        </div>
                    </>
                )}
                {activeTab === 'participants' && (
                    <>
                        <div>
                            <h3 className="font-bold text-lg mb-2">{t('teams')} ({tournament.teams.length})</h3>
                            {tournament.teams.length > 0 ? (
                                <div className="space-y-2">
                                    {/* List teams here */}
                                </div>
                            ) : <p className="text-sm text-gray-500 dark:text-gray-400">{t('noTeams')}</p>}
                        </div>
                         <div>
                            <h3 className="font-bold text-lg mb-2">{t('applicants')} ({tournament.applicants.length})</h3>
                            {tournament.applicants.length > 0 ? (
                                <div className="space-y-2">
                                    {/* List applicants here */}
                                </div>
                            ) : <p className="text-sm text-gray-500 dark:text-gray-400">{t('noApplicants')}</p>}
                        </div>
                    </>
                )}
                 {activeTab === 'grid' && (
                    <>
                        <div>
                            <h3 className="font-bold text-lg mb-2">{t('grid')}</h3>
                            {tournament.matches.length > 0 ? (
                                <div className="space-y-4">
                                    {tournament.matches.map((match, index) => (
                                        <div key={match.id} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('match')} #{index + 1}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold w-2/5 truncate">{match.teams[0]?.name || 'TBD'}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-lg">{match.scores[0] ?? '-'}</span>
                                                    <span className="text-gray-400">{t('vs')}</span>
                                                    <span className="font-bold text-lg">{match.scores[1] ?? '-'}</span>
                                                </div>
                                                <span className="font-semibold w-2/5 text-right truncate">{match.teams[1]?.name || 'TBD'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-gray-500 dark:text-gray-400">{t('noMatches')}</p>}
                        </div>
                    </>
                )}
            </div>
            <div className="p-4 flex-shrink-0 flex gap-2">
                { isCreator ? (
                    <>
                        <button onClick={() => onEdit(tournament)} className="w-full p-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"><PencilIcon/>{t('editTournament')}</button>
                        <button onClick={() => onManage(tournament)} className="w-full p-3 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700">{t('manage')}</button>
                    </>
                ) : getApplyButton() }
            </div>
        </div>
    );
}

const ManageTournamentView: React.FC<{
    tournament: Tournament;
    onBack: () => void;
    onUpdateTournament: (updatedTournament: Tournament) => void;
}> = ({ tournament, onBack, onUpdateTournament }) => {
    const { t } = useSettings();
    const [matches, setMatches] = useState(tournament.matches);
    
    const handleGenerateGrid = () => {
        const teams = [...tournament.teams];
        if (teams.length < 2) return;
        
        // Simple pairing logic for now
        const newMatches: Match[] = [];
        for (let i = 0; i < teams.length; i += 2) {
            if (teams[i+1]) {
                newMatches.push({
                    id: `match-${Date.now()}-${i}`,
                    teams: [teams[i], teams[i+1]],
                    scores: [null, null],
                    status: 'scheduled'
                });
            }
        }
        setMatches(newMatches);
        onUpdateTournament({ ...tournament, matches: newMatches });
    }
    
    const handleScoreChange = (matchId: string, teamIndex: 0 | 1, score: string) => {
        const newMatches = matches.map(m => {
            if (m.id === matchId) {
                const newScores = [...m.scores] as [number | null, number | null];
                newScores[teamIndex] = score === '' ? null : parseInt(score, 10);
                const updatedStatus: 'completed' | 'scheduled' = (newScores[0] !== null && newScores[1] !== null) ? 'completed' : 'scheduled';
                return { ...m, scores: newScores, status: updatedStatus };
            }
            return m;
        });
        setMatches(newMatches);
    }
    
    const handleSaveScores = () => {
        onUpdateTournament({ ...tournament, matches });
        onBack();
    }
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 p-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ArrowLeftIcon/></button>
                <h3 className="text-xl font-bold">{t('manageTournament')}</h3>
            </div>
            <div className="overflow-y-auto flex-grow p-4 space-y-4">
                <button onClick={handleGenerateGrid} className="w-full p-3 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700">{t('generateGrid')}</button>
                
                {matches.map(match => (
                    <div key={match.id} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg space-y-2">
                        <div className="flex items-center justify-between text-sm">
                             <span className="font-semibold w-2/5 truncate">{match.teams[0]?.name}</span>
                             <span className="text-gray-400">{t('vs')}</span>
                             <span className="font-semibold w-2/5 text-right truncate">{match.teams[1]?.name}</span>
                        </div>
                        <div className="flex items-center justify-center gap-4">
                            <FormInput type="number" value={match.scores[0] ?? ''} onChange={e => handleScoreChange(match.id, 0, e.target.value)} className="text-center" />
                            <FormInput type="number" value={match.scores[1] ?? ''} onChange={e => handleScoreChange(match.id, 1, e.target.value)} className="text-center" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 flex-shrink-0">
                 <button onClick={handleSaveScores} className="w-full p-3 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700">{t('submitScores')}</button>
            </div>
        </div>
    );
};

const CreateOrEditTournamentForm: React.FC<{
    initialData?: Tournament;
    onBack: () => void;
    onSave: (formData: Omit<Tournament, 'id' | 'creatorId' | 'fieldId' | 'createdAt' | 'teams' | 'applicants' | 'status' | 'matches'>, id?: string) => void;
}> = ({ onBack, onSave, initialData }) => {
    const { t } = useSettings();
    const [name, setName] = useState(initialData?.name || '');
    const [tournamentFormat, setTournamentFormat] = useState<TournamentFormat>(initialData?.tournamentFormat || TournamentFormat.Championship);
    const [teamFormat, setTeamFormat] = useState<TeamFormat>(initialData?.teamFormat || TeamFormat.FiveVFive);
    const [customTeamSize, setCustomTeamSize] = useState(initialData?.customTeamSize || 5);
    const [prizeFund, setPrizeFund] = useState(initialData?.prizeFund || '');
    const [teamCount, setTeamCount] = useState(initialData?.teamCount || 8);
    const [rosterSize, setRosterSize] = useState(initialData?.rosterSize || 7);
    const [startTime, setStartTime] = useState(initialData?.startTime || '');
    const [endTime, setEndTime] = useState(initialData?.endTime || '');
    const [applicationDeadline, setApplicationDeadline] = useState(initialData?.applicationDeadline || '');
    const [minRating, setMinRating] = useState(initialData?.minRating || 0);
    const [minGamesPlayed, setMinGamesPlayed] = useState(initialData?.minGamesPlayed || 0);

    const tournamentFormatMap: Record<TournamentFormat, TranslationKey> = { [TournamentFormat.Championship]: 'championship', [TournamentFormat.ChampionshipPlayoff]: 'championshipPlayoff', [TournamentFormat.Playoff]: 'playoff' };
    const teamFormatMap: Record<TeamFormat, TranslationKey> = { [TeamFormat.FiveVFive]: 'fiveVFive', [TeamFormat.ElevenVEleven]: 'elevenVEleven', [TeamFormat.NVN]: 'nvn' };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, tournamentFormat, teamFormat, customTeamSize, prizeFund, teamCount, rosterSize, startTime, endTime, applicationDeadline, minRating, minGamesPlayed }, initialData?.id);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 p-4 flex-shrink-0">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ArrowLeftIcon/></button>
                <h3 className="text-xl font-bold">{initialData ? t('editTournament') : t('createTournament')}</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-grow p-4">
                <FormRow label={t('tournamentName')}><FormInput type="text" value={name} onChange={e => setName(e.target.value)} required /></FormRow>
                <FormRow label={t('tournamentFormat')}><FormSelect value={tournamentFormat} onChange={e => setTournamentFormat(e.target.value as TournamentFormat)}>{Object.values(TournamentFormat).map(f => <option key={f} value={f}>{t(tournamentFormatMap[f as TournamentFormat])}</option>)}</FormSelect></FormRow>
                <FormRow label={t('teamFormat')}><FormSelect value={teamFormat} onChange={e => setTeamFormat(e.target.value as TeamFormat)}>{Object.values(TeamFormat).map(f => <option key={f} value={f}>{t(teamFormatMap[f as TeamFormat])}</option>)}</FormSelect></FormRow>
                {teamFormat === TeamFormat.NVN && <FormRow label={t('customTeamSize')}><FormInput type="number" value={customTeamSize} onChange={e => setCustomTeamSize(Number(e.target.value))} min="1" max="22" /></FormRow>}
                <FormRow label={t('prizeFund')}><FormInput type="text" value={prizeFund} onChange={e => setPrizeFund(e.target.value)} /></FormRow>
                <div className="grid grid-cols-2 gap-4">
                    <FormRow label={t('numberOfTeams')}><FormInput type="number" value={teamCount} onChange={e => setTeamCount(Number(e.target.value))} min="2" /></FormRow>
                    <FormRow label={t('rosterSize')}><FormInput type="number" value={rosterSize} onChange={e => setRosterSize(Number(e.target.value))} min="1" /></FormRow>
                </div>
                <FormRow label={t('startTime')}><FormInput type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} required /></FormRow>
                <FormRow label={t('endTime')}><FormInput type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} required /></FormRow>
                <FormRow label={t('applicationDeadline')}><FormInput type="datetime-local" value={applicationDeadline} onChange={e => setApplicationDeadline(e.target.value)} required /></FormRow>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                     <h4 className="font-semibold mb-2">{t('participationRequirements')}</h4>
                     <div className="grid grid-cols-2 gap-4">
                         <FormRow label={`${t('minRequiredRating')}: ${minRating.toFixed(1)}`}><input type="range" min="0" max="5" step="0.5" value={minRating} onChange={e => setMinRating(parseFloat(e.target.value))} className="w-full" /></FormRow>
                         <FormRow label={`${t('minRequiredGames')}: ${minGamesPlayed}`}><input type="range" min="0" max="100" step="1" value={minGamesPlayed} onChange={e => setMinGamesPlayed(parseInt(e.target.value, 10))} className="w-full" /></FormRow>
                     </div>
                </div>
                 <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition">{initialData ? t('saveChanges') : t('createTournament')}</button>
            </form>
        </div>
    );
}


// --- MAIN COMPONENT ---

export const TournamentSection: React.FC<TournamentSectionProps> = ({ field, currentUser, onUpdateField, onViewProfile }) => {
    const [view, setView] = useState<'list' | 'create' | 'details' | 'edit' | 'manage'>('list');
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

    const updateTournamentInField = (updatedTournament: Tournament) => {
        const updatedTournaments = (field.tournaments || []).map(t => t.id === updatedTournament.id ? updatedTournament : t);
        onUpdateField({ ...field, tournaments: updatedTournaments });
        setSelectedTournament(updatedTournament);
    }

    const handleSaveTournament = (formData: Omit<Tournament, 'id' | 'creatorId' | 'fieldId' | 'createdAt' | 'teams' | 'applicants' | 'status' | 'matches'>, id?: string) => {
        if (id) { // Editing existing
            const originalTournament = (field.tournaments || []).find(t => t.id === id);
            if (!originalTournament) return;
            const updatedTournament: Tournament = { ...originalTournament, ...formData };
            updateTournamentInField(updatedTournament);
        } else { // Creating new
            const newTournament: Tournament = {
                id: `tourney-${Date.now()}`,
                creatorId: currentUser.id,
                fieldId: field.id,
                createdAt: new Date().toISOString(),
                teams: [],
                applicants: [],
                matches: [],
                status: 'open',
                ...formData
            };
            const updatedField = { ...field, tournaments: [...(field.tournaments || []), newTournament] };
            onUpdateField(updatedField);
        }
        setView('list');
        setSelectedTournament(null);
    };

    const handleApply = (tournament: Tournament) => {
        const isApplied = tournament.applicants.includes(currentUser.id);
        const isEligible = currentUser.stats.gamesPlayed >= tournament.minGamesPlayed;
        if (isApplied || !isEligible) return;

        const updatedTournament = { ...tournament, applicants: [...tournament.applicants, currentUser.id] };
        updateTournamentInField(updatedTournament);
    }
    
    const renderContent = () => {
        switch (view) {
            case 'create':
                return <CreateOrEditTournamentForm onBack={() => setView('list')} onSave={handleSaveTournament} />;
            case 'edit':
                 return selectedTournament ? <CreateOrEditTournamentForm initialData={selectedTournament} onBack={() => setView('details')} onSave={handleSaveTournament} /> : null;
            case 'details':
                return selectedTournament ? <TournamentDetailsView 
                    tournament={selectedTournament} 
                    currentUser={currentUser}
                    onBack={() => { setView('list'); setSelectedTournament(null); }}
                    onApply={handleApply}
                    onEdit={(t) => { setSelectedTournament(t); setView('edit'); }}
                    onManage={(t) => { setSelectedTournament(t); setView('manage'); }}
                /> : null;
            case 'manage':
                return selectedTournament ? <ManageTournamentView
                    tournament={selectedTournament}
                    onBack={() => setView('details')}
                    onUpdateTournament={updateTournamentInField}
                /> : null;
            case 'list':
            default:
                return <TournamentList 
                    tournaments={field.tournaments || []} 
                    onCreateClick={() => setView('create')} 
                    onViewTournament={(t) => { setSelectedTournament(t); setView('details'); }}
                />;
        }
    };

    return <div className="h-full bg-white dark:bg-gray-900">{renderContent()}</div>;
};
