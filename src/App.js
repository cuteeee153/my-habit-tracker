import React, { useState, useMemo, useEffect } from "react";

export default function App() {
  // --- 1. 核心數據狀態 (加入防錯機制) ---
  const [habits, setHabits] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('my-habits');
      return saved ? JSON.parse(saved) : [
        { id: 1, name: 'Water', color: 'rgba(186, 230, 253, 0.6)' },
        { id: 2, name: 'Breakfast', color: 'rgba(251, 207, 232, 0.6)' }
      ];
    }
    return [];
  });
  
  const [history, setHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('my-habit-history');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [selectedId, setSelectedId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [editingColorId, setEditingColorId] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [viewDate, setViewDate] = useState(new Date(2026, 2, 1));
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('rgba(186, 230, 253, 0.6)');

  const presetColors = ['rgba(251, 207, 232, 0.5)', 'rgba(186, 230, 253, 0.5)', 'rgba(209, 250, 229, 0.6)', 'rgba(254, 243, 199, 0.6)', 'rgba(237, 233, 254, 0.6)'];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('my-habits', JSON.stringify(habits));
    }
  }, [habits]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('my-habit-history', JSON.stringify(history));
    }
  }, [history]);

  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = viewDate.toLocaleString('en-US', { month: 'long' });
    return { year, month, firstDay, daysInMonth, monthName };
  }, [viewDate]);

  const changeMonth = (offset) => setViewDate(new Date(calendarData.year, calendarData.month + offset, 1));

  const toggleDay = (day) => {
    if (!selectedId) return;
    const dateKey = `${calendarData.year}-${calendarData.month + 1}-${day}`;
    const current = history[dateKey] || [];
    setHistory({
      ...history,
      [dateKey]: current.includes(selectedId) ? current.filter(id => id !== selectedId) : [...current, selectedId]
    });
  };

  const TrashIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
    </svg>
  );

  return (
    <div style={{ padding: '24px', fontFamily: '-apple-system, sans-serif', maxWidth: '450px', margin: 'auto', minHeight: '100vh', backgroundColor: '#FFF' }}>
      <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '32px' }}>My Habits</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {habits.map(h => (
          <button key={h.id} onClick={() => setSelectedId(h.id === selectedId ? null : h.id)} style={{ padding: '10px 22px', borderRadius: '30px', border: 'none', backgroundColor: h.color, boxShadow: selectedId === h.id ? '0 0 0 2.5px #1A1A1A' : 'none', cursor: 'pointer', fontWeight: '600' }}>{h.name}</button>
        ))}
        <button onClick={() => setIsManageOpen(true)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #EEE', background: 'none', cursor: 'pointer' }}>•••</button>
      </div>

      <div style={{ backgroundColor: '#FBFBFB', padding: '24px', borderRadius: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <button onClick={() => changeMonth(-1)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: '700' }}>PREV</button>
          <span style={{ fontSize: '16px', fontWeight: '800' }}>{calendarData.monthName} {calendarData.year}</span>
          <button onClick={() => changeMonth(1)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: '700' }}>NEXT</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
          {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: '10px', color: '#DDD', fontWeight: '800' }}>{d}</div>)}
          {[...Array(calendarData.firstDay)].map((_, i) => <div key={`e-${i}`} />)}
          {[...Array(calendarData.daysInMonth)].map((_, i) => {
            const d = i + 1;
            const key = `${calendarData.year}-${calendarData.month+1}-${d}`;
            const dayHabits = history[key] || [];
            return (
              <div key={d} onClick={() => toggleDay(d)} style={{ aspectRatio: '1', border: '1px solid #F1F1F1', borderRadius: '12px', position: 'relative', cursor: 'pointer', overflow: 'hidden', backgroundColor: '#FFF' }}>
                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2, fontSize: '12px', fontWeight: '600' }}>{d}</span>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {dayHabits.map(hid => <div key={hid} style={{ flex: 1, backgroundColor: habits.find(h => h.id === hid)?.color }} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={() => setIsAddModalOpen(true)} style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#1A1A1A', color: 'white', fontSize: '30px', border: 'none', cursor: 'pointer' }}>＋</button>

      {isManageOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ backgroundColor: 'white', width: '100%', borderRadius: '30px 30px 0 0', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
               <b>Manage</b>
               <button onClick={() => setIsManageOpen(false)} style={{ border: 'none', background: '#000', color: '#fff', borderRadius: '20px', padding: '5px 15px' }}>Done</button>
            </div>
            {habits.map((h, idx) => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: '#F9F9F9', borderRadius: '15px', marginBottom: '10px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: h.color }} />
                <input value={h.name} onChange={(e) => { const n = [...habits]; n[idx].name = e.target.value; setHabits(n); }} style={{ flex: 1, border: 'none', background: 'none', fontWeight: '600' }} />
                <button onClick={() => { if(confirm('Delete?')) setHabits(habits.filter(i => i.id !== h.id)) }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><TrashIcon /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', zIndex: 101, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ padding: '30px', backgroundColor: '#fff', borderRadius: '30px', width: '80%', border: '1px solid #eee' }}>
            <input placeholder="New goal" value={newName} onChange={e => setNewName(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #eee', marginBottom: '20px' }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setIsAddModalOpen(false)} style={{ padding: '10px 20px', border: 'none', background: '#eee', borderRadius: '10px' }}>Cancel</button>
              <button onClick={() => { setHabits([...habits, { id: Date.now(), name: newName, color: newColor }]); setIsAddModalOpen(false); setNewName(''); }} style={{ padding: '10px 20px', border: 'none', background: '#000', color: '#fff', borderRadius: '10px' }}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
