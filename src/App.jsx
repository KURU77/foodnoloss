import { useState, useMemo, useRef, useEffect } from "react";

// ── localStorage helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = "food-manager-items";

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

// ── Constants ────────────────────────────────────────────────────────────────

const GENRES = [
  { id: "noodle",     label: "麺類",      emoji: "🍜", color: "#e8845a", bg: "#fff4ef" },
  { id: "kit",        label: "料理の素",  emoji: "🧂", color: "#d4a017", bg: "#fffaed" },
  { id: "ingredient", label: "食材",      emoji: "🥦", color: "#4caf7d", bg: "#eef8f2" },
  { id: "seasoning",  label: "調味料",    emoji: "🫙", color: "#8e6bbf", bg: "#f5f0ff" },
  { id: "frozen",     label: "冷凍",      emoji: "🧊", color: "#4eadd6", bg: "#eef7fd" },
  { id: "drink",      label: "飲み物",    emoji: "🧃", color: "#e06fa0", bg: "#fff0f6" },
  { id: "soup",       label: "スープの素", emoji: "🍲", color: "#c0784a", bg: "#fdf3ec" },
  { id: "protein",    label: "プロテイン", emoji: "💪", color: "#6b8dd6", bg: "#eef1fd" },
  { id: "snack",      label: "お菓子",    emoji: "🍫", color: "#d4679a", bg: "#fdf0f7" },
];

const GENRE_MAP = Object.fromEntries(GENRES.map(g => [g.id, g]));

