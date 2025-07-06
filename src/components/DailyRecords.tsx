'use client';

import { useState, useEffect } from 'react';
import { PokerRecord } from '@/types/poker';

interface DailyRecordsProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DailyRecords({ selectedDate, onDateChange }: DailyRecordsProps) {
  const [dailyRecords, setDailyRecords] = useState<PokerRecord[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableDates();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadDailyRecords(selectedDate);
    }
  }, [selectedDate]);

  const loadAvailableDates = async () => {
    try {
      const response = await fetch('/api/dates');
      if (response.ok) {
        const dates = await response.json();
        setAvailableDates(dates);
        
        // 最新の日付を自動選択
        if (dates.length > 0 && !selectedDate) {
          onDateChange(dates[0]);
        }
      }
    } catch (error) {
      console.error('日付一覧の取得に失敗しました:', error);
    }
  };

  const loadDailyRecords = async (date: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/daily-records?date=${encodeURIComponent(date)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '日別記録の取得に失敗しました');
      }
      
      const records = await response.json();
      setDailyRecords(records);
    } catch (error) {
      console.error('日別記録の取得エラー:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('日別記録の取得中にエラーが発生しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 合計収支を計算
  const totalBalance = dailyRecords.reduce((sum, record) => sum + record.pointBalance, 0);

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">日別記録</h2>
      
      {/* 日付選択 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          日付を選択
        </label>
        <select
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">日付を選択してください</option>
          {availableDates.map((date) => (
            <option key={date} value={date}>
              {new Date(date).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short'
              })}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      ) : selectedDate ? (
        <div className="space-y-4">
          {/* 合計収支 */}
          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold text-lg mb-2">
              {new Date(selectedDate).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short'
              })} の結果
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">参加人数:</span>
                <span className="ml-2 font-medium">{dailyRecords.length}人</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">合計収支:</span>
                <span className={`ml-2 font-bold text-lg ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 個別記録 */}
          {dailyRecords.length === 0 ? (
            <p className="text-gray-500 text-center py-4">この日の記録はありません</p>
          ) : (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">個別結果</h4>
              {dailyRecords.map((record) => (
                <div key={record.id} className="bg-white p-4 rounded border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-semibold text-lg">{record.playerName}</h5>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>初期持ち点: {record.initialPoints.toLocaleString()}</div>
                        <div>最終持ち点: {record.finalPoints.toLocaleString()}</div>
                        <div>アドオン回数: {record.addOns}回</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${record.pointBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {record.pointBalance >= 0 ? '+' : ''}{record.pointBalance.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(record.createdAt).toLocaleTimeString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">日付を選択してください</p>
      )}
    </div>
  );
} 