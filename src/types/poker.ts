export interface PokerRecord {
  id: string;
  playerName: string;
  date: string;
  initialPoints: number;
  finalPoints: number;
  addOns: number;
  pointBalance: number;
  createdAt: string;
}

export interface PlayerStats {
  totalGames: number;
  totalBalance: number;
  averageBalance: number;
  bestBalance: number;
  worstBalance: number;
}

export interface Settings {
  players: string[];
  defaultInitialPoints: number;
}

export interface Player {
  id: string;
  name: string;
  createdAt: string;
} 