const STATUS = {
  expired: { label: "期限切れ", color: "#e74c3c", bg: "#fdf0f0", dot: "#e74c3c" },
  today:   { label: "今日まで", color: "#e67e22", bg: "#fef9f0", dot: "#e67e22" },
  soon:    { label: "まもなく", color: "#f39c12", bg: "#fffbf0", dot: "#f39c12" },
  ok:      { label: "余裕あり", color: "#27ae60", bg: "#f0faf4", dot: "#27ae60" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatus(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const exp = new Date(dateStr); exp.setHours(0,0,0,0);
  const diff = Math.round((exp - today) / (1000*60*60*24));
  if (diff < 0) return { ...STATUS.expired, diff };
  if (diff === 0) return { ...STATUS.today, diff };
  if (diff <= 3) return { ...STATUS.soon, diff };
  return { ...STATUS.ok, diff };
}

function diffLabel(diff) {
  if (diff < 0) return `${Math.abs(diff)}日超過`;
  if (diff === 0) return "今日まで";
  return `あと${diff}日`;
}

function offsetDate(d) {
  const t = new Date(); t.setDate(t.getDate() + d);
  return t.toISOString().split("T")[0];
}

function sortByDate(arr) {
  return [...arr].sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

// ── MemoPanel ────────────────────────────────────────────────────────────────

function MemoPanel({ item, onSave }) {
  const [text, setText] = useState(item.memo || "");
  const [saved, setSaved] = useState(false);
  function handleSave() {
    onSave(item.id, text);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }
  return (
    <div style={{ marginTop:10, padding:"12px 14px", background:"#fdfcf8", borderRadius:10, border:"1.5px dashed #d9d3c7" }}>
      <div style={{ fontSize:11, color:"#999", marginBottom:6, fontWeight:600, letterSpacing:0.5 }}>📝 メモ・必要な材料</div>
      <textarea
        value={text} onChange={e => setText(e.target.value)}
        placeholder={"例：\n・玉ねぎ\n・にんじん\n・じゃがいも"}
        rows={3}
        style={{
          width:"100%", border:"1.5px solid #e0dbd0", borderRadius:8, padding:"8px 10px",
          fontSize:13, fontFamily:"inherit", outline:"none", background:"#fff",
          resize:"vertical", color:"#2d4a3e", boxSizing:"border-box", lineHeight:1.6,
        }}
      />
      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
        <button onClick={handleSave} style={{
          background: saved ? "#27ae60" : "linear-gradient(135deg, #2d4a3e, #3d6e5a)",
          color:"#fff", border:"none", borderRadius:8, padding:"6px 16px",
          fontSize:12, fontWeight:600, cursor:"pointer", transition:"background 0.3s",
        }}>
          {saved ? "✓ 保存済み" : "保存"}
        </button>
      </div>
    </div>
  );
}

// ── FoodCard ─────────────────────────────────────────────────────────────────

function FoodCard({ item, index, expanded, onToggleExpand, onRemove, onSaveMemo, onUpdateImage }) {
  const s = getStatus(item.date);
  const genre = GENRE_MAP[item.genre];
  const isOpen = !!expanded[item.id];
  const hasMemo = item.memo && item.memo.trim().length > 0;
  const fileRef = useRef();

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onUpdateImage(item.id, ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{
      background:"#fff", borderRadius:14,
      boxShadow:"0 2px 10px rgba(0,0,0,0.05)",
      borderLeft:`4px solid ${s.dot}`,
      overflow:"hidden",
      animation:"fadeIn 0.3s ease",
      animationDelay:`${index * 0.04}s`,
      animationFillMode:"both",
      opacity:0,
    }}>
      <div style={{ padding:"13px 14px", display:"flex", alignItems:"center", gap:11 }}>

        {/* Icon: photo or genre emoji */}
        <div
          onClick={() => fileRef.current.click()}
          title="タップして写真を変更"
          style={{
            width:44, height:44, borderRadius:11, flexShrink:0,
            background: genre ? genre.bg : "#f5f0e8",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:20, cursor:"pointer", overflow:"hidden", position:"relative",
          }}
        >
          {item.image
            ? <img src={item.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : (genre ? genre.emoji : "📦")
          }
          <div style={{
            position:"absolute", bottom:0, right:0,
            background:"rgba(0,0,0,0.35)", borderRadius:"4px 0 0 0",
            fontSize:9, color:"#fff", padding:"1px 3px", lineHeight:1.4,
          }}>📷</div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          onChange={handleImageChange} style={{ display:"none" }} />

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:14, color:"#1a2f28", marginBottom:2 }}>{item.name}</div>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, color:"#bbb" }}>{item.date.replace(/-/g, "/")}</span>
            {genre && (
              <span style={{ fontSize:10, fontWeight:600, color:genre.color, background:genre.bg, padding:"1px 7px", borderRadius:10 }}>
                {genre.label}
              </span>
            )}
          </div>
          {hasMemo && !isOpen && (
            <div style={{ fontSize:11, color:"#bbb", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:130 }}>
              📝 {item.memo.split("\n")[0]}
            </div>
          )}
        </div>

        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ background:s.bg, color:s.color, fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:20, marginBottom:3 }}>
            {s.label}
          </div>
          <div style={{ fontSize:11, color:s.color, fontWeight:600 }}>{diffLabel(s.diff)}</div>
        </div>

        <button onClick={() => onToggleExpand(item.id)} style={{
          background: isOpen ? "#e8f5ee" : hasMemo ? "#fffbf0" : "#f5f0e8",
          border:"none", borderRadius:8, width:30, height:30,
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", flexShrink:0, fontSize:13, transition:"all 0.2s",
          color: isOpen ? "#27ae60" : hasMemo ? "#f39c12" : "#ccc",
        }}>
          {isOpen ? "✕" : "📝"}
        </button>

        <button onClick={() => onRemove(item.id)} style={{
          background:"none", border:"none", color:"#ccc",
          fontSize:18, cursor:"pointer", padding:"2px", lineHeight:1, flexShrink:0,
        }}>×</button>
      </div>

      {isOpen && (
        <div style={{ padding:"0 14px 13px" }}>
          <MemoPanel item={item} onSave={onSaveMemo} />
        </div>
      )}
    </div>
  );
}

// ── CalendarView ─────────────────────────────────────────────────────────────

