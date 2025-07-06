import { NextResponse } from 'next/server';
import { getPlayers, addPlayer, deletePlayer, initDatabase } from '@/lib/db';

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
    const players = await getPlayers();
    return NextResponse.json(players);
  } catch (error) {
    console.error('プレイヤー一覧の取得に失敗しました:', error);
    return NextResponse.json(
      { error: 'プレイヤー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseInitialized();
    
    const { name } = await request.json();
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'プレイヤー名を入力してください' },
        { status: 400 }
      );
    }
    
    console.log('プレイヤー追加試行:', name.trim());
    const player = await addPlayer(name.trim());
    console.log('プレイヤー追加成功:', player);
    
    return NextResponse.json(player);
  } catch (error) {
    console.error('プレイヤーの追加に失敗しました:', error);
    
    let errorMessage = 'プレイヤーの追加に失敗しました';
    if (error instanceof Error) {
      if (error.message.includes('unique constraint') || error.message.includes('UNIQUE')) {
        errorMessage = 'このプレイヤー名は既に登録されています';
      } else {
        errorMessage = `プレイヤーの追加に失敗しました: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureDatabaseInitialized();
    
    const { id } = await request.json();
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'プレイヤーIDが必要です' },
        { status: 400 }
      );
    }
    
    await deletePlayer(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('プレイヤーの削除に失敗しました:', error);
    
    let errorMessage = 'プレイヤーの削除に失敗しました';
    if (error instanceof Error) {
      errorMessage = `プレイヤーの削除に失敗しました: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 