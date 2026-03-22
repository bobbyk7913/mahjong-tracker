// src/components/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { History, TrendingUp, TrendingDown, Calendar, MapPin, Trophy, Trash2, Loader2 } from 'lucide-react';
import StatusModal from './StatusModal';

const Dashboard = ({ userId }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('ALL'); 
  const [modal, setModal] = useState({ 
    isOpen: false, type: 'loading', title: '', message: '', onConfirm: null 
  });

  useEffect(() => {
    const q = query(
      collection(db, "games"),
      orderBy("date", "desc"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGames(gamesData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1. 提取所有年份
  const availableYears = useMemo(() => {
    const years = new Set();
    games.forEach(g => {
      if (g.date) {
        const y = g.date.split('-')[0];
        if (y) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [games]);

  // 2. 💡 根據年份篩選戰報清單 (同步作用於榜單與列表)
  const filteredGames = useMemo(() => {
    if (selectedYear === 'ALL') return games;
    return games.filter(g => g.date && g.date.startsWith(selectedYear));
  }, [games, selectedYear]);

  // 3. 計算雀神榜 (基於篩選後的結果)
  const leaderboard = useMemo(() => {
    const scores = {};
    filteredGames.forEach(game => {
      game.players.forEach(p => {
        scores[p.name] = (scores[p.name] || 0) + p.score;
      });
    });

    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [filteredGames]);

  // 處理刪除
  const handleDeleteRequest = (gameId, date) => {
    setModal({
      isOpen: true, type: 'error', title: '確定刪除？',
      message: `確定要刪除 ${date} 的戰績嗎？`,
      onConfirm: () => performDelete(gameId)
    });
  };

  const performDelete = async (gameId) => {
    setModal({ isOpen: true, type: 'loading', title: '處理中', message: '正在抹除紀錄...' });
    try {
      await deleteDoc(doc(db, "games", gameId));
      setModal({ isOpen: true, type: 'success', title: '刪除成功', message: '戰績已移除。' });
    } catch (error) {
      setModal({ isOpen: true, type: 'error', title: '失敗', message: '網絡異常。' });
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-64 text-gray-400 gap-3">
      <Loader2 className="animate-spin" size={32} />
      <p className="font-black text-xs uppercase tracking-widest">正在獲取全體戰果...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      
      {/* 1. 雀神榜與年份篩選 */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 ml-2">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-500" size={24} />
            <h2 className="text-2xl font-black text-gray-800 tracking-tight italic uppercase">雀神榜 (Top 3)</h2>
          </div>

          {/* 年份 Filter Tab */}
          <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-[1.2rem] self-start overflow-x-auto max-w-full no-scrollbar">
            <button 
              onClick={() => setSelectedYear('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${selectedYear === 'ALL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              總榜
            </button>
            {availableYears.map(year => (
              <button 
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${selectedYear === year ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {leaderboard.length > 0 ? (
            leaderboard.map(([name, score], index) => (
              <div key={name} className={`relative overflow-hidden p-6 rounded-[2.5rem] border transition-all hover:scale-[1.02] ${
                index === 0 ? 'bg-gray-900 text-white border-gray-800 shadow-xl' : 'bg-white border-gray-100 shadow-sm'
              }`}>
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${
                      index === 0 ? 'bg-amber-500 text-black' : 'bg-gray-100 text-gray-500'
                    }`}>RANK #{index + 1}</span>
                    {score >= 0 ? <TrendingUp size={20} className="text-green-500" /> : <TrendingDown size={20} className="text-red-500" />}
                  </div>
                  <h3 className="text-2xl font-black mt-4 truncate">{name}</h3>
                  <p className={`text-3xl font-black mt-1 ${index === 0 ? 'text-amber-400' : 'text-green-600'}`}>
                    {score > 0 ? `+${score}` : score}
                  </p>
                </div>
                <div className="absolute -right-2 -bottom-6 text-9xl font-black opacity-[0.05] pointer-events-none">{index + 1}</div>
              </div>
            ))
          ) : (
            <div className="md:col-span-3 py-10 text-center text-gray-400 font-bold italic">該年度暫無戰績</div>
          )}
        </div>
      </section>

      {/* 2. 篩選後的戰報列表 */}
      <section>
        <div className="flex items-center gap-2 mb-6 ml-2">
          <History className="text-blue-500" size={22} />
          <h2 className="text-xl font-black text-gray-800 tracking-tight italic uppercase">
            {selectedYear === 'ALL' ? '全體' : `${selectedYear} 年`} 戰報 ({filteredGames.length})
          </h2>
        </div>
        
        <div className="space-y-4">
          {filteredGames.length > 0 ? (
            filteredGames.map((game) => (
              <div key={game.id} className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
                <div className="flex justify-between items-start mb-6 border-b border-gray-50 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-50 text-blue-600 p-2.5 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-800">{game.date}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-400 font-bold">
                        <MapPin size={12} /> {game.location}
                      </div>
                    </div>
                  </div>
                  {game.userId === userId && (
                    <button 
                      onClick={() => handleDeleteRequest(game.id, game.date)}
                      className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {game.players.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-50">
                      <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-xs font-black text-gray-400 border border-gray-100">
                        {p.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-gray-400 truncate uppercase leading-none">{p.name}</p>
                        <p className={`text-lg font-black mt-0.5 ${p.score > 0 ? 'text-green-600' : p.score < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {p.score > 0 ? `+${p.score}` : p.score}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-bold italic uppercase tracking-widest">此年份尚未有戰績紀錄 🀄</p>
            </div>
          )}
        </div>
      </section>

      <StatusModal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />
    </div>
  );
};

export default Dashboard;