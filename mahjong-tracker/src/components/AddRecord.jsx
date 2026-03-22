// src/components/AddRecord.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  MapPin, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  ChevronDown, 
  Wand2, 
  User2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  UserPlus, 
  UserMinus 
} from 'lucide-react';
import StatusModal from './StatusModal';

const AddRecord = ({ userId }) => {
  const getLocalDateString = (date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const todayStr = getLocalDateString(new Date());
  const yesterdayStr = getLocalDateString(new Date(Date.now() - 86400000));

  const [location, setLocation] = useState('');
  const [gameDate, setGameDate] = useState(todayStr);
  
  // 💡 初始化預設 4 位玩家
  const [players, setPlayers] = useState([
    { name: '', score: 0 }, { name: '', score: 0 }, { name: '', score: 0 }, { name: '', score: 0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); 

  const [modal, setModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [historyLocations, setHistoryLocations] = useState([]);
  const [historyPlayerNames, setHistoryPlayerNames] = useState([]);
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);
  const [activePlayerSuggestIdx, setActivePlayerSuggestIdx] = useState(null);

  useEffect(() => {
    const handleResize = () => setKeyboardVisible(window.innerHeight < 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(collection(db, "games"));
        const querySnapshot = await getDocs(q);
        const locSet = new Set();
        const nameSet = new Set();
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.location) locSet.add(data.location);
          if (data.players) data.players.forEach(p => { if (p.name) nameSet.add(p.name); });
        });
        setHistoryLocations(Array.from(locSet).sort());
        setHistoryPlayerNames(Array.from(nameSet).sort());
      } catch (e) { console.error(e); }
    };
    fetchHistory();
  }, []);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const y = year;
      const m = String(month + 1).padStart(2, '0');
      const d = String(i).padStart(2, '0');
      days.push({ day: i, fullStr: `${y}-${m}-${d}` });
    }
    while (days.length < 42) days.push(null);
    return days;
  }, [viewDate]);

  const changeMonth = (offset) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const totalScore = players.reduce((acc, curr) => acc + (parseInt(curr.score) || 0), 0);
  const isReadyToSave = location.trim() !== '' && totalScore === 0 && players.every(p => p.name.trim() !== '');
  const suggestedScore = totalScore * -1;

  const handlePlayerChange = (index, field, value) => {
    const newPlayers = [...players];
    if (field === 'score') {
      newPlayers[index][field] = value === '' || value === '-' ? value : parseInt(value) || 0;
    } else {
      newPlayers[index][field] = value;
    }
    setPlayers(newPlayers);
  };

  // 💡 新增玩家 (上限 12 人)
  const addPlayer = () => {
    if (players.length < 12) {
      setPlayers([...players, { name: '', score: 0 }]);
    }
  };

  // 💡 移除玩家 (限制最少 4 人)
  const removePlayer = (index) => {
    if (players.length > 4) {
      const newPlayers = players.filter((_, i) => i !== index);
      setPlayers(newPlayers);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isReadyToSave) return;
    setLoading(true);
    setModal({ isOpen: true, type: 'loading', title: '處理中', message: '正在同步戰績...' });
    try {
      await addDoc(collection(db, "games"), {
        userId,
        location: location.trim(),
        players: players.map(p => ({ ...p, score: parseInt(p.score) || 0 })),
        date: gameDate,
        createdAt: serverTimestamp()
      });
      setModal({ isOpen: true, type: 'success', title: '紀錄成功！', message: '戰績已儲存。' });
      
      // 💡 成功後重設為 4 位空白玩家
      setLocation('');
      setPlayers([
        { name: '', score: 0 }, { name: '', score: 0 }, { name: '', score: 0 }, { name: '', score: 0 }
      ]);
    } catch (error) {
      setModal({ isOpen: true, type: 'error', title: '失敗', message: '網絡異常。' });
    } finally { setLoading(false); }
  };

  return (
    <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 relative px-2 md:px-0 ${isKeyboardVisible ? 'pb-10' : 'pb-44'}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* 地點與日期 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <div className={`bg-white p-4 rounded-2xl shadow-sm border transition-all focus-within:ring-2 ring-green-500 flex flex-col justify-between h-[104px] ${!location.trim() ? 'border-amber-100 bg-amber-50/30' : 'border-gray-100'}`}>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <MapPin size={12} /> 打牌地點
              </span>
              <input 
                type="text" placeholder="輸入地點" value={location}
                className="w-full outline-none font-black text-xl text-gray-800 bg-transparent py-1"
                onChange={(e) => setLocation(e.target.value)}
                onFocus={() => setShowLocSuggestions(true)}
                onBlur={() => setTimeout(() => setShowLocSuggestions(false), 300)}
              />
            </div>
            {showLocSuggestions && historyLocations.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-2 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-2xl max-h-40 overflow-y-auto">
                {historyLocations.filter(loc => loc.toLowerCase().includes(location.toLowerCase())).map((loc, i) => (
                  <div key={i} className="px-5 py-3 hover:bg-green-50 border-b border-gray-50 last:border-none font-bold text-gray-600 flex items-center gap-2 cursor-pointer" onMouseDown={() => setLocation(loc)}>
                    <span className="opacity-30">📍</span> {loc}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-[104px]">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <CalendarIcon size={12} /> 戰役日期
              </span>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setGameDate(todayStr)} className={`px-2 py-0.5 rounded-lg text-[9px] font-black transition-all ${gameDate === todayStr ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>今日</button>
                <button type="button" onClick={() => setGameDate(yesterdayStr)} className={`px-2 py-0.5 rounded-lg text-[9px] font-black transition-all ${gameDate === yesterdayStr ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>尋日</button>
              </div>
            </div>
            <div onClick={() => setIsDatePickerOpen(true)} className="flex items-center justify-between cursor-pointer active:opacity-50 transition-opacity">
              <span className="font-black text-xl text-gray-800 tracking-tight py-1">{gameDate}</span>
              <div className="text-green-600 font-bold text-[10px] bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1">
                修改日期 <ChevronDown size={12} />
              </div>
            </div>
          </div>
        </div>

        {/* 玩家入分區 - 支援動態增減 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {players.map((player, index) => (
            <div key={index} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4 relative animate-in zoom-in-95 duration-200">
              
              {/* 💡 更加明顯的移除按鈕 */}
              {players.length > 4 && (
                <button 
                  type="button" 
                  onClick={() => removePlayer(index)}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 active:scale-90 transition-all z-10 border-2 border-white"
                  title="移除玩家"
                >
                  <UserMinus size={14} strokeWidth={3} />
                </button>
              )}

              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <User2 size={12} className="text-gray-300" />
                  <input 
                    type="text" placeholder={`玩家 ${index + 1}`} value={player.name}
                    className="w-full outline-none text-xs font-black text-gray-500 uppercase tracking-widest bg-transparent border-b border-gray-50 focus:border-green-300 transition-colors"
                    onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                    onFocus={() => setActivePlayerSuggestIdx(index)}
                    onBlur={() => setTimeout(() => setActivePlayerSuggestIdx(null), 300)}
                  />
                </div>
                {activePlayerSuggestIdx === index && historyPlayerNames.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white/95 backdrop-blur-md border border-gray-100 rounded-xl shadow-2xl max-h-32 overflow-y-auto">
                    {historyPlayerNames.filter(n => n.toLowerCase().includes(player.name.toLowerCase())).map((name, i) => (
                      <div key={i} className="px-4 py-2 hover:bg-green-50 border-b border-gray-50 font-bold text-gray-600 flex items-center gap-2 text-sm cursor-pointer" onMouseDown={() => handlePlayerChange(index, 'name', name)}>
                        <span className="opacity-30 text-xs">👤</span> {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <input 
                  type="number" inputMode="numeric" placeholder="0" value={player.score} 
                  className={`w-full py-8 rounded-3xl text-5xl font-black text-center transition-all outline-none ${player.score > 0 ? 'bg-green-50 text-green-600' : player.score < 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-200'}`}
                  onChange={(e) => handlePlayerChange(index, 'score', e.target.value)}
                  onFocus={(e) => e.target.select()} 
                />
                {(player.score === 0 || player.score === '') && suggestedScore !== 0 && (
                  <button type="button" onClick={() => handlePlayerChange(index, 'score', suggestedScore)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-2xl text-sm font-black text-amber-600 shadow-xl border border-amber-100 flex items-center gap-1 animate-in zoom-in-50"><Wand2 size={14} className="animate-pulse" /> {suggestedScore > 0 ? `+${suggestedScore}` : suggestedScore}</button>
                )}
              </div>
            </div>
          ))}

          {/* 新增玩家掣 */}
          {players.length < 12 && (
            <button 
              type="button"
              onClick={addPlayer}
              className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-2 text-gray-300 hover:border-green-200 hover:text-green-500 transition-all active:scale-95 min-h-[160px]"
            >
              <UserPlus size={24} />
              <span className="font-black text-xs uppercase tracking-widest">新增玩家 (支援 5 人或以上)</span>
            </button>
          )}
        </div>

        {/* 底部 Bar */}
        {!isKeyboardVisible && (
          <div className="fixed bottom-0 left-0 right-0 lg:left-64 p-4 bg-gray-50/80 backdrop-blur-md z-40 animate-in slide-in-from-bottom-10">
            <div className="max-w-4xl mx-auto bg-gray-900 rounded-[2.5rem] p-5 shadow-2xl flex items-center justify-between gap-4 border border-white/10 relative overflow-hidden">
              <div className="flex items-center gap-4 ml-2">
                <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center transition-all duration-500 ${totalScore === 0 ? 'bg-green-500 rotate-[360deg]' : 'bg-amber-500 rotate-0'}`}><CheckCircle2 className="text-white" size={28} /></div>
                <div>
                  <div className={`text-3xl font-black leading-none tracking-tighter ${totalScore === 0 ? 'text-white' : 'text-amber-400'}`}>{totalScore > 0 ? `+${totalScore}` : totalScore}</div>
                  <div className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest opacity-80">{totalScore !== 0 ? `差額回補 ${suggestedScore}` : '分數已平'}</div>
                </div>
              </div>
              <button type="submit" disabled={loading || !isReadyToSave} className={`px-10 py-5 rounded-[1.5rem] font-black transition-all active:scale-90 ${isReadyToSave && !loading ? 'bg-green-500 text-white shadow-xl shadow-green-900/40' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>儲存成績</button>
            </div>
          </div>
        )}
      </form>

      {/* 自定義月曆 */}
      {isDatePickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsDatePickerOpen(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col h-[480px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">選擇日期</h3>
              <button onClick={() => setIsDatePickerOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-800 transition-colors"><X size={20} /></button>
            </div>
            <div className="flex items-center justify-between mb-6 bg-gray-50 p-2 rounded-2xl">
              <button type="button" onClick={() => changeMonth(-1)} className="p-3 hover:bg-white rounded-xl transition-all"><ChevronLeft size={20} /></button>
              <div className="font-black text-gray-800 text-sm">{viewDate.toLocaleString('zh-HK', { month: 'long', year: 'numeric' })}</div>
              <button type="button" onClick={() => changeMonth(1)} className="p-3 hover:bg-white rounded-xl transition-all"><ChevronRight size={20} /></button>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['日','一','二','三','四','五','六'].map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-gray-300 py-2 uppercase tracking-widest">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => (
                  <div key={idx} className="aspect-square flex items-center justify-center">
                    {day ? (
                      <button
                        type="button"
                        onClick={() => { setGameDate(day.fullStr); setIsDatePickerOpen(false); }}
                        className={`w-10 h-10 rounded-xl font-bold transition-all flex items-center justify-center text-sm
                          ${gameDate === day.fullStr ? 'bg-green-600 text-white shadow-lg shadow-green-100 scale-110' : 'text-gray-600 hover:bg-green-50'}
                          ${day.fullStr === todayStr ? 'border-2 border-green-100' : ''}`}
                      >
                        {day.day}
                      </button>
                    ) : (
                      <div className="w-10 h-10" /> 
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <StatusModal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />
    </div>
  );
};

export default AddRecord;