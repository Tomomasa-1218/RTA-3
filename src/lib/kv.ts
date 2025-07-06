import { kv } from '@vercel/kv';
import { PokerRecord, PlayerStats } from '@/types/poker';

export async function saveRecord(record: Omit<PokerRecord, 'id' | 'createdAt'>) {
  const id = `record_${Date.now()}`;
  const createdAt = new Date().toISOString();
  const fullRecord: PokerRecord = {
    ...record,
    id,
    createdAt
  };

  // レコードを保存
  await kv.hset(`records:${record.playerName}`, { [id]: JSON.stringify(fullRecord) });
  
  // プレイヤーの統計を更新
  await updatePlayerStats(record.playerName, record.pointBalance);
  
  return fullRecord;
}

export async function getPlayerRecords(playerName: string): Promise<PokerRecord[]> {
  const records = await kv.hgetall(`records:${playerName}`);
  if (!records) return [];
  
  return Object.values(records)
    .map(record => JSON.parse(record as string))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPlayerStats(playerName: string): Promise<PlayerStats | null> {
  const stats = await kv.get<PlayerStats>(`stats:${playerName}`);
  return stats;
}

async function updatePlayerStats(playerName: string, newBalance: number) {
  const stats = await kv.get<PlayerStats>(`stats:${playerName}`) || {
    totalGames: 0,
    totalBalance: 0,
    averageBalance: 0,
    bestBalance: newBalance,
    worstBalance: newBalance
  };

  const newStats: PlayerStats = {
    totalGames: stats.totalGames + 1,
    totalBalance: stats.totalBalance + newBalance,
    averageBalance: (stats.totalBalance + newBalance) / (stats.totalGames + 1),
    bestBalance: Math.max(stats.bestBalance, newBalance),
    worstBalance: Math.min(stats.worstBalance, newBalance)
  };

  await kv.set(`stats:${playerName}`, newStats);
} 