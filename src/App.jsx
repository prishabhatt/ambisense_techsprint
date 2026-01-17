import React, { useState, useEffect } from 'react';
import { 
  Shield, LayoutDashboard, Activity, Stethoscope, User, LogOut, 
  Bell, AlertTriangle, CheckCircle, Eye, EyeOff, Calendar, 
  Send, ArrowRight, Sparkles, Volume2, Search, 
  Loader2, Settings, Info, Activity as ActivityIcon,
  Pill, HeartPulse, UserCircle, Trash2, Edit3, Sun, Moon, Thermometer, Wind, X, ArrowUpRight
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';

// --- CONFIG ---
const apiKey = ""; 

// --- UTILITY: PCM TO WAV (Ensures Read Aloud functions in browser) ---
function pcmToWav(pcmBase64, sampleRate) {
  const byteCharacters = atob(pcmBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const buffer = byteArray.buffer;
  const view = new DataView(new ArrayBuffer(44 + buffer.byteLength));
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + buffer.byteLength, true); // size
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint16(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, buffer.byteLength, true);
  const pcmView = new Uint8Array(buffer);
  for (let i = 0; i < pcmView.length; i++) { view.setUint8(44 + i, pcmView[i]); }
  return new Blob([view], { type: 'audio/wav' });
}

// --- API HELPERS ---
const fetchGemini = async (payload, endpoint = "generateContent", model = "gemini-2.5-flash-preview-09-2025") => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("API Failure");
  return await response.json();
};

const DATA_DAY = [
  { time: '08:00', intensity: 20 }, { time: '10:00', intensity: 85 },
  { time: '12:00', intensity: 45 }, { time: '14:00', intensity: 30 },
  { time: '16:00', intensity: 75 }, { time: '18:00', intensity: 15 },
];

const DATA_WEEK = [
  { label: 'Mon', steps: 4200 }, { label: 'Tue', steps: 5800 },
  { label: 'Wed', steps: 3100 }, { label: 'Thu', steps: 7200 },
  { label: 'Fri', steps: 6300 }, { label: 'Sat', steps: 8900 }, { label: 'Sun', steps: 5400 },
];

