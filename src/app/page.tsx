'use client';

import { useState } from 'react';

export default function Home() {
  const [date, setDate] = useState<string>('');
  const [initialPoints, setInitialPoints] = useState<number>(0);
  const [finalPoints, setFinalPoints] = useState<number>(0);
  const [addOns, setAddOns] = useState<number>(0);
  const [pointBalance, setPointBalance] = useState<number | null>(null);

  const calculatePointBalance = () => {
    const balance = finalPoints - initialPoints * (addOns + 1);
    setPointBalance(balance);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">ポーカー成績トラッカー</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
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
            onClick={calculatePointBalance}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            計算する
          </button>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">計算結果</h2>
          {pointBalance !== null && (
            <div className="text-2xl font-bold">
              ポイント収支: {pointBalance.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 