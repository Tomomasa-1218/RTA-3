import { NextResponse } from 'next/server';
import { getDailyRecords, initDatabase } from '@/lib/db';

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

export async function GET(request: Request) {
  try {
    await ensureDatabaseInitialized();
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: '日付が必要です' },
        { status: 400 }
      );
    }

    const records = await getDailyRecords(date);
    return NextResponse.json(records);
  } catch (error) {
    console.error('日別記録の取得に失敗しました:', error);
    
    let errorMessage = '日別記録の取得に失敗しました';
    if (error instanceof Error) {
      errorMessage = `日別記録の取得に失敗しました: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 