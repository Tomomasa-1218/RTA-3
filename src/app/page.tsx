'use client';

import { useState, useEffect } from 'react';
import { PokerRecord, PlayerStats } from '@/types/poker';

export default function Home() {
  const [playerName, setPlayerName] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [initialPoints, setInitialPoints] = useState<number>(0);
  const [finalPoints, setFinalPoints] = useState<number>(0);
  const [addOns, setAddOns] = useState<number>(0);
  const [pointBalance, setPointBalance] = useState<number | null>(null);
  const [records, setRecords] = useState<PokerRecord[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const calculatePointBalance = () => {
    const balance = finalPoints - initialPoints * (addOns + 1);
    setPointBalance(balance);
    return balance;
  };

  const handleSubmit = async () => {
    if (!playerName || !date) {
      alert('プレイヤー名と日付を入力してください');
      return;
    }

    const balance = calculatePointBalance();
    setIsLoading(true);

    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
          date,
          initialPoints,
          finalPoints,
          addOns,
          pointBalance: balance
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'データの保存に失敗しました');
      }

      // データを再取得
      await loadPlayerData(playerName);

      // フォームをリセット
      setDate('');
      setInitialPoints(0);
      setFinalPoints(0);
      setAddOns(0);
      setPointBalance(null);

      // 成功メッセージを表示
      alert('データを保存しました');
    } catch (error) {
      console.error('Error saving record:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('データの保存中にエラーが発生しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlayerData = async (name: string) => {
    if (!name) return;
    
    setIsLoading(true);
    try {
      const [recordsResponse, statsResponse] = await Promise.all([
        fetch(`/api/records?playerName=${encodeURIComponent(name)}`),
        fetch(`/api/stats?playerName=${encodeURIComponent(name)}`)
      ]);

      if (!recordsResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [recordsData, statsData] = await Promise.all([
        recordsResponse.json(),
        statsResponse.json()
      ]);

      setRecords(recordsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading player data:', error);
      alert('データの読み込み中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (playerName) {
      loadPlayerData(playerName);
    }
  }, [playerName]);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">ポーカー成績トラッカー</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">プレイヤー名</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="プレイヤー名を入力"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">日付</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">初期持ち点</label>
            <input
              type="number"
              value={initialPoints}
              onChange={(e) => setInitialPoints(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">最終持ち点</label>
            <input
              type="number"
              value={finalPoints}
              onChange={(e) => setFinalPoints(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">アドオン回数</label>
            <input
              type="number"
              value={addOns}
              onChange={(e) => setAddOns(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
          >
            {isLoading ? '保存中...' : '記録を保存'}
          </button>
        </div>
        
        <div className="space-y-6">
          {/* 計算結果 */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">計算結果</h2>
            {pointBalance !== null && (
              <div className="text-2xl font-bold">
                ポイント収支: {pointBalance.toLocaleString()}
              </div>
            )}
          </div>

          {/* プレイヤー統計 */}
          {stats && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">統計情報</h2>
              <div className="space-y-2">
                <p>総ゲーム数: {stats.totalGames}</p>
                <p>合計収支: {stats.totalBalance.toLocaleString()}</p>
                <p>平均収支: {Math.round(stats.averageBalance).toLocaleString()}</p>
                <p>最高収支: {stats.bestBalance.toLocaleString()}</p>
                <p>最低収支: {stats.worstBalance.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* 履歴 */}
          {records.length > 0 && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">履歴</h2>
              <div className="space-y-4">
                {records.map((record) => (
                  <div key={record.id} className="border-b pb-2">
                    <div className="flex justify-between">
                      <span>{new Date(record.date).toLocaleDateString()}</span>
                      <span className={record.pointBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {record.pointBalance.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      初期: {record.initialPoints.toLocaleString()} / 
                      最終: {record.finalPoints.toLocaleString()} / 
                      アドオン: {record.addOns}回
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 