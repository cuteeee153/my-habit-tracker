import React, { useState, useMemo, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

// --- 0. Supabase 配置 (自動從 Vercel 的環境變數讀取) ---
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 識別使用者 ID (目前先固定為 my_perfect_tracker)
const USER_ID = 'my_perfect_tracker_user'; 

export default function App() {
  // --- 1. 核心數據狀態 ---
  const [habits, setHabits] = useState([]);
  const [history, setHistory] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [selectedId, setSelectedId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [editingColorId, setEditingColorId] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('rgba(186, 230, 253, 0.6)');

  const presetColors = [
    'rgba(251, 207, 232, 0.6)', 'rgba(186, 230, 253, 0.6)', 
    'rgba(209, 250, 229, 0.6)', 'rgba(254, 243, 199, 0.6)', 'rgba(237, 233, 254, 0.6)'
  ];

  // --- 2. 雲端同步邏輯 (Supabase) ---

  // 從雲端抓取資料
  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('habits_data')
          .select('data')
          .eq('user_id', USER_ID)
          .single();

        if (data && data.data) {
          setHabits(data.data.habits || []);
          setHistory(data.data.history || {});
        } else if (error && (error.code === 'PGRST116' || error.message.includes('No rows'))) {
          // 如果資料表是空的，初始化預設值
          setHabits([
            { id: 1, name: 'Water', color: 'rgba(186, 230, 253, 0.6)' },
            { id: 2, name: 'Breakfast', color: 'rgba(251, 207, 232, 0.6)' }
          ]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // 當資料變動時，自動同步到雲端 (Debounce 1秒避免頻繁請求)
  useEffect(() => {
    if (isLoading) return;
    
    async function saveData() {
      await supabase
        .from('habits_data')
        .upsert({ 
          user_id: USER_ID, 
          data: { habits, history } 
        }, { onConflict: 'user_id' });
    }
    const handler = setTimeout(saveData, 1000);
    return () => clearTimeout(handler);
  }, [habits, history, isLoading]);

  // --- 3. 日曆與互動邏輯 ---
  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthShort = viewDate.toLocaleString('en-US', { month: 'short' }); 
    return { year, month, firstDay, daysInMonth, monthShort };
  }, [viewDate]);

  const toggleDay = (day) => {
    if (!selectedId) return;
    const dateKey = `${calendarData.year}-${calendarData.month + 1}-${day}`;
    const current = history[dateKey] || [];
    setHistory({
      ...history,
      [dateKey]: current.includes(selectedId) ? current.filter(id => id !== selectedId) : [...current, selectedId]
    });
  };

  const onDragStart = (e, index) => { 
    setDraggedIndex(index); 
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (index) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const newHabits = [...habits];
    const item = newHabits[draggedIndex];
    newHabits.splice(draggedIndex, 1);
    newHabits.splice(index, 0, item);
    setDraggedIndex(index);
    setHabits(newHabits);
  };

  // --- SVG 組件 (視覺細節) ---
  const DragHandleIcon = () => (
    <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
      <line x1="0" y1="1" x2="20" y2="1" stroke="#CCC" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="0" y1="6" x2="20" y2="6" stroke="#CCC" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="0" y1="11" x2="20" y2="11" stroke="#CCC" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );

  const TrashIcon = () => (
    <svg width="22" height="22" viewBox="0 0 512 512">
      <path d="M112,112l20,320c.95,18.49,14.4,32,32,32H348c17.67,0,30.87-13.51,32-32l20-320" fill="none" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/>
      <line x1="80" y1="112" x2="432" y2="112" fill="none" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/>
      <path d="M192,112V72h0a23.93,23.93,0,0,1,24-24h80a23.93,23.93,0,0,1,24,24h0v40" fill="none" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/>
      <line x1="256" y1="176" x2="256" y2="400" fill="none" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/>
      <line x1="184" y1="176" x2="192" y2="400" fill="none" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/>
      <line x1="328" y1="176" x2="320" y2="400" fill="none" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/>
    </svg>
  );

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: '900', letterSpacing: '2px' }}>LOADING...</div>;

  return (
    <div style={{ padding: '24px', fontFamily: '-apple-system, sans-serif', maxWidth: '450px', margin: 'auto', minHeight: '100vh', backgroundColor: '#FFF', color: '#1A1A1A' }}>
      <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '32px', letterSpacing: '-0.8px' }}>My Habits</h2>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap', alignItems: 'center' }}>
        {habits.map(h => (
          <button key={h.id} onClick={() => setSelectedId(h.id === selectedId ? null : h.id)} style={{ padding: '12px 24px', borderRadius: '30px', border: 'none', backgroundColor: h.color, boxShadow: selectedId === h.id ? '0 0 0 2.5px #1A1A1A' : '0 4px 10px rgba(0,0,0,0.05)', cursor: 'pointer', fontWeight: '700' }}>
            {h.name}
          </button>
        ))}
        <button onClick={() => setIsManageOpen(true)} style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1.5px solid #EEE', background: 'none', cursor: 'pointer', fontSize: '20px' }}>•••</button>
      </div>

      <div style={{ backgroundColor: '#F9F9F9', padding: '28px', borderRadius: '45px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <button onClick={() => setViewDate(new Date(calendarData.year, calendarData.month - 1, 1))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: '900', color: '#BBB' }}>PREV</button>
          <span style={{ fontSize: '16px', fontWeight: '900', textTransform: 'uppercase' }}>{calendarData.monthShort} {calendarData.year}</span>
          <button onClick={() => setViewDate(new Date(calendarData.year, calendarData.month + 1, 1))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: '900', color: '#BBB' }}>NEXT</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '14px' }}>
          {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: '11px', color: '#CCC', fontWeight: '900' }}>{d}</div>)}
          {[...Array(calendarData.firstDay)].map((_, i) => <div key={`e-${i}`} />)}
          {[...Array(calendarData.daysInMonth)].map((_, i) => {
            const d = i + 1;
            const key = `${calendarData.year}-${calendarData.month+1}-${d}`;
            const dayHabits = history[key] || [];
            return (
              <div key={d} onClick={() => toggleDay(d)} style={{ aspectRatio: '1', border: '1px solid #F0F0F0', borderRadius: '16px', position: 'relative', cursor: 'pointer', overflow: 'hidden', backgroundColor: '#FFF' }}>
                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2, fontSize: '13px', fontWeight: '800' }}>{d}</span>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {dayHabits.map(hid => <div key={hid} style={{ flex: 1, backgroundColor: habits.find(h => h.id === hid)?.color }} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={() => setIsAddModalOpen(true)} style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', width: '78px', height: '78px', borderRadius: '50%', backgroundColor: '#1A1A1A', color: 'white', fontSize: '38px', border: 'none', cursor: 'pointer', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>＋</button>

      {isManageOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(20px)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ backgroundColor: 'white', width: '100%', borderRadius: '45px 45px 0 0', padding: '40px 28px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '35px', alignItems: 'center' }}>
               <b style={{ fontSize: '22px', fontWeight: '900' }}>Settings</b>
               <button onClick={() => setIsManageOpen(false)} style={{ border: 'none', background: '#1A1A1A', color: '#fff', borderRadius: '25px', padding: '12px 30px', fontWeight: '800' }}>Done</button>
            </div>
            {habits.map((h, idx) => (
              <div key={h.id} draggable onDragStart={(e) => onDragStart(e, idx)} onDragOver={(e) => { e.preventDefault(); onDragOver(idx); }} onDragEnd={() => setDraggedIndex(null)} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '22px', backgroundColor: draggedIndex === idx ? '#F0F0F0' : '#FBFBFB', borderRadius: '28px', border: '1px solid #F0F0F0' }}>
                  <DragHandleIcon />
                  <div onClick={(e) => { e.stopPropagation(); setEditingColorId(editingColorId === h.id ? null : h.id); }} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: h.color, border: '3px solid white', cursor: 'pointer', boxShadow: '0 3px 8px rgba(0,0,0,0.1)' }} />
                  <input value={h.name} onChange={(e) => { const n = [...habits]; n[idx].name = e.target.value; setHabits(n); }} style={{ flex: 1, border: 'none', background: 'none', fontWeight: '800', fontSize: '17px', outline: 'none' }} />
                  <div onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete?')) setHabits(habits.filter(i => i.id !== h.id)) }}><TrashIcon /></div>
                </div>
                {editingColorId === h.id && (
                  <div style={{ display: 'flex', gap: '15px', padding: '15px 0', justifyContent: 'center' }}>
                    {presetColors.map(pc => <div key={pc} onClick={() => { const n = [...habits]; n[idx].color = pc; setHabits(n); setEditingColorId(null); }} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: pc, cursor: 'pointer', border: h.color === pc ? '3px solid #1A1A1A' : '1.5px solid #EEE' }} />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(25px)', zIndex: 101, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ padding: '45px', backgroundColor: '#fff', borderRadius: '50px', width: '85%', maxWidth: '360px', boxShadow: '0 40px 80px rgba(0,0,0,0.12)' }}>
            <h3 style={{ margin: '0 0 30px 0', fontWeight: '900', fontSize: '22px' }}>New Habit</h3>
            <input placeholder="Goal name" value={newName} onChange={e => setNewName(e.target.value)} style={{ width: '100%', padding: '22px', borderRadius: '22px', border: '1.5px solid #EEE', marginBottom: '30px', boxSizing: 'border-box', fontSize: '17px', outline: 'none' }} />
            <div style={{ display: 'flex', gap: '14px', marginBottom: '40px', justifyContent: 'center' }}>
              {presetColors.map(c => <div key={c} onClick={() => setNewColor(c)} style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: c, cursor: 'pointer', border: newColor === c ? '3.5px solid #1A1A1A' : 'none', boxSizing: 'border-box' }} />)}
            </div>
            <div style={{ display: 'flex', gap: '18px' }}>
              <button onClick={() => setIsAddModalOpen(false)} style={{ flex: 1, padding: '22px', borderRadius: '22px', border: 'none', background: '#F5F5F5', fontWeight: '900' }}>Cancel</button>
              <button onClick={() => { if(newName) { setHabits([...habits, { id: Date.now(), name: newName, color: newColor }]); setIsAddModalOpen(false); setNewName(''); } }} style={{ flex: 1, padding: '22px', borderRadius: '22px', border: 'none', background: '#1A1A1A', color: '#fff', fontWeight: '900' }}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
