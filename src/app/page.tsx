'use client';

import { useState, useEffect } from 'react';
import { PokerRecord, PlayerStats, Settings, Player } from '@/types/poker';
import Link from 'next/link';
import DailyRecords from '@/components/DailyRecords';

export default function Home() {
  const [playerName, setPlayerName] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [initialPoints, setInitialPoints] = useState<number>(20000);
  const [finalPoints, setFinalPoints] = useState<number>(0);
  const [addOns, setAddOns] = useState<number>(0);
  const [pointBalance, setPointBalance] = useState<number | null>(null);
  const [records, setRecords] = useState<PokerRecord[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<Settings>({ players: [], defaultInitialPoints: 20000 });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlayersAndSettings();
  }, []);

  useEffect(() => {
    if (playerName) {
      loadPlayerData(playerName);
    } else {
      setRecords([]);
      setStats(null);
    }
  }, [playerName]);

  const loadPlayersAndSettings = async () => {
    try {
      const [playersResponse, settingsResponse] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/settings')
      ]);

      if (playersResponse.ok && settingsResponse.ok) {
        const [playersData, settingsData] = await Promise.all([
          playersResponse.json(),
          settingsResponse.json()
        ]);

        setPlayers(playersData);
        setSettings(settingsData);
        setInitialPoints(settingsData.defaultInitialPoints);
      }
    } catch (error) {
      console.error('Error loading players and settings:', error);
    }
  };

  const calculatePointBalance = () => {
    const balance = finalPoints - initialPoints * (addOns + 1);
    setPointBalance(balance);
    return balance;
  };

  const handleSubmit = async () => {
    if (!playerName || !date) {
      setError('プレイヤー名と日付を入力してください');
      return;
    }

    const balance = calculatePointBalance();
    setIsLoading(true);
    setError(null);

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
      setDate(new Date().toISOString().split('T')[0]);
      setInitialPoints(settings.defaultInitialPoints);
      setFinalPoints(0);
      setAddOns(0);
      setPointBalance(null);

      // 成功メッセージを表示
      alert('データを保存しました');
    } catch (error) {
      console.error('Error saving record:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('データの保存中にエラーが発生しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlayerData = async (name: string) => {
    if (!name) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const [recordsResponse, statsResponse] = await Promise.all([
        fetch(`/api/records?playerName=${encodeURIComponent(name)}`),
        fetch(`/api/stats?playerName=${encodeURIComponent(name)}`)
      ]);

      if (!recordsResponse.ok || !statsResponse.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const [recordsData, statsData] = await Promise.all([
        recordsResponse.json(),
        statsResponse.json()
      ]);

      setRecords(recordsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading player data:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('データの読み込み中にエラーが発生しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">ポーカー成績トラッカー</h1>
        <Link 
          href="/settings"
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
        >
          設定
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 記録入力フォーム */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">記録入力</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">プレイヤー名</label>
                <select
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">プレイヤーを選択してください</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.name}>
                      {player.name}
                    </option>
                  ))}
                </select>
                {players.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    プレイヤーが登録されていません。
                    <Link href="/settings" className="text-blue-500 hover:underline">
                      設定ページ
                    </Link>
                    で追加してください。
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">日付</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">初期持ち点</label>
                <input
                  type="number"
                  value={initialPoints}
                  onChange={(e) => setInitialPoints(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">最終持ち点</label>
                <input
                  type="number"
                  value={finalPoints}
                  onChange={(e) => setFinalPoints(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">アドオン回数</label>
                <input
                  type="number"
                  value={addOns}
                  onChange={(e) => setAddOns(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                />
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={isLoading || !playerName}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
              >
                {isLoading ? '保存中...' : '記録を保存'}
              </button>

              {/* 計算結果 */}
              {pointBalance !== null && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">計算結果</h3>
                  <div className={`text-xl font-bold ${pointBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ポイント収支: {pointBalance.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右側のコンテンツ */}
        <div className="lg:col-span-2 space-y-8">
          {/* 日別記録 */}
          <DailyRecords 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />

          {/* プレイヤー統計 */}
          {stats && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">{playerName} の統計情報</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalGames}</div>
                  <div className="text-sm text-gray-600">総ゲーム数</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${stats.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.totalBalance.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">合計収支</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${stats.averageBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.round(stats.averageBalance).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">平均収支</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.bestBalance.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">最高収支</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.worstBalance.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">最低収支</div>
                </div>
              </div>
            </div>
          )}

          {/* 個人履歴 */}
          {playerName && records.length > 0 && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">{playerName} の履歴</h2>
              <div className="space-y-3">
                {records.slice(0, 10).map((record) => (
                  <div key={record.id} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{new Date(record.date).toLocaleDateString()}</span>
                      <span className={`font-bold ${record.pointBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {record.pointBalance >= 0 ? '+' : ''}{record.pointBalance.toLocaleString()}
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