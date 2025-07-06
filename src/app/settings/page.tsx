'use client';

import { useState, useEffect } from 'react';
import { Settings, Player } from '@/types/poker';
import Link from 'next/link';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ players: [], defaultInitialPoints: 20000 });
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newInitialPoints, setNewInitialPoints] = useState(20000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [settingsResponse, playersResponse] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/players')
      ]);

      if (!settingsResponse.ok || !playersResponse.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const [settingsData, playersData] = await Promise.all([
        settingsResponse.json(),
        playersResponse.json()
      ]);

      setSettings(settingsData);
      setPlayers(playersData);
      setNewInitialPoints(settingsData.defaultInitialPoints);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('データの読み込み中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const addPlayer = async () => {
    if (!newPlayerName.trim()) {
      setError('プレイヤー名を入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newPlayerName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'プレイヤーの追加に失敗しました');
      }

      setNewPlayerName('');
      setSuccess('プレイヤーを追加しました');
      await loadData();
    } catch (error) {
      console.error('Error adding player:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('プレイヤーの追加中にエラーが発生しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deletePlayer = async (id: string) => {
    if (!confirm('このプレイヤーを削除しますか？')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/players', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'プレイヤーの削除に失敗しました');
      }

      setSuccess('プレイヤーを削除しました');
      await loadData();
    } catch (error) {
      console.error('Error deleting player:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('プレイヤーの削除中にエラーが発生しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateInitialPoints = async () => {
    if (newInitialPoints <= 0) {
      setError('初期持ち点は正の数値で入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ defaultInitialPoints: newInitialPoints }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '設定の更新に失敗しました');
      }

      setSuccess('初期持ち点を更新しました');
      await loadData();
    } catch (error) {
      console.error('Error updating settings:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('設定の更新中にエラーが発生しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">設定</h1>
        <Link 
          href="/"
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
        >
          戻る
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* プレイヤー管理 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">プレイヤー管理</h2>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="プレイヤー名を入力"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
              />
              <button
                onClick={addPlayer}
                disabled={isLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
              >
                追加
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">登録済みプレイヤー</h3>
              {players.length === 0 ? (
                <p className="text-gray-500">プレイヤーが登録されていません</p>
              ) : (
                <div className="space-y-2">
                  {players.map((player) => (
                    <div key={player.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{player.name}</span>
                      <button
                        onClick={() => deletePlayer(player.id)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-800 disabled:text-red-300"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 初期持ち点設定 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">初期持ち点設定</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                デフォルト初期持ち点
              </label>
              <input
                type="number"
                value={newInitialPoints}
                onChange={(e) => setNewInitialPoints(Number(e.target.value))}
                min="1"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={updateInitialPoints}
              disabled={isLoading}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors disabled:bg-green-300"
            >
              {isLoading ? '更新中...' : '更新'}
            </button>

            <div className="text-sm text-gray-600">
              <p>現在の設定: {settings.defaultInitialPoints.toLocaleString()}ポイント</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 