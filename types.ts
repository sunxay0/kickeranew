export interface Player {
  id: string;
  name: string;
  handle: string; // Unique, user-configurable ID
  email: string;
  avatar: string;
  joinDate: string;
  stats: {
    gamesPlayed: number;
    fieldsVisited: number;
    reviewsLeft: number;
  };
  authProvider?: 'email' | 'google';
  favoriteFields?: number[];
  friends: string[]; // Array of friend user IDs
  friendRequestsSent: string[]; // Array of user IDs the player has sent requests to
  friendRequestsReceived: string[]; // Array of user IDs the player has received requests from
  currentFieldId: number | null; // ID of the field the player is currently checked into
  // Gamification
  rating: number; // Overall player rating
  level: number; // Player level
  experience: number; // Current XP
  achievements: string[]; // Array of achievement IDs
  playerCard: PlayerCard;
}

export interface PlayerCard {
  id: string;
  playerId: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'special';
  overallRating: number;
  characteristics: {
    speed: number;
    shooting: number;
    passing: number;
    defending: number;
    stamina: number;
    technique: number;
  };
  specialAbilities: string[];
  isSpecial: boolean; // For special cards like "Player of the Week"
  validUntil?: string; // For temporary special cards
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'games' | 'fields' | 'reviews' | 'social' | 'special';
  requirement: {
    type: string;
    value: number;
  };
  reward: {
    experience: number;
    points?: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  requirements: {
    type: string;
    value: number;
    current: number;
  }[];
  rewards: {
    experience: number;
    points?: number;
    items?: string[];
  };
  isCompleted: boolean;
  expiresAt: string;
}

export interface LeaderboardEntry {
  player: Player;
  rank: number;
  score: number;
  category: 'games' | 'wins' | 'achievements' | 'organizers';
}

export enum FieldStatus {
  Available = 'Available',
  Busy = 'Busy',
  Closed = 'Closed',
}

export enum SurfaceType {
  Artificial = 'Artificial',
  Grass = 'Grass',
  Concrete = 'Concrete',
  Asphalt = 'Asphalt',
}

export interface Review {
  id: string;
  author: Player;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  author: Player;
  message: string;
  timestamp: string;
  isAnnouncement?: boolean;
}

export enum TournamentFormat {
  Championship = 'Championship',
  ChampionshipPlayoff = 'Championship + Playoff',
  Playoff = 'Playoff',
}

export enum TeamFormat {
  FiveVFive = '5 vs 5',
  ElevenVEleven = '11 vs 11',
  NVN = 'N vs N',
}

export interface TournamentTeam {
  id: string;
  name: string;
  captainId: string;
  playerIds: string[];
}

export interface Match {
  id: string;
  teams: [TournamentTeam | null, TournamentTeam | null];
  scores: [number | null, number | null];
  status: 'scheduled' | 'completed';
}


export interface Tournament {
  id: string;
  name: string;
  creatorId: string;
  fieldId: number;
  createdAt: string;
  
  // Rules & Format
  tournamentFormat: TournamentFormat;
  teamFormat: TeamFormat;
  customTeamSize: number;
  teamCount: number;
  rosterSize: number;
  
  // Logistics
  prizeFund: string;
  startTime: string;
  endTime: string;
  applicationDeadline: string;

  // Participation Requirements
  minRating: number;
  minGamesPlayed: number;

  // State
  teams: TournamentTeam[];
  applicants: string[]; // Player IDs who applied but are not yet on a team
  matches: Match[];
  status: 'open' | 'ongoing' | 'completed';
}


export interface Field {
  id: number;
  name: string;
  lat: number;
  lng: number;
  status: FieldStatus;
  surface: SurfaceType;
  lighting: boolean;
  rating: number;
  players: Player[];
  reviews: Review[];
  chat: ChatMessage[];
  photo: string;
  tournaments?: Tournament[];
}