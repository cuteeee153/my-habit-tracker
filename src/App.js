import React, { useState, useMemo, useEffect } from "react";

export default function App() {
  // --- 1. 核心數據狀態 ---
  // 初始值先嘗試從 localStorage 讀取，如果沒有才用預設值
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem("my-habits");
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, name: "Water", color: "rgba(186, 230, 253, 0.6)" },
          { id: 2, name: "Breakfast", color: "rgba(251, 207, 232, 0.6)" },
        ];
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("my-habit-history");
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedId, setSelectedId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [editingColorId, setEditingColorId] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [viewDate, setViewDate] = useState(new Date(2026, 2, 1));
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("rgba(186, 230, 253, 0.6)");

  const presetColors = [
    "rgba(251, 207, 232, 0.5)",
    "rgba(186, 230, 253, 0.5)",
    "rgba(209, 250, 229, 0.6)",
    "rgba(254, 243, 199, 0.6)",
    "rgba(237, 233, 254, 0.6)",
  ];

  // --- 2. 數據持久化監控 ---
  useEffect(() => {
    localStorage.setItem("my-habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("my-habit-history", JSON.stringify(history));
  }, [history]);

  // --- 3. 萬年曆與管理邏輯 (保持不變) ---
  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = viewDate.toLocaleString("en-US", { month: "long" });
    return { year, month, firstDay, daysInMonth, monthName };
  }, [viewDate]);

  const changeMonth = (offset) =>
    setViewDate(new Date(calendarData.year, calendarData.month + offset, 1));

  const toggleDay = (day) => {
    if (!selectedId) return;
    const dateKey = `${calendarData.year}-${calendarData.month + 1}-${day}`;
    const current = history[dateKey] || [];
    setHistory({
      ...history,
      [dateKey]: current.includes(selectedId)
        ? current.filter((id) => id !== selectedId)
        : [...current, selectedId],
    });
  };

  const addHabit = () => {
    if (!newName) return;
    setHabits([...habits, { id: Date.now(), name: newName, color: newColor }]);
    setNewName("");
    setIsAddModalOpen(false);
  };

  const deleteHabit = (id) => {
    if (!window.confirm("Delete this habit?")) return;
    setHabits(habits.filter((h) => h.id !== id));
    if (selectedId === id) setSelectedId(null);
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

  const TrashIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2 2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
    </svg>
  );

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "-apple-system, sans-serif",
        maxWidth: "450px",
        margin: "auto",
        minHeight: "100vh",
        backgroundColor: "#FFF",
      }}
    >
      {/* 介面渲染部分與之前完全相同，請保留原本的 return 內容 */}
      <h2 style={{ fontSize: "26px", fontWeight: "800", marginBottom: "32px" }}>
        My Habits
      </h2>

      {/* Habit Selector */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "40px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {habits.map((h) => (
          <button
            key={h.id}
            onClick={() => setSelectedId(h.id === selectedId ? null : h.id)}
            style={{
              padding: "10px 22px",
              borderRadius: "30px",
              border: "none",
              backgroundColor: h.color,
              boxShadow: selectedId === h.id ? `0 0 0 2.5px #1A1A1A` : "none",
              cursor: "pointer",
              transition: "0.3s",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            {h.name}
          </button>
        ))}
        <button
          onClick={() => setIsManageOpen(true)}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "1px solid #EEE",
            backgroundColor: "transparent",
            cursor: "pointer",
            color: "#BBB",
          }}
        >
          •••
        </button>
      </div>

      {/* Calendar Area */}
      <div
        style={{
          backgroundColor: "#FBFBFB",
          padding: "24px",
          borderRadius: "36px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >
          <button
            onClick={() => changeMonth(-1)}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#BBB",
              fontWeight: "700",
              fontSize: "12px",
            }}
          >
            PREV
          </button>
          <span
            style={{
              fontSize: "16px",
              fontWeight: "800",
              textTransform: "uppercase",
            }}
          >
            {calendarData.monthName} {calendarData.year}
          </span>
          <button
            onClick={() => changeMonth(1)}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#BBB",
              fontWeight: "700",
              fontSize: "12px",
            }}
          >
            NEXT
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            marginBottom: "15px",
          }}
        >
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
            <div
              key={d}
              style={{
                textAlign: "center",
                fontSize: "10px",
                fontWeight: "800",
                color: "#DDD",
              }}
            >
              {d}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "10px",
          }}
        >
          {[...Array(calendarData.firstDay)].map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {[...Array(calendarData.daysInMonth)].map((_, i) => {
            const day = i + 1;
            const dateKey = `${calendarData.year}-${
              calendarData.month + 1
            }-${day}`;
            const dayHabits = history[dateKey] || [];
            return (
              <div
                key={day}
                onClick={() => toggleDay(day)}
                style={{
                  aspectRatio: "1",
                  border: "1px solid #F1F1F1",
                  borderRadius: "14px",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                  backgroundColor: "#FFF",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 2,
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {day}
                </span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  {dayHabits.map((hid) => (
                    <div
                      key={hid}
                      style={{
                        flex: 1,
                        backgroundColor: habits.find((h) => h.id === hid)
                          ?.color,
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          bottom: "40px",
          left: "0",
          right: "0",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            backgroundColor: "#1A1A1A",
            color: "white",
            fontSize: "32px",
            border: "none",
            cursor: "pointer",
          }}
        >
          ＋
        </button>
      </div>

      {/* Manage Drawer */}
      {isManageOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.2)",
            backdropFilter: "blur(8px)",
            zIndex: 200,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              width: "100%",
              borderTopLeftRadius: "40px",
              borderTopRightRadius: "40px",
              padding: "32px 24px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}
            >
              <h3 style={{ margin: 0, fontWeight: "800" }}>Manage</h3>
              <button
                onClick={() => setIsManageOpen(false)}
                style={{
                  border: "none",
                  background: "#1A1A1A",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "20px",
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
            {habits.map((h, index) => (
              <div
                key={h.id}
                draggable
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  onDragOver(index);
                }}
                onDragEnd={() => setDraggedIndex(null)}
                style={{ marginBottom: "12px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "16px",
                    backgroundColor:
                      draggedIndex === index ? "#EEE" : "#F9F9F9",
                    borderRadius: "24px",
                  }}
                >
                  <div
                    style={{
                      cursor: "grab",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: "16px",
                          height: "1.5px",
                          backgroundColor: "#CCC",
                        }}
                      />
                    ))}
                  </div>
                  <div
                    onClick={() =>
                      setEditingColorId(editingColorId === h.id ? null : h.id)
                    }
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: h.color,
                      border: "2px solid white",
                      cursor: "pointer",
                    }}
                  />
                  <input
                    value={h.name}
                    onChange={(e) => {
                      const n = [...habits];
                      n[index].name = e.target.value;
                      setHabits(n);
                    }}
                    style={{
                      flex: 1,
                      border: "none",
                      background: "none",
                      fontSize: "16px",
                      fontWeight: "600",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={() => deleteHabit(h.id)}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "#1A1A1A",
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>
                {editingColorId === h.id && (
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      padding: "10px",
                      justifyContent: "center",
                    }}
                  >
                    {presetColors.map((pc) => (
                      <div
                        key={pc}
                        onClick={() => {
                          const n = [...habits];
                          n[index].color = pc;
                          setHabits(n);
                          setEditingColorId(null);
                        }}
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          backgroundColor: pc,
                          cursor: "pointer",
                          border:
                            h.color === pc
                              ? "2.5px solid #333"
                              : "1px solid #EEE",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "40px",
              borderRadius: "40px",
              width: "85%",
              maxWidth: "340px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
              border: "1px solid #F1F1F1",
            }}
          >
            <h3
              style={{ marginTop: 0, marginBottom: "24px", fontWeight: "800" }}
            >
              New Habit
            </h3>
            <input
              placeholder="Goal"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "18px",
                border: "1px solid #EEE",
                marginBottom: "24px",
                boxSizing: "border-box",
                outline: "none",
                fontSize: "16px",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "32px",
                justifyContent: "center",
              }}
            >
              {presetColors.map((c) => (
                <div
                  key={c}
                  onClick={() => setNewColor(c)}
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    backgroundColor: c,
                    cursor: "pointer",
                    border: newColor === c ? "2.5px solid #1A1A1A" : "none",
                    boxSizing: "border-box",
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  flex: 1,
                  padding: "18px",
                  borderRadius: "18px",
                  border: "none",
                  backgroundColor: "#F5F5F5",
                  fontWeight: "700",
                }}
              >
                Cancel
              </button>
              <button
                onClick={addHabit}
                style={{
                  flex: 1,
                  padding: "18px",
                  borderRadius: "18px",
                  border: "none",
                  backgroundColor: "#1A1A1A",
                  color: "white",
                  fontWeight: "700",
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
