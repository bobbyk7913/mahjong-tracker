import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, writeBatch, doc, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { Wand2, Users, MapPin, AlertTriangle, FileUp, Database, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import StatusModal from './StatusModal';

const Tools = ({ userId }) => {
  const [games, setGames] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, type: 'loading', title: '', message: '' });
  const [loadingData, setLoadingData] = useState(true);

  // 1. 實時監聽所有戰績，用嚟整 Dropdown List
  useEffect(() => {
    const q = query(collection(db, "games"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setGames(data);
      setLoadingData(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. 💡 提取所有不重複的玩家名同地點名
  const { allPlayers, allLocations } = useMemo(() => {
    const players = new Set();
    const locations = new Set();
    games.forEach(g => {
      if (g.location) locations.add(g.location);
      if (g.players) {
        g.players.forEach(p => players.add(p.name));
      }
    });
    return {
      allPlayers: Array.from(players).sort(),
      allLocations: Array.from(locations).sort()
    };
  }, [games]);

  // --- 原有的 Excel 匯入邏輯 (省略部分代碼以保持簡潔) ---
  const handleExcelImport = async (evt) => { /* ...保持不變... */ };

  // --- 3. 修改後的批量更新邏輯 ---
  const [targetNames, setTargetNames] = useState({ oldPlayer: '', newPlayer: '', oldLoc: '', newLoc: '' });

  const handleBatchRename = async (type) => {
    const oldVal = type === 'PLAYER' ? targetNames.oldPlayer : targetNames.oldLoc;
    const newVal = type === 'PLAYER' ? targetNames.newPlayer : targetNames.newLoc;

    if (!oldVal || !newVal) {
      setModal({ isOpen: true, type: 'error', title: '錯誤', message: '請選擇舊名稱並輸入新名稱' });
      return;
    }

    setModal({ isOpen: true, type: 'loading', title: '處理中', message: '正在更新全體紀錄...' });

    try {
      const q = query(collection(db, "games"));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      let count = 0;

      querySnapshot.forEach((gameDoc) => {
        const data = gameDoc.data();
        let hasChanged = false;
        const gameRef = doc(db, "games", gameDoc.id);

        if (type === 'PLAYER') {
          const updatedPlayers = data.players.map(p => {
            if (p.name === oldVal) { hasChanged = true; return { ...p, name: newVal }; }
            return p;
          });
          if (hasChanged) { batch.update(gameRef, { players: updatedPlayers }); count++; }
        } else {
          if (data.location === oldVal) { batch.update(gameRef, { location: newVal }); count++; }
        }
      });

      if (count > 0) {
        await batch.commit();
        setModal({ isOpen: true, type: 'success', title: '更新完成', message: `已成功修改 ${count} 條紀錄！` });
        setTargetNames({ ...targetNames, [type === 'PLAYER' ? 'newPlayer' : 'newLoc']: '' });
      }
    } catch (e) {
      setModal({ isOpen: true, type: 'error', title: '失敗', message: '更新失敗' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* 警告卡片 */}
      <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex items-start gap-4">
        <AlertTriangle className="text-amber-500 shrink-0" size={24} />
        <p className="text-xs text-amber-700 font-bold leading-relaxed">
          這是管理員工具。下拉選單會自動顯示目前資料庫中存在的名稱。
        </p>
      </div>

      {/* 1. 數據匯入 (保持不變) */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <FileUp className="text-blue-500" size={20} />
          <h3 className="font-black text-gray-800 uppercase tracking-widest text-sm">歷史數據遷移 (Excel)</h3>
        </div>
        <label className="block w-full border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:bg-gray-50 transition-colors">
          <input type="file" className="hidden" accept=".xlsx" onChange={handleExcelImport} />
          <div className="font-black text-gray-400">點擊上傳 .xlsx 文件</div>
        </label>
      </section>

      {/* 2. 玩家/地點修正 - 改用 Dropdown */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 玩家改名 */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-green-500" size={20} />
            <h3 className="font-black text-gray-800 uppercase text-sm">全域玩家改名</h3>
          </div>
          
          <select 
            className="w-full p-4 bg-gray-50 rounded-xl outline-none font-bold text-sm appearance-none"
            value={targetNames.oldPlayer}
            onChange={(e) => setTargetNames({...targetNames, oldPlayer: e.target.value})}
          >
            <option value="">請選擇要修改的玩家</option>
            {allPlayers.map(name => <option key={name} value={name}>{name}</option>)}
          </select>

          <div className="flex gap-2">
            <input 
              placeholder="輸入新名稱" 
              className="flex-1 p-4 bg-gray-50 rounded-xl outline-none font-bold text-sm focus:ring-2 ring-green-500"
              value={targetNames.newPlayer}
              onChange={(e) => setTargetNames({...targetNames, newPlayer: e.target.value})}
            />
            <button onClick={() => handleBatchRename('PLAYER')} className="bg-gray-900 text-white px-6 rounded-xl font-black text-xs hover:bg-black transition-all">執行</button>
          </div>
        </div>

        {/* 地點改名 */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="text-red-500" size={20} />
            <h3 className="font-black text-gray-800 uppercase text-sm">全域地點更正</h3>
          </div>

          <select 
            className="w-full p-4 bg-gray-50 rounded-xl outline-none font-bold text-sm appearance-none"
            value={targetNames.oldLoc}
            onChange={(e) => setTargetNames({...targetNames, oldLoc: e.target.value})}
          >
            <option value="">請選擇要修改的地點</option>
            {allLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>

          <div className="flex gap-2">
            <input 
              placeholder="輸入新地點名" 
              className="flex-1 p-4 bg-gray-50 rounded-xl outline-none font-bold text-sm focus:ring-2 ring-red-500"
              value={targetNames.newLoc}
              onChange={(e) => setTargetNames({...targetNames, newLoc: e.target.value})}
            />
            <button onClick={() => handleBatchRename('LOCATION')} className="bg-gray-900 text-white px-6 rounded-xl font-black text-xs hover:bg-black transition-all">執行</button>
          </div>
        </div>
      </section>

      <StatusModal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />
    </div>
  );
};

export default Tools;