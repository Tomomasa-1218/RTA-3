import { NextResponse } from 'next/server';
import { saveRecord, getPlayerRecords } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const record = await saveRecord(body);
    return NextResponse.json(record);
  } catch (error) {
    console.error('Failed to save record:', error);
    return NextResponse.json({ error: 'Failed to save record' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerName = searchParams.get('playerName');

    if (!playerName) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    const records = await getPlayerRecords(playerName);
    return NextResponse.json(records);
  } catch (error) {
    console.error('Failed to get records:', error);
    return NextResponse.json({ error: 'Failed to get records' }, { status: 500 });
  }
} 