import { neon } from '@neondatabase/serverless';
import { PokerRecord, PlayerStats } from '@/types/poker';

// 開発環境用のデフォルト接続文字列
const DEV_DATABASE_URL = 'postgres://default:default@ep-cool-forest-123456.us-east-1.aws.neon.tech/neondb';

const sql = neon(process.env.DATABASE_URL || DEV_DATABASE_URL);

// データベース接続のテスト
async function testConnection() {
  try {
    await sql`SELECT 1`;
    console.log('✅ データベース接続成功');
    return true;
  } catch (error) {
    console.error('❌ データベース接続エラー:', error);
    return false;
  }
}

// テーブル作成用のSQL
const CREATE_RECORDS_TABLE = `
  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    player_name TEXT NOT NULL,
    date DATE NOT NULL,
    initial_points INTEGER NOT NULL,
    final_points INTEGER NOT NULL,
    add_ons INTEGER NOT NULL,
    point_balance INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )
`;

const CREATE_STATS_TABLE = `
  CREATE TABLE IF NOT EXISTS stats (
    player_name TEXT PRIMARY KEY,
    total_games INTEGER NOT NULL DEFAULT 0,
    total_balance INTEGER NOT NULL DEFAULT 0,
    average_balance FLOAT NOT NULL DEFAULT 0,
    best_balance INTEGER NOT NULL DEFAULT 0,
    worst_balance INTEGER NOT NULL DEFAULT 0
  )
`;

// テーブルの初期化
export async function initDatabase() {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('データベースに接続できません');
    }

    // テーブルの存在確認
    const checkRecordsTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'records'
      )
    `;

    const checkStatsTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'stats'
      )
    `;

    if (!checkRecordsTable[0].exists || !checkStatsTable[0].exists) {
      console.log('テーブルが存在しないため、作成を開始します');
      
      // テーブルを個別に作成
      await sql.query(CREATE_RECORDS_TABLE);
      await sql.query(CREATE_STATS_TABLE);
      
      console.log('✅ テーブルの作成が完了しました');
    } else {
      console.log('✅ テーブルは既に存在します');
    }
  } catch (error) {
    console.error('❌ データベースの初期化に失敗しました:', error);
    throw error;
  }
}

// 記録の保存
export async function saveRecord(record: Omit<PokerRecord, 'id' | 'createdAt'>) {
  const id = `record_${Date.now()}`;
  
  try {
    // レコードを保存
    await sql`
      INSERT INTO records (id, player_name, date, initial_points, final_points, add_ons, point_balance) 
      VALUES (${id}, ${record.playerName}, ${record.date}, ${record.initialPoints}, ${record.finalPoints}, ${record.addOns}, ${record.pointBalance})
    `;

    // 統計を更新
    await updatePlayerStats(record.playerName, record.pointBalance);

    // 保存したレコードを取得
    const result = await sql`
      SELECT id, player_name as "playerName", date, initial_points as "initialPoints", 
             final_points as "finalPoints", add_ons as "addOns", point_balance as "pointBalance", 
             created_at as "createdAt" 
      FROM records 
      WHERE id = ${id}
    `;

    if (!result || result.length === 0) {
      throw new Error('保存したレコードが見つかりません');
    }

    return result[0] as PokerRecord;
  } catch (error) {
    console.error('Failed to save record:', error);
    if (error instanceof Error) {
      throw new Error(`記録の保存に失敗しました: ${error.message}`);
    }
    throw new Error('記録の保存に失敗しました');
  }
}

// プレイヤーの記録を取得
export async function getPlayerRecords(playerName: string): Promise<PokerRecord[]> {
  try {
    const result = await sql`
      SELECT id, player_name as "playerName", date, initial_points as "initialPoints", 
             final_points as "finalPoints", add_ons as "addOns", point_balance as "pointBalance", 
             created_at as "createdAt" 
      FROM records 
      WHERE player_name = ${playerName} 
      ORDER BY date DESC
    `;
    return result as PokerRecord[];
  } catch (error) {
    console.error('Failed to get player records:', error);
    return [];
  }
}

// プレイヤーの統計を取得
export async function getPlayerStats(playerName: string): Promise<PlayerStats | null> {
  try {
    const result = await sql`
      SELECT player_name as "playerName", total_games as "totalGames", 
             total_balance as "totalBalance", average_balance as "averageBalance", 
             best_balance as "bestBalance", worst_balance as "worstBalance" 
      FROM stats 
      WHERE player_name = ${playerName}
    `;
    return (result[0] as PlayerStats) || null;
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
      await sql`
        INSERT INTO stats (player_name, total_games, total_balance, average_balance, best_balance, worst_balance) 
        VALUES (${playerName}, 1, ${newBalance}, ${newBalance}, ${newBalance}, ${newBalance})
      `;
    } else {
      // 既存プレイヤーの統計を更新
      const newStats = {
        totalGames: currentStats.totalGames + 1,
        totalBalance: currentStats.totalBalance + newBalance,
        averageBalance: (currentStats.totalBalance + newBalance) / (currentStats.totalGames + 1),
        bestBalance: Math.max(currentStats.bestBalance, newBalance),
        worstBalance: Math.min(currentStats.worstBalance, newBalance)
      };

      await sql`
        UPDATE stats 
        SET total_games = ${newStats.totalGames}, 
            total_balance = ${newStats.totalBalance}, 
            average_balance = ${newStats.averageBalance}, 
            best_balance = ${newStats.bestBalance}, 
            worst_balance = ${newStats.worstBalance} 
        WHERE player_name = ${playerName}
      `;
    }
  } catch (error) {
    console.error('Failed to update player stats:', error);
    throw error;
  }
} 