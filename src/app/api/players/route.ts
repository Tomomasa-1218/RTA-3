import { NextResponse } from 'next/server';
import { getPlayers, addPlayer, deletePlayer } from '@/lib/db';

export async function GET() {
  try {
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
    const { name } = await request.json();
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'プレイヤー名を入力してください' },
        { status: 400 }
      );
    }
    
    const player = await addPlayer(name.trim());
    return NextResponse.json(player);
  } catch (error) {
    console.error('プレイヤーの追加に失敗しました:', error);
    return NextResponse.json(
      { error: 'プレイヤーの追加に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
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
    return NextResponse.json(
      { error: 'プレイヤーの削除に失敗しました' },
      { status: 500 }
    );
  }
} 