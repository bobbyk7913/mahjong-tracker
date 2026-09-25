// src/components/Analytics.jsx (完整功能版)
import React, { useMemo } from 'react';
import { Heart, Swords } from 'lucide-react';
import { useGamesData } from '../hooks/useGamesData';
import { calculatePlayerStats } from '../utils/analytics';

const Analytics = () => {
  const { data: records, loading } = useGamesData();
  const { sortedPlayers, playerRelations } = useMemo(() => calculatePlayerStats(records), [records]);

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-gray-400">大數據運算中...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 px-2">
      <div className="grid grid-cols-1 gap-8">
        {sortedPlayers.map(([name, data]) => {
          const winRate = ((data.wins / data.games) * 100).toFixed(1);
          const avg = (data.total / data.games).toFixed(0);
          const trendSum = data.recentScores.reduce((a, b) => a + b, 0);
          const relations = playerRelations[name];

          return (
            <div key={name} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative group transition-all hover:shadow-xl">
              {/* Header 部份 */}
              <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl font-black italic shadow-lg">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-black text-gray-800">{name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        trendSum > 0 ? 'bg-green-100 text-green-700' : trendSum < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {trendSum > 0 ? '📈 手風順' : trendSum < 0 ? '📉 低潮期' : '➖ 平穩'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">{data.games} 場比賽</p>
                  </div>
                </div>
                <div className="md:text-right">
                  <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">CUMULATIVE</div>
                  <div className={`text-4xl font-black ${data.total >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {data.total > 0 ? `+${data.total}` : data.total}
                  </div>
                </div>
              </div>

              {/* 核心數據格仔 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">勝率</p>
                  <p className="text-xl font-black text-gray-800">{winRate}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">平均得分</p>
                  <p className={`text-xl font-black ${avg >= 0 ? 'text-green-600' : 'text-red-500'}`}>{avg}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">單場最高</p>
                  <p className="text-xl font-black text-green-600">+{data.maxWin}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">最傷一場</p>
                  <p className="text-xl font-black text-red-600">{data.maxLoss}</p>
                </div>
              </div>

              {/* 關係分析 (新功能) */}
              {relations && relations.best && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-dashed border-gray-200 pt-6">
                  <div className="flex items-center gap-4 bg-green-50/50 p-4 rounded-2xl border border-green-100">
                    <div className="bg-green-500 text-white p-2 rounded-xl shadow-md"><Heart size={18} fill="currentColor" /></div>
                    <div>
                      <p className="text-[10px] font-black text-green-600 uppercase">最佳拍檔 (Lucky Charm)</p>
                      <p className="text-lg font-black text-gray-800">同 <span className="text-green-600">{relations.best.partner}</span> 一齊打最旺</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-red-50/50 p-4 rounded-2xl border border-red-100">
                    <div className="bg-red-500 text-white p-2 rounded-xl shadow-md"><Swords size={18} /></div>
                    <div>
                      <p className="text-[10px] font-black text-red-600 uppercase">宿命對手 (Kryptonite)</p>
                      <p className="text-lg font-black text-gray-800">遇到 <span className="text-red-600">{relations.worst.partner}</span> 就要小心</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Analytics;