function CalendarView({ items }) {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected]   = useState(null);

  const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = getFirstDayOfWeek(viewYear, viewMonth);

  // Map: "YYYY-MM-DD" -> items[]
  const dateMap = useMemo(() => {
    const m = {};
    items.forEach(item => {
      if (!m[item.date]) m[item.date] = [];
      m[item.date].push(item);
    });
    return m;
  }, [items]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11); }
    else setViewMonth(m => m-1);
    setSelected(null);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0); }
    else setViewMonth(m => m+1);
    setSelected(null);
  }

  const weekDays = ["日","月","火","水","木","金","土"];
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayKey = today.toISOString().split("T")[0];

  function dateKey(d) {
    return `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }

  const selectedItems = selected ? (dateMap[dateKey(selected)] || []) : [];

  return (
    <div style={{ padding:"12px 14px 0" }}>
      {/* Month nav */}
      <div style={{ background:"#fff", borderRadius:14, padding:"14px", boxShadow:"0 2px 10px rgba(0,0,0,0.05)", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <button onClick={prevMonth} style={{ background:"#f5f0e8", border:"none", borderRadius:8, width:32, height:32, fontSize:16, cursor:"pointer" }}>‹</button>
          <span style={{ fontWeight:700, fontSize:15, color:"#1a2f28" }}>
            {viewYear}年 {viewMonth+1}月
          </span>
          <button onClick={nextMonth} style={{ background:"#f5f0e8", border:"none", borderRadius:8, width:32, height:32, fontSize:16, cursor:"pointer" }}>›</button>
        </div>

        {/* Weekday header */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:4 }}>
          {weekDays.map((w,i) => (
            <div key={w} style={{
              textAlign:"center", fontSize:11, fontWeight:600, paddingBottom:6,
              color: i===0 ? "#e74c3c" : i===6 ? "#4eadd6" : "#aaa",
            }}>{w}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
          {cells.map((d, idx) => {
            if (!d) return <div key={`e${idx}`} />;
            const key = dateKey(d);
            const hits = dateMap[key] || [];
            const isToday = key === todayKey;
            const isSelected = selected === d;
            const s = hits.length > 0 ? getStatus(key) : null;
            return (
              <div
                key={key}
                onClick={() => setSelected(isSelected ? null : d)}
                style={{
                  borderRadius:8, padding:"5px 2px", textAlign:"center",
                  cursor: hits.length > 0 ? "pointer" : "default",
                  background: isSelected ? "#2d4a3e" : isToday ? "#eef8f2" : "transparent",
                  border: isToday && !isSelected ? "1.5px solid #4caf7d" : "1.5px solid transparent",
                  transition:"background 0.15s",
                }}
              >
                <div style={{
                  fontSize:13, fontWeight: isToday||isSelected ? 700 : 400,
                  color: isSelected ? "#fff" : idx % 7 === 0 ? "#e74c3c" : idx % 7 === 6 ? "#4eadd6" : "#333",
                }}>{d}</div>
                {/* Dot indicators */}
                <div style={{ display:"flex", justifyContent:"center", gap:2, marginTop:2, flexWrap:"wrap" }}>
                  {hits.slice(0,3).map(item => (
                    <div key={item.id} style={{
                      width:5, height:5, borderRadius:"50%",
                      background: isSelected ? "rgba(255,255,255,0.8)" : (s ? s.dot : "#ccc"),
                    }} />
                  ))}
                  {hits.length > 3 && (
                    <div style={{ fontSize:8, color: isSelected?"#fff":"#aaa", lineHeight:"5px" }}>+</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:12, marginBottom:10, flexWrap:"wrap" }}>
        {[
          { color:"#e74c3c", label:"期限切れ" },
          { color:"#e67e22", label:"今日まで" },
          { color:"#f39c12", label:"まもなく" },
          { color:"#27ae60", label:"余裕あり" },
        ].map(l => (
          <div key={l.label} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:l.color }} />
            <span style={{ fontSize:11, color:"#999" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Selected day items */}
      {selected && (
        <div style={{ background:"#fff", borderRadius:14, padding:"14px", boxShadow:"0 2px 10px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#1a2f28", marginBottom:10 }}>
            {viewMonth+1}月{selected}日の食材
          </div>
          {selectedItems.length === 0 ? (
            <div style={{ color:"#bbb", fontSize:13 }}>この日の食材はありません</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {selectedItems.map(item => {
                const st = getStatus(item.date);
                const g = GENRE_MAP[item.genre];
                return (
                  <div key={item.id} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{
                      width:36, height:36, borderRadius:9, flexShrink:0,
                      background: g ? g.bg : "#f5f0e8",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:18, overflow:"hidden",
                    }}>
                      {item.image
                        ? <img src={item.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : (g ? g.emoji : "📦")
                      }
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13, color:"#1a2f28" }}>{item.name}</div>
                      {g && <div style={{ fontSize:10, color:g.color }}>{g.label}</div>}
                    </div>
                    <div style={{ fontSize:11, fontWeight:700, color:st.color }}>{st.label}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* All items with expiry this month */}
      {!selected && (() => {
        const monthItems = items.filter(i => {
          const d = new Date(i.date);
          return d.getFullYear()===viewYear && d.getMonth()===viewMonth;
        });
        if (monthItems.length === 0) return null;
        return (
          <div style={{ background:"#fff", borderRadius:14, padding:"14px", boxShadow:"0 2px 10px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#1a2f28", marginBottom:10 }}>
              {viewMonth+1}月に期限が切れる食材 ({monthItems.length}件)
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {sortByDate(monthItems).map(item => {
                const st = getStatus(item.date);
                const g = GENRE_MAP[item.genre];
                return (
                  <div key={item.id} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{
                      width:36, height:36, borderRadius:9, flexShrink:0,
                      background: g ? g.bg : "#f5f0e8",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:18, overflow:"hidden",
                    }}>
                      {item.image
                        ? <img src={item.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : (g ? g.emoji : "📦")
                      }
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13, color:"#1a2f28" }}>{item.name}</div>
                      <div style={{ fontSize:11, color:"#bbb" }}>{item.date.replace(/-/g,"/")}</div>
                    </div>
                    <div style={{ fontSize:11, fontWeight:700, color:st.color }}>{diffLabel(st.diff)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [items, setItems] = useState(() => {
    const saved = loadItems();
    if (saved && saved.length > 0) return saved;
    // 初回のみサンプルデータ
    return [
      { id:1, name:"うどん",     date:offsetDate(30),  genre:"noodle",     memo:"", image:null },
      { id:2, name:"カレーの素", date:offsetDate(120), genre:"kit",        memo:"・じゃがいも\n・にんじん\n・玉ねぎ", image:null },
      { id:3, name:"鶏むね肉",   date:offsetDate(-1),  genre:"ingredient", memo:"唐揚げ用\n・片栗粉・醤油・生姜", image:null },
      { id:4, name:"醤油",       date:offsetDate(60),  genre:"seasoning",  memo:"", image:null },
      { id:5, name:"冷凍餃子",   date:offsetDate(14),  genre:"frozen",     memo:"", image:null },
      { id:6, name:"麦茶",       date:offsetDate(3),   genre:"drink",      memo:"", image:null },
      { id:7, name:"コンソメ",   date:offsetDate(0),   genre:"soup",       memo:"", image:null },
      { id:8, name:"たまご",     date:offsetDate(7),   genre:"ingredient", memo:"", image:null },
    ];
  });

  // itemsが変わるたびに端末に保存
  useEffect(() => { saveItems(items); }, [items]);

  const [name, setName]       = useState("");
  const [date, setDate]       = useState("");
  const [genre, setGenre]     = useState(GENRES[0].id);
  const [newMemo, setNewMemo] = useState("");
  const [shake, setShake]     = useState(false);
  const [expanded, setExpanded] = useState({});
  const [mainTab, setMainTab] = useState("list");  // "list" | "calendar"
  const [listTab, setListTab] = useState("all");   // "all" | genre id

  const todayStr = new Date().toLocaleDateString("ja-JP", { year:"numeric", month:"long", day:"numeric" });

  const allSorted = useMemo(() => sortByDate(items), [items]);
  const byGenre = useMemo(() => {
    const map = {};
    GENRES.forEach(g => { map[g.id] = sortByDate(items.filter(i => i.genre === g.id)); });
    return map;
  }, [items]);

  function add() {
    if (!name.trim() || !date) { setShake(true); setTimeout(() => setShake(false), 500); return; }
    setItems(prev => [...prev, { id:Date.now(), name:name.trim(), date, genre, memo:newMemo.trim(), image:null }]);
    setName(""); setDate(""); setNewMemo("");
  }
  function remove(id) {
    setItems(prev => prev.filter(i => i.id !== id));
    setExpanded(prev => { const n={...prev}; delete n[id]; return n; });
  }
  function saveMemo(id, memo) {
    setItems(prev => prev.map(i => i.id===id ? {...i, memo} : i));
  }
  function toggleExpand(id) {
    setExpanded(prev => ({...prev, [id]: !prev[id]}));
  }
  function updateImage(id, image) {
    setItems(prev => prev.map(i => i.id===id ? {...i, image} : i));
  }

  const displayItems = listTab === "all" ? allSorted : (byGenre[listTab] || []);
  const expiredCount = items.filter(i => getStatus(i.date).diff < 0).length;
  const soonCount    = items.filter(i => { const d=getStatus(i.date).diff; return d>=0&&d<=3; }).length;

  return (
    <div style={{ minHeight:"100vh", background:"#f5f0e8", fontFamily:"'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif", paddingBottom:80 }}>

      {/* ── Header ── */}
      <div style={{ background:"linear-gradient(135deg,#2d4a3e 0%,#1a2f28 100%)", padding:"32px 20px 24px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
        <div style={{ position:"absolute", bottom:-20, left:20, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.03)" }} />
        <div style={{ fontSize:10, color:"#8fb8a8", letterSpacing:3, marginBottom:6, textTransform:"uppercase" }}>Food Manager</div>
        <h1 style={{ margin:0, color:"#fff", fontSize:24, fontWeight:700, letterSpacing:-0.5 }}>🧺 食材管理</h1>
        <div style={{ color:"#8fb8a8", fontSize:12, marginTop:4 }}>{todayStr}</div>
        <div style={{ display:"flex", gap:10, marginTop:16 }}>
          {[
            { label:"期限切れ", count:expiredCount, color:"#e74c3c" },
            { label:"まもなく", count:soonCount,    color:"#f39c12" },
            { label:"合計",     count:items.length, color:"#8fb8a8" },
          ].map(s => (
            <div key={s.label} style={{ background:"rgba(255,255,255,0.07)", borderRadius:11, padding:"9px 0", flex:1, textAlign:"center" }}>
              <div style={{ color:s.color, fontSize:20, fontWeight:700 }}>{s.count}</div>
              <div style={{ color:"#8fb8a8", fontSize:10, marginTop:1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Tab (List / Calendar) ── */}
      <div style={{ padding:"14px 14px 0" }}>
        <div style={{ background:"#fff", borderRadius:14, padding:"5px", boxShadow:"0 2px 10px rgba(0,0,0,0.05)", display:"flex", gap:4 }}>
          {[
            { id:"list",     label:"📋 リスト" },
            { id:"calendar", label:"📅 カレンダー" },
          ].map(t => (
            <button key={t.id} onClick={() => setMainTab(t.id)} style={{
              flex:1, padding:"9px", borderRadius:10, border:"none",
              background: mainTab===t.id ? "linear-gradient(135deg,#2d4a3e,#3d6e5a)" : "transparent",
              color: mainTab===t.id ? "#fff" : "#999",
              fontSize:13, fontWeight: mainTab===t.id ? 700 : 400,
              cursor:"pointer", transition:"all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {mainTab === "calendar" ? (
        <CalendarView items={items} />
      ) : (
        <>
          {/* ── Add Form ── */}
          <div style={{ padding:"12px 14px 0" }}>
            <div style={{ background:"#fff", borderRadius:16, padding:"16px 14px", boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#2d4a3e", marginBottom:11 }}>＋ 食材を追加</div>
              <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && add()}
                  placeholder="食品名（例：うどん）"
                  style={{
                    border:`1.5px solid ${shake&&!name.trim()?"#e74c3c":"#e0dbd0"}`,
                    borderRadius:10, padding:"10px 13px", fontSize:14, outline:"none",
                    background:"#fdfcf8", animation:shake&&!name.trim()?"shake 0.4s ease":"none",
                  }}
                />
                <input
                  type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={{
                    border:`1.5px solid ${shake&&!date?"#e74c3c":"#e0dbd0"}`,
                    borderRadius:10, padding:"10px 13px", fontSize:14, outline:"none",
                    background:"#fdfcf8", color:date?"#2d4a3e":"#aaa",
                    animation:shake&&!date?"shake 0.4s ease":"none",
                  }}
                />
                <div>
                  <div style={{ fontSize:11, color:"#aaa", marginBottom:6, fontWeight:600 }}>ジャンル</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    {GENRES.map(g => (
                      <button key={g.id} onClick={() => setGenre(g.id)} style={{
                        padding:"6px 11px", borderRadius:20,
                        border: genre===g.id ? `2px solid ${g.color}` : "2px solid transparent",
                        background: genre===g.id ? g.bg : "#f5f0e8",
                        color: genre===g.id ? g.color : "#999",
                        fontSize:12, fontWeight: genre===g.id ? 700 : 400,
                        cursor:"pointer", transition:"all 0.15s",
                        display:"flex", alignItems:"center", gap:4,
                      }}>
                        {g.emoji} {g.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={newMemo} onChange={e => setNewMemo(e.target.value)}
                  placeholder="メモ・必要な材料（任意）"
                  rows={2}
                  style={{
                    border:"1.5px solid #e0dbd0", borderRadius:10, padding:"10px 13px",
                    fontSize:13, outline:"none", background:"#fdfcf8",
                    fontFamily:"inherit", resize:"vertical", color:"#2d4a3e", lineHeight:1.6,
                  }}
                />
                <button onClick={add} style={{
                  background:"linear-gradient(135deg,#2d4a3e,#3d6e5a)",
                  color:"#fff", border:"none", borderRadius:10, padding:"12px",
                  fontSize:14, fontWeight:600, cursor:"pointer", letterSpacing:0.5,
                }}>追加する</button>
              </div>
            </div>
          </div>

          {/* ── Genre Tab Bar ── */}
          <div style={{ padding:"12px 14px 0" }}>
            <div style={{
              background:"#fff", borderRadius:14, padding:"6px",
              boxShadow:"0 2px 10px rgba(0,0,0,0.05)",
              display:"flex", overflowX:"auto", gap:4, scrollbarWidth:"none",
            }}>
              <button onClick={() => setListTab("all")} style={{
                flexShrink:0, padding:"7px 14px", borderRadius:10, border:"none",
                background: listTab==="all" ? "linear-gradient(135deg,#2d4a3e,#3d6e5a)" : "transparent",
                color: listTab==="all" ? "#fff" : "#999",
                fontSize:12, fontWeight: listTab==="all" ? 700 : 400,
                cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap",
              }}>
                🗂 すべて ({items.length})
              </button>
              {GENRES.map(g => {
                const cnt = byGenre[g.id]?.length || 0;
                if (cnt === 0) return null;
                const active = listTab === g.id;
                return (
                  <button key={g.id} onClick={() => setListTab(g.id)} style={{
                    flexShrink:0, padding:"7px 12px", borderRadius:10, border:"none",
                    background: active ? g.bg : "transparent",
                    color: active ? g.color : "#999",
                    fontSize:12, fontWeight: active ? 700 : 400,
                    cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap",
                    outline: active ? `2px solid ${g.color}` : "none", outlineOffset:-2,
                  }}>
                    {g.emoji} {g.label} ({cnt})
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── List ── */}
          <div style={{ padding:"12px 14px 0" }}>
            {displayItems.length === 0 ? (
              <div style={{ textAlign:"center", padding:"48px 0", color:"#bbb", fontSize:14 }}>
                このジャンルの食材はありません 🌿
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                {listTab !== "all" && GENRE_MAP[listTab] && (
                  <div style={{
                    display:"flex", alignItems:"center", gap:8,
                    padding:"6px 4px", borderBottom:`2px solid ${GENRE_MAP[listTab].color}20`, marginBottom:4,
                  }}>
                    <span style={{ fontSize:18 }}>{GENRE_MAP[listTab].emoji}</span>
                    <span style={{ fontSize:14, fontWeight:700, color:GENRE_MAP[listTab].color }}>{GENRE_MAP[listTab].label}</span>
                    <span style={{ fontSize:12, color:"#bbb" }}>賞味期限順</span>
                  </div>
                )}
                {displayItems.map((item, i) => (
                  <FoodCard
                    key={item.id} item={item} index={i} expanded={expanded}
                    onToggleExpand={toggleExpand} onRemove={remove}
                    onSaveMemo={saveMemo} onUpdateImage={updateImage}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shake {
          0%,100% { transform:translateX(0); }
          25%     { transform:translateX(-6px); }
          75%     { transform:translateX(6px); }
        }
        input:focus, textarea:focus { border-color:#2d4a3e !important; background:#fff !important; }
        ::-webkit-scrollbar { display:none; }
      `}</style>
    </div>
  );
}
