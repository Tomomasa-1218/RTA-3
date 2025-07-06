import { NextResponse } from 'next/server';
import { getSettings, updateDefaultInitialPoints, initDatabase } from '@/lib/db';

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
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('設定の取得に失敗しました:', error);
    
    let errorMessage = '設定の取得に失敗しました';
    if (error instanceof Error) {
      errorMessage = `設定の取得に失敗しました: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await ensureDatabaseInitialized();
    
    const { defaultInitialPoints } = await request.json();
    
    if (typeof defaultInitialPoints !== 'number' || defaultInitialPoints <= 0) {
      return NextResponse.json(
        { error: '初期持ち点は正の数値で入力してください' },
        { status: 400 }
      );
    }
    
    await updateDefaultInitialPoints(defaultInitialPoints);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('設定の更新に失敗しました:', error);
    
    let errorMessage = '設定の更新に失敗しました';
    if (error instanceof Error) {
      errorMessage = `設定の更新に失敗しました: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 