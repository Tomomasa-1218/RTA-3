import { neon } from '@neondatabase/serverless';
import { PokerRecord, PlayerStats } from '@/types/poker';

const sql = neon(process.env.DATABASE_URL!);

// テーブル作成用のSQL
const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    player_name TEXT NOT NULL,
    date DATE NOT NULL,
    initial_points INTEGER NOT NULL,
    final_points INTEGER NOT NULL,
    add_ons INTEGER NOT NULL,
    point_balance INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stats (
    player_name TEXT PRIMARY KEY,
    total_games INTEGER NOT NULL,
    total_balance INTEGER NOT NULL,
    average_balance FLOAT NOT NULL,
    best_balance INTEGER NOT NULL,
    worst_balance INTEGER NOT NULL
  );
`;

// テーブルの初期化
export async function initDatabase() {
  try {
    await sql.query(CREATE_TABLES);
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// 記録の保存
export async function saveRecord(record: Omit<PokerRecord, 'id' | 'createdAt'>) {
  const id = `record_${Date.now()}`;
  
  try {
    // レコードを保存
    await sql.query(
      `INSERT INTO records (id, player_name, date, initial_points, final_points, add_ons, point_balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, record.playerName, record.date, record.initialPoints, record.finalPoints, record.addOns, record.pointBalance]
    );

    // 統計を更新
    await updatePlayerStats(record.playerName, record.pointBalance);

    // 保存したレコードを取得
    const savedRecord = await sql.query(
      'SELECT *, created_at as "createdAt" FROM records WHERE id = $1',
      [id]
    );

    return savedRecord.rows[0] as PokerRecord;
  } catch (error) {
    console.error('Failed to save record:', error);
    throw error;
  }
}

// プレイヤーの記録を取得
export async function getPlayerRecords(playerName: string): Promise<PokerRecord[]> {
  try {
    const result = await sql.query(
      'SELECT *, created_at as "createdAt" FROM records WHERE player_name = $1 ORDER BY date DESC',
      [playerName]
    );
    return result.rows as PokerRecord[];
  } catch (error) {
    console.error('Failed to get player records:', error);
    return [];
  }
}

// プレイヤーの統計を取得
export async function getPlayerStats(playerName: string): Promise<PlayerStats | null> {
  try {
    const result = await sql.query(
      'SELECT * FROM stats WHERE player_name = $1',
      [playerName]
    );
    return result.rows[0] as PlayerStats || null;
  } catch (error) {
    console.error('Failed to get player stats:', error);
    return null;
  }
}

// プレイヤーの統計を更新
async function updatePlayerStats(playerName: string, newBalance: number) {
  try {
    // 現在の統計を取得
    const currentStats = await getPlayerStats(playerName);
    
    if (!currentStats) {
      // 新規プレイヤーの場合
      await sql.query(
        `INSERT INTO stats (player_name, total_games, total_balance, average_balance, best_balance, worst_balance)
         VALUES ($1, 1, $2, $2, $2, $2)`,
        [playerName, newBalance]
      );
    } else {
      // 既存プレイヤーの統計を更新
      const newStats = {
        totalGames: currentStats.totalGames + 1,
        totalBalance: currentStats.totalBalance + newBalance,
        averageBalance: (currentStats.totalBalance + newBalance) / (currentStats.totalGames + 1),
        bestBalance: Math.max(currentStats.bestBalance, newBalance),
        worstBalance: Math.min(currentStats.worstBalance, newBalance)
      };

      await sql.query(
        `UPDATE stats 
         SET total_games = $1, total_balance = $2, average_balance = $3, best_balance = $4, worst_balance = $5
         WHERE player_name = $6`,
        [
          newStats.totalGames,
          newStats.totalBalance,
          newStats.averageBalance,
          newStats.bestBalance,
          newStats.worstBalance,
          playerName
        ]
      );
    }
  } catch (error) {
    console.error('Failed to update player stats:', error);
    throw error;
  }
} 