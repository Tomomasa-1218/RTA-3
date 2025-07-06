import { NextResponse } from 'next/server';
import { getSettings, updateDefaultInitialPoints } from '@/lib/db';

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('設定の取得に失敗しました:', error);
    return NextResponse.json(
      { error: '設定の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
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
    return NextResponse.json(
      { error: '設定の更新に失敗しました' },
      { status: 500 }
    );
  }
} 