const DATA_MONTH = [
  { label: 'Week 1', steps: 28400 }, { label: 'Week 2', steps: 35200 },
  { label: 'Week 3', steps: 21600 }, { label: 'Week 4', steps: 41100 },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null); 
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [isAlerting, setIsAlerting] = useState(false);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [wellnessRange, setWellnessRange] = useState('Day');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isPrivacyMasked, setIsPrivacyMasked] = useState(false);
  const [currentAction, setCurrentAction] = useState('Sitting');
  const [darkMode, setDarkMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const [clinicalNotes, setClinicalNotes] = useState([
    { id: 1, text: "Patient followed morning vitals stable. Completed 15 mins of light walking.", date: "Jan 1, 09:15 am", author: "Caregiver" },
    { id: 2, text: "Metformin administered at 08:30 am. No nausea reported.", date: "Jan 1, 09:30 am", author: "Caregiver" }
  ]);
  const [noteInput, setNoteInput] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const [aiSummary, setAiSummary] = useState("Generate a summary to see insights.");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  const [researchQuery, setResearchQuery] = useState("");
  const [researchOutput, setResearchOutput] = useState("");
  const [isResearching, setIsResearching] = useState(false);

  const [systemIntegrity, setSystemIntegrity] = useState({ tracking: true, alerts: true, sync: true });
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Medication schedule update", time: "5 mins ago" },
    { id: 2, title: "Sensor calibration complete", time: "2 hours ago" }
  ]);

  const medications = [
    { time: "08:00 am", med: "Metformin", dose: "500mg", completed: true },
    { time: "09:00 am", med: "Lisinopril", dose: "10mg", completed: true },
    { time: "01:00 pm", med: "Multivitamin", dose: "1 tab", completed: false },
    { time: "08:00 pm", med: "Donepezil", dose: "5mg", completed: false }
  ];

  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      const actions = ['Walking', 'Sitting', 'Standing', 'Resting'];
      setCurrentAction(actions[Math.floor(Math.random() * actions.length)]);
    }, 6000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const activateSOS = () => { setIsSOSActive(true); setIsAlerting(true); };

  const readScheduleAloud = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const scheduleText = medications.map(m => `At ${m.time}, ${m.med}.`).join(" ");
      const text = `The current medication schedule for John Doe is: ${scheduleText}`;
      const payload = {
        contents: [{ parts: [{ text: `Say in a warm caregiver voice: ${text}` }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } } },
        model: "gemini-2.5-flash-preview-tts"
      };
      const result = await fetchGemini(payload, "generateContent", "gemini-2.5-flash-preview-tts");
      const base64Audio = result.candidates[0].content.parts.find(p => p.inlineData).inlineData.data;
      const wavBlob = pcmToWav(base64Audio, 24000);
      const audio = new Audio(URL.createObjectURL(wavBlob));
      audio.onended = () => setIsSpeaking(false);
      await audio.play();
    } catch (e) { setIsSpeaking(false); }
  };

  const handleSaveNote = () => {
    if (!noteInput.trim()) return;
    const newNote = { id: Date.now(), text: noteInput, date: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit' }), author: "Caregiver" };
    setClinicalNotes([newNote, ...clinicalNotes]);
    setNoteInput("");
  };

  const deleteNote = (id) => setClinicalNotes(clinicalNotes.filter(n => n.id !== id));
  const startEdit = (note) => { setEditingNoteId(note.id); setEditValue(note.text); };
  const saveEdit = () => {
    setClinicalNotes(clinicalNotes.map(n => n.id === editingNoteId ? { ...n, text: editValue } : n));
    setEditingNoteId(null);
  };

  const handleResearch = async () => {
    if (!researchQuery.trim()) return;
    setIsResearching(true);
    try {
      const payload = { contents: [{ parts: [{ text: researchQuery }] }], tools: [{ google_search: {} }] };
      const result = await fetchGemini(payload);
      setResearchOutput(result.candidates?.[0]?.content?.parts?.[0]?.text || "Results not found.");
    } catch (e) { setResearchOutput("Research module offline."); } 
    finally { setIsResearching(false); }
  };

  const handleSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const payload = { contents: [{ parts: [{ text: `Summarize these logs: ${JSON.stringify(clinicalNotes)}` }] }] };
      const result = await fetchGemini(payload);
      setAiSummary(result.candidates?.[0]?.content?.parts?.[0]?.text || "Summary unavailable.");
    } catch (e) { setAiSummary("Insights temporarily offline."); } 
    finally { setIsGeneratingSummary(false); }
  };

  if (!isLoggedIn) return <LoginPage darkMode={darkMode} onLogin={(u) => { setUser(u); setIsLoggedIn(true); }} setDarkMode={setDarkMode} />;

  const isFamily = user?.role === 'family';
  const cardClass = darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 shadow-none' : 'bg-[#FAF9F6] border-[#2D3E2F]/10 shadow-sm text-[#1C1C1C]';

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark bg-slate-950' : 'bg-[#F0EFE9]'}`}>
      
      {/* SIDEBAR: Forest Green Styling */}
      <aside className={`w-72 flex flex-col z-20 ${darkMode ? 'bg-slate-900 border-r border-slate-800' : 'bg-[#2D3E2F] shadow-2xl'}`}>
        <div className="p-10 flex flex-col items-center border-b border-white/10">
          {/* The Hover-able Logo Container */}
  <button 
    onClick={() => setCurrentPage('Dashboard')} 
    className="group flex flex-col items-center transition-all duration-500 hover:scale-105 active:scale-95"
  >
    {/* The Shield Icon - Matching Landing Page colors */}
    <div className="bg-[#FAF9F6]/10 p-4 rounded-[20px] mb-4 text-[#F0EFE9] shadow-inner group-hover:bg-[#FAF9F6]/20 transition-colors">
      <Shield size={32} />
    </div>
    
    {/* Text Label - Matching Editorial Style */}
    <h1 className="text-2xl text-[#F0EFE9] font-serif tracking-tight group-hover:text-white transition-colors">
      AmbiSense
    </h1>
  </button>

  <span className="text-[10px] text-[#F0EFE9]/40 uppercase tracking-[0.3em] font-bold mt-4 block">
    Secure Gateway
  </span>       
</div>
        <nav className="flex-1 py-10 px-6 space-y-2 overflow-y-auto no-scrollbar">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={currentPage === 'Dashboard'} onClick={() => setCurrentPage('Dashboard')} />
          <NavItem icon={<Activity size={20}/>} label="Wellness Stats" active={currentPage === 'Wellness Stats'} onClick={() => setCurrentPage('Wellness Stats')} />
          <NavItem icon={<Stethoscope size={20}/>} label="Medical Records" active={currentPage === 'Medical Records'} onClick={() => setCurrentPage('Medical Records')} />
          <NavItem icon={<User size={20}/>} label="Profile" active={currentPage === 'Profile'} onClick={() => setCurrentPage('Profile')} />
        </nav>
        <div className="p-6 border-t border-white/10">
          <button onClick={() => setIsLoggedIn(false)} className="w-full flex items-center justify-center gap-3 px-4 py-4 text-[#F0EFE9]/40 hover:text-white hover:bg-white/5 rounded-[20px] transition-all text-xs font-bold uppercase tracking-widest">
            <LogOut size={18} /> Logout System
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className={`h-20 flex items-center justify-between px-10 ${darkMode ? 'bg-slate-900 border-b border-slate-800' : 'bg-transparent border-b border-[#2D3E2F]/5'}`}>
          <h2 className={`text-2xl font-serif tracking-tight ${darkMode ? 'text-white' : 'text-[#1C1C1C]'}`}>{currentPage}</h2>
          <div className="flex items-center gap-6">
            <button onClick={() => setDarkMode(!darkMode)} className={`p-3 rounded-full transition-all ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-[#2D3E2F]/5 text-[#2D3E2F]'}`}>{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
            <div className="relative">
              <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className={`p-3 rounded-full relative ${darkMode ? 'text-slate-400' : 'text-[#2D3E2F]'}`}><Bell size={20} />{notifications.length > 0 && <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-[#F0EFE9]"></span>}</button>
              {isNotificationOpen && (
                <div className={`absolute right-0 mt-4 w-80 rounded-[30px] shadow-2xl border p-6 z-50 animate-in fade-in slide-in-from-top-2 ${cardClass}`}>
                  <div className="flex justify-between mb-4 px-2"><span className="text-xs font-bold uppercase tracking-widest opacity-40">Alerts</span><button onClick={() => setNotifications([])} className="text-[10px] text-[#2D3E2F] font-black uppercase tracking-widest">Clear all</button></div>
                  <div className="space-y-3">{notifications.length === 0 ? <p className="text-xs text-center text-slate-500 py-4 font-normal italic">No active alerts</p> : notifications.map(n => <div key={n.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-[#2D3E2F]/5 border-[#2D3E2F]/5'}`}><p className="text-xs font-bold leading-tight mb-1">{n.title}</p><span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{n.time}</span></div>)}</div>
                </div>
              )}
            </div>
            <div className="h-8 w-[1px] bg-[#2D3E2F]/10"></div>
            <button onClick={() => setCurrentPage('Profile')} className="w-10 h-10 rounded-full bg-[#2D3E2F] text-[#F0EFE9] flex items-center justify-center text-xs font-bold">JD</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
          {currentPage === 'Dashboard' && (
            <div className="space-y-8">
              <div className={`p-8 rounded-[40px] flex items-center justify-between border shadow-sm transition-all duration-700 ${isAlerting ? 'bg-[#E11D48] text-white border-none' : darkMode ? 'bg-emerald-900/20 border-emerald-800 text-emerald-400' : 'bg-[#FAF9F6] border-[#2D3E2F]/10 text-[#2D3E2F]'}`}>
                <div className="flex items-center gap-6">
                  {isAlerting ? <AlertTriangle size={32} className="animate-bounce" /> : <CheckCircle size={32} />}
                  <div><h3 className="text-2xl font-serif tracking-tight">{isAlerting ? "Immediate fall alert" : "Security status: secure"}</h3><p className="text-sm opacity-60 font-medium">Monitoring patient movement via YOLOv11.</p></div>
                </div>
                {isAlerting && <button onClick={() => { setIsAlerting(false); setIsSOSActive(false); }} className="bg-white px-10 py-4 rounded-full text-[#E11D48] active:scale-95 font-black text-xs uppercase tracking-widest transition-all">Clear alert</button>}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 bg-[#1C1C1C] rounded-[60px] overflow-hidden relative aspect-video shadow-2xl border border-[#2D3E2F]/10">
                  <div className="absolute top-8 left-8 z-10 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-3 border border-white/10"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div><span className="text-white text-[10px] uppercase font-black tracking-[0.2em]">Live metadata feed</span></div>
                  <img src="https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200" className={`w-full h-full object-cover transition-all duration-1000 ${isPrivacyMasked ? 'blur-3xl opacity-20' : 'opacity-20 grayscale'}`} alt="View" />
                  {!isPrivacyMasked && <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100"><circle cx="50" cy="35" r="2.5" fill="#10B981" className="animate-pulse" /><line x1="50" y1="35" x2="50" y2="65" stroke="#10B981" strokeWidth="0.8" /><line x1="50" y1="45" x2="38" y2="58" stroke="#10B981" strokeWidth="0.8" /><line x1="50" y1="45" x2="62" y2="58" stroke="#10B981" strokeWidth="0.8" /></svg>}
                  <div className="absolute bottom-10 right-10 flex gap-4">
                    <button onClick={() => setIsPrivacyMasked(!isPrivacyMasked)} className="bg-white/10 p-5 rounded-full text-white backdrop-blur-xl transition-all hover:bg-white/20 border border-white/10">{isPrivacyMasked ? <Eye size={22} /> : <EyeOff size={22} />}</button>
                    <button onClick={() => setIsAlerting(true)} className="bg-[#E11D48] text-white px-10 py-4 rounded-full transition-all active:scale-95 font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/30">Simulate fall</button>
                  </div>
                </div>
                <div className="space-y-8 flex flex-col">
                  <div className={`p-10 rounded-[50px] border flex flex-col items-center justify-center text-center ${cardClass}`}>
                    <HeartPulse size={24} className="text-rose-500 mb-4" />
                    <h4 className="text-[10px] text-[#2D3E2F]/40 uppercase font-black tracking-[0.3em] mb-3">Posture</h4>
                    <div className="bg-[#2D3E2F]/5 border border-[#2D3E2F]/5 p-6 rounded-[30px] flex items-center justify-center gap-4 text-[#2D3E2F] w-full">
                      <span className="text-3xl font-serif italic">{currentAction}</span>
                    </div>
                  </div>

                  <div className={`p-10 rounded-[50px] border flex-1 overflow-hidden ${cardClass}`}>
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-[10px] text-[#2D3E2F]/40 uppercase font-black tracking-[0.3em]">Regimen</h4>
                      <button onClick={readScheduleAloud} disabled={isSpeaking} className="p-3 bg-[#2D3E2F]/5 text-[#2D3E2F] rounded-full active:scale-90 transition-all">{isSpeaking ? <Loader2 size={18} className="animate-spin" /> : <Volume2 size={18} />}</button>
                    </div>
                    <div className="space-y-3">
                      {medications.map((m, i) => (
                        <div key={i} className={`p-4 rounded-[20px] border flex items-center gap-4 transition-all ${m.completed ? (darkMode ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-100') : 'bg-transparent border-[#2D3E2F]/5'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.completed ? 'bg-emerald-500 text-white' : 'bg-[#2D3E2F]/10 text-[#2D3E2F]'}`}>{m.completed ? <CheckCircle size={14} /> : <Pill size={14} />}</div>
                          <div><p className={`text-xs font-bold leading-none mb-1`}>{m.med}</p><span className={`text-[9px] uppercase font-bold tracking-widest opacity-40`}>{m.time} • {m.dose}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentPage === 'Wellness Stats' && (
            <div className="space-y-10 animate-in fade-in duration-700">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-serif tracking-tight">Wellness Center</h1>
                <div className={`p-1 rounded-full border flex ${cardClass}`}>
                  {['Day', 'Week', 'Month'].map(r => (<button key={r} onClick={() => setWellnessRange(r)} className={`px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${wellnessRange === r ? 'bg-[#2D3E2F] text-[#F0EFE9]' : 'text-[#2D3E2F]/40 hover:bg-[#2D3E2F]/5'}`}>{r}</button>))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <MetricCard label="Steps" value={wellnessRange === 'Day' ? "5,420" : "32,100"} trend="+5.2%" darkMode={darkMode} />
                <MetricCard label="Stability" value="88%" trend="Secure" darkMode={darkMode} />
                <MetricCard label="Active effort" value="42m" trend="+12%" darkMode={darkMode} />
                <MetricCard label="Sync health" value="99%" trend="Secure" darkMode={darkMode} />
              </div>
              <div className={`p-12 rounded-[60px] border ${cardClass}`}>
                <h3 className="text-xl font-serif italic mb-10 tracking-tight">Intensity Trend</h3>
                <div className="h-[400px]"><ResponsiveContainer width="100%" height="100%">{wellnessRange === 'Day' ? <AreaChart data={DATA_DAY}><defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2D3E2F" stopOpacity={0.1}/><stop offset="95%" stopColor="#2D3E2F" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.05} /><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#2D3E2F', fontSize: 10, opacity: 0.4}} /><Area type="monotone" dataKey="intensity" stroke="#2D3E2F" strokeWidth={3} fillOpacity={1} fill="url(#c)" /></AreaChart> : <BarChart data={DATA_WEEK}><CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.05} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#2D3E2F', fontSize: 10, opacity: 0.4}} /><Bar dataKey="steps" fill="#2D3E2F" radius={[10, 10, 0, 0]} barSize={40} /></BarChart>}</ResponsiveContainer></div>
              </div>
            </div>
          )}

          {currentPage === 'Medical Records' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
              <div className={`p-12 rounded-[50px] border ${cardClass}`}>
                <h3 className="text-2xl font-serif mb-10 flex items-center gap-4 italic tracking-tight"><Stethoscope size={28} className="text-[#2D3E2F]" /> Clinical Logs</h3>
                {!isFamily ? (<div className="space-y-6 mb-12"><textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Enter clinical observation..." className={`w-full p-8 rounded-[35px] outline-none border focus:ring-4 focus:ring-[#2D3E2F]/5 transition-all text-sm placeholder-[#2D3E2F]/20 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-[#2D3E2F]/5 border-[#2D3E2F]/5'}`} rows="4" /><button onClick={handleSaveNote} className="w-full bg-[#2D3E2F] text-[#F0EFE9] py-6 rounded-full text-xs font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">Submit Medical Record</button></div>) : (<div className="p-6 bg-amber-50 border border-amber-200 rounded-[25px] text-amber-800 text-[10px] font-black uppercase tracking-widest mb-10 flex items-center gap-3"><Shield size={20} /> Encrypted View Mode</div>)}
                <div className="space-y-4">{clinicalNotes.map(n => <div key={n.id} className={`p-8 rounded-[35px] border ${cardClass}`}><div className="flex justify-between mb-4 text-[10px] font-black uppercase tracking-widest opacity-30"><span>{n.author}</span><span>{n.date}</span></div>{editingNoteId === n.id ? (<div className="space-y-4"><textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full p-6 rounded-2xl border bg-transparent text-sm outline-none" /><div className="flex gap-2"><button onClick={saveEdit} className="px-6 py-2 bg-[#2D3E2F] text-white rounded-full text-[10px] font-black uppercase">Save</button><button onClick={() => setEditingNoteId(null)} className="px-6 py-2 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest">Exit</button></div></div>) : (<><p className="text-sm leading-relaxed mb-6">{n.text}</p>{!isFamily && (<div className="flex gap-6 border-t border-[#2D3E2F]/5 pt-5"><button onClick={() => startEdit(n)} className="text-[#2D3E2F]/30 hover:text-[#2D3E2F] transition-all"><Edit3 size={16} /></button><button onClick={() => deleteNote(n.id)} className="text-[#2D3E2F]/30 hover:text-rose-500 transition-all"><Trash2 size={16} /></button></div>)}</>)}</div>)}</div>
              </div>
              <div className="space-y-12">
                <div className={`p-12 rounded-[50px] bg-[#2D3E2F] text-[#F0EFE9] shadow-2xl relative overflow-hidden`}><h3 className="text-2xl font-serif mb-6 flex items-center gap-4 italic tracking-tight"><Sparkles size={28}/> Research Vault</h3><div className="relative mb-10"><input type="text" value={researchQuery} onChange={(e) => setResearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleResearch()} className="w-full bg-white/10 border border-white/10 rounded-full p-6 pr-20 outline-none focus:ring-4 focus:ring-white/20 text-sm placeholder-white/40 text-white" placeholder="Search medical database..." /><button onClick={handleResearch} disabled={isResearching} className="absolute right-3 top-3 p-4 bg-[#FAF9F6] text-[#2D3E2F] rounded-full hover:scale-105 active:scale-90 transition-all">{isResearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}</button></div>{researchOutput && <div className="p-8 bg-white/5 rounded-[30px] text-xs leading-relaxed italic opacity-80 animate-in fade-in shadow-inner font-normal italic">"{researchOutput}"</div>}</div>
                <div className={`p-12 rounded-[50px] border ${cardClass}`}><div className="flex items-center justify-between mb-8"><h3 className="text-2xl font-serif italic tracking-tight">AI Insights ✨</h3><button onClick={handleSummary} disabled={isGeneratingSummary} className="p-4 bg-[#2D3E2F] text-[#F0EFE9] rounded-full hover:scale-110 active:scale-90 transition-all shadow-xl">{isGeneratingSummary ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}</button></div><div className={`p-8 rounded-[30px] text-sm leading-relaxed italic ${darkMode ? 'bg-slate-800' : 'bg-[#2D3E2F]/5 border border-[#2D3E2F]/5'}`}>"{aiSummary}"</div></div>
              </div>
            </div>
          )}

          {currentPage === 'Profile' && (
            <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-12 duration-700">
              <div className={`p-16 rounded-[60px] border shadow-sm flex items-center gap-16 group ${cardClass}`}>
                <div className="w-48 h-48 rounded-[50px] bg-[#2D3E2F] text-[#F0EFE9] flex items-center justify-center text-7xl font-serif shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]">JD</div>
                <div className="space-y-4"><h1 className="text-6xl font-serif tracking-tighter text-[#1C1C1C]">John Doe</h1><p className="text-[#2D3E2F]/40 text-xl font-serif italic flex items-center gap-4">78 years • Blood: O- • Serial: EG-221</p><div className="flex gap-4 pt-6"><span className="px-8 py-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-500/20">Secure</span><span className="px-8 py-3 bg-[#2D3E2F] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-[#2D3E2F]/20">Premium</span></div></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className={`p-12 rounded-[50px] border space-y-10 ${cardClass}`}><h3 className="text-2xl font-serif italic flex items-center gap-4"><Settings size={24} className="text-[#2D3E2F]" /> System Integrity</h3>
                  <div className="space-y-6">
                    <ToggleRow label="YOLOv11 tracking engine" active={systemIntegrity.tracking} onClick={!isFamily ? () => setSystemIntegrity({...systemIntegrity, tracking: !systemIntegrity.tracking}) : undefined} disabled={isFamily} darkMode={darkMode} />
                    <ToggleRow label="Automated alert dispatch" active={systemIntegrity.alerts} onClick={!isFamily ? () => setSystemIntegrity({...systemIntegrity, alerts: !systemIntegrity.alerts}) : undefined} disabled={isFamily} darkMode={darkMode} />
                  </div>
                </div>
                <div className={`p-12 rounded-[50px] border flex flex-col justify-between ${cardClass}`}>
                  <div><h3 className="text-2xl font-serif mb-4 italic">SOS Broadcast</h3><p className="text-[11px] font-bold text-[#2D3E2F]/40 leading-relaxed mb-12 uppercase tracking-widest">Signal triggers priority dispatch to family responders and EMS units.</p></div>
                  <button onClick={activateSOS} className="w-full bg-[#E11D48] text-white py-8 rounded-full text-xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-rose-500/30 active:scale-95 transition-all flex items-center justify-center gap-6 border-4 border-rose-300 animate-pulse-slow">
                    <Send size={32} /> Activate SOS
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {isSOSActive && (<div className="fixed inset-0 z-[100] bg-[#2D3E2F]/90 backdrop-blur-2xl flex items-center justify-center p-12 animate-in fade-in duration-500"><div className="bg-[#FAF9F6] p-16 rounded-[60px] text-center max-w-xl border border-white/10 shadow-2xl"><div className="bg-rose-500/10 p-10 rounded-full w-fit mx-auto mb-10 animate-bounce"><AlertTriangle size={80} className="text-[#E11D48]" /></div><h1 className="text-5xl font-serif text-[#1C1C1C] mb-4 tracking-tighter">Protocol Activated</h1><p className="text-[#1C1C1C]/50 text-sm mb-12 uppercase font-black tracking-widest leading-loose">Dispatch in progress. Maintain voice contact.</p><button onClick={() => { setIsSOSActive(false); setIsAlerting(false); }} className="w-full bg-[#1C1C1C] text-white py-7 rounded-full text-xs font-black uppercase tracking-[0.3em] active:scale-95 transition-all shadow-2xl">Abort Signal</button></div></div>)}
    </div>
  );
}

// --- REUSABLE SUB-COMPONENTS ---

function LoginPage({ onLogin, darkMode, setDarkMode }) {
  const [role, setRole] = useState('caregiver');
  const [otpModal, setOtpModal] = useState(false);

  return (
    <div className={`min-h-screen flex items-center justify-center p-10 relative overflow-hidden ${darkMode ? 'bg-slate-950' : 'bg-[#F0EFE9]'}`}>
      <div className={`w-full max-w-lg rounded-[60px] shadow-[0_50px_100px_-20px_rgba(45,62,47,0.3)] p-16 border flex flex-col items-center relative z-10 animate-in fade-in zoom-in duration-1000 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-[#FAF9F6] border-[#2D3E2F]/10'}`}>
        
        {/* --- BRAND LOGO (Matching Landing Page) --- */}
        <div className="group flex flex-col items-center mb-12">
          <div className="bg-[#2D3E2F] p-8 rounded-[30px] text-[#F0EFE9] mb-6 shadow-2xl shadow-[#2D3E2F]/40 transition-transform duration-500 group-hover:scale-105">
            <Shield size={56} strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-serif text-[#1C1C1C] mb-2 tracking-tighter">AmbiSense</h1>
          <p className="text-[#2D3E2F]/40 text-[10px] font-black uppercase tracking-[0.4em] underline decoration-[#2D3E2F]/10 underline-offset-8">
            Authorized Access Only
          </p>
        </div>

        {/* --- LOGIN FORM --- */}
        <form onSubmit={(e) => { e.preventDefault(); onLogin({ role }); }} className="w-full space-y-6">
          <input 
            type="email" 
            required 
            placeholder="Identifier"
            className={`w-full px-10 py-6 rounded-full border outline-none text-sm transition-all placeholder-[#2D3E2F]/20 font-bold ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-transparent border-[#2D3E2F]/10 focus:border-[#2D3E2F]'}`} 
          />
          <input 
            type="password" 
            required 
            placeholder="Passkey"
            className={`w-full px-10 py-6 rounded-full border outline-none text-sm transition-all placeholder-[#2D3E2F]/20 font-bold ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-transparent border-[#2D3E2F]/10 focus:border-[#2D3E2F]'}`} 
          />
          
          <div className={`flex p-2 rounded-full gap-1 border border-[#2D3E2F]/5 ${darkMode ? 'bg-slate-800' : 'bg-[#2D3E2F]/5'}`}>
            {['caregiver', 'family'].map(r => (
              <button 
                key={r} 
                type="button" 
                onClick={() => setRole(r)} 
                className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${role === r ? 'bg-[#2D3E2F] text-white shadow-xl' : 'text-[#2D3E2F]/30'}`}
              >
                {r}
              </button>
            ))}
          </div>

          <button className="w-full group bg-[#2D3E2F] text-[#F0EFE9] py-7 rounded-full transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-[#2D3E2F]/40">
            <div className="flex items-center justify-center gap-4 font-black text-xs uppercase tracking-[0.3em]">
              Authorize Session <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </button>
        </form>
        
        <button onClick={() => setOtpModal(true)} className="mt-12 text-[10px] text-[#2D3E2F] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">
          Request access code
        </button>

        {otpModal && (
          <div className="absolute inset-0 bg-[#2D3E2F]/95 backdrop-blur-2xl flex items-center justify-center p-12 z-50 rounded-[60px] animate-in fade-in duration-500">
            <div className="bg-[#FAF9F6] p-12 rounded-[45px] text-center max-w-sm border border-white/10 text-[#1C1C1C]">
              <div className="bg-emerald-50 p-8 rounded-full w-fit mx-auto mb-10 shadow-inner">
                <CheckCircle className="text-emerald-600" size={56} />
              </div>
              <h3 className="text-3xl font-serif text-[#1C1C1C] mb-4">Key Dispatched</h3>
              <p className="text-[#1C1C1C]/50 text-[10px] font-black uppercase tracking-widest leading-loose mb-12">
                Encrypted verification code transmitted to your verified node.
              </p>
              <button onClick={() => setOtpModal(false)} className="w-full bg-[#1C1C1C] text-white py-6 rounded-full text-xs font-black uppercase tracking-[0.3em] active:scale-95 transition-all">
                Enter Portal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-6 px-8 py-5 rounded-[25px] transition-all duration-500 ${active ? 'bg-[#FAF9F6] text-[#2D3E2F] shadow-xl translate-x-3' : 'text-[#F0EFE9]/40 hover:text-[#F0EFE9] hover:bg-white/5'}`}>
      <div className={active ? 'text-[#2D3E2F]' : 'inherit'}>{icon}</div>
      <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function MetricCard({ label, value, trend, darkMode }) {
  return (
    <div className={`p-10 rounded-[50px] border shadow-sm flex flex-col justify-center transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-[#FAF9F6] border-[#2D3E2F]/10'}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-40">{label}</p>
      <div className="flex items-end justify-between font-normal">
        <h3 className="text-4xl font-serif italic text-[#2D3E2F] tracking-tight">{value}</h3>
        <div className={`text-[9px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest ${trend.includes('+') || trend === 'Secure' ? 'bg-[#2D3E2F]/5 text-[#2D3E2F]' : 'bg-rose-500/10 text-rose-600'}`}>{trend}</div>
      </div>
    </div>
  );
}

function ToggleRow({ label, active, onClick, disabled, darkMode }) {
  const trackClass = active ? 'bg-[#2D3E2F] border-[#2D3E2F]' : (darkMode ? 'bg-slate-800 border-slate-700' : 'bg-[#2D3E2F]/10 border-transparent');
  const thumbClass = active ? 'translate-x-[30px]' : 'translate-x-[4px]';
  return (
    <div onClick={!disabled ? onClick : undefined} className={`flex items-center justify-between p-8 rounded-[35px] border transition-all ${disabled ? 'cursor-default opacity-40' : 'cursor-pointer hover:shadow-lg hover:border-[#2D3E2F]/20'} ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-transparent border-[#2D3E2F]/5'}`}>
      <span className="text-xs font-bold uppercase tracking-widest opacity-80">{label}</span>
      <div className={`w-[58px] h-[30px] rounded-full relative transition-all border flex items-center ${trackClass}`}>
        <div className={`w-[22px] h-[22px] rounded-full shadow-lg transition-all bg-white ${thumbClass}`} />
      </div>
    </div>
  );
}
