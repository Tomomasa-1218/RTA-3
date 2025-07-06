import { NextResponse } from 'next/server';
import { getRecordDates, initDatabase } from '@/lib/db';

// データベースの初期化を行う関数
let isInitialized = false;
async function ensureDatabaseInitialized() {
  if (!isInitialized) {
    try {
      await initDatabase();
      isInitialized = true;
      console.log('✅ データベースの初期化が完了しました');
    } catch (error) {
      console.error('❌ データベースの初期化に失敗しました:', error);
      throw error;
    }
  }
}

export async function GET() {
  try {
    await ensureDatabaseInitialized();
    const dates = await getRecordDates();
    return NextResponse.json(dates);
  } catch (error) {
    console.error('日付一覧の取得に失敗しました:', error);
    
    let errorMessage = '日付一覧の取得に失敗しました';
    if (error instanceof Error) {
      errorMessage = `日付一覧の取得に失敗しました: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 