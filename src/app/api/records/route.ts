import { NextResponse } from 'next/server';
import { saveRecord, getPlayerRecords, initDatabase } from '@/lib/db';

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

export async function POST(request: Request) {
  try {
    // データベースの初期化を確認
    await ensureDatabaseInitialized();

    const body = await request.json();
    
    // 入力値の検証
    if (!body.playerName || !body.date || body.initialPoints === undefined || body.finalPoints === undefined || body.addOns === undefined) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      );
    }

    // 数値型の検証
    if (typeof body.initialPoints !== 'number' || typeof body.finalPoints !== 'number' || typeof body.addOns !== 'number') {
      return NextResponse.json(
        { error: '持ち点とアドオン回数は数値で入力してください' },
        { status: 400 }
      );
    }

    console.log('保存するデータ:', body);
    const record = await saveRecord(body);
    console.log('保存されたレコード:', record);
    
    return NextResponse.json(record);
  } catch (error) {
    console.error('詳細なエラー情報:', error);
    
    // エラーメッセージの詳細化
    let errorMessage = 'レコードの保存に失敗しました';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // データベースの初期化を確認
    await ensureDatabaseInitialized();

    const { searchParams } = new URL(request.url);
    const playerName = searchParams.get('playerName');

    if (!playerName) {
      return NextResponse.json(
        { error: 'プレイヤー名は必須です' },
        { status: 400 }
      );
    }

    const records = await getPlayerRecords(playerName);
    return NextResponse.json(records);
  } catch (error) {
    console.error('詳細なエラー情報:', error);
    
    let errorMessage = '記録の取得に失敗しました';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 