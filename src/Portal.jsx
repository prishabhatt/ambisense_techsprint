import React, { useState, useEffect } from 'react';
import { 
  Shield, LayoutDashboard, Activity, Stethoscope, User, LogOut, 
  Bell, AlertTriangle, CheckCircle, Eye, EyeOff, Calendar, 
  Send, ArrowRight, Sparkles, Volume2, Search, 
  Loader2, Settings, Info, Activity as ActivityIcon,
  Pill, HeartPulse, UserCircle, Trash2, Edit3, Sun, Moon, Thermometer, Wind, X, 
  ArrowUpRight, ShieldCheck, Lock, Fingerprint, ChevronRight, Menu, Plus,
  TrendingUp, Heart, Zap, BarChart3
} from 'lucide-react';
import { Brain } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';

const WEBSITE_URL = "http://localhost:5173"; 

export default function App() {
  const [view, setView] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const handleBackToWebsite = () => {
    window.location.href = WEBSITE_URL;
  };

  // This handles the toggle between Login and Dashboard
  if (!isLoggedIn) {
    return (
      <LoginPage 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        backToWeb={handleBackToWebsite} // FIXED: Passing the function here
        onLogin={(u) => { 
          setUser(u); 
          setIsLoggedIn(true); 
        }} 
      />
    );
  }

  return (
    <DashboardUI 
      user={user} 
      isLoggedIn={isLoggedIn} 
      setIsLoggedIn={setIsLoggedIn} 
      setUser={setUser}
      darkMode={darkMode}    // FIXED: Passing darkMode
      setDarkMode={setDarkMode} // FIXED: Passing setDarkMode
      onLogout={() => {
        setIsLoggedIn(false);
      }} 
    />
  );
}

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
  { label: 'Fri', steps: 6300 }, { label: 'Sat', steps: 8900 }, 
  { label: 'Sun', steps: 5400 },
];

const DATA_MONTH = [
  { label: 'Week 1', steps: 28400 }, { label: 'Week 2', steps: 35200 },
  { label: 'Week 3', steps: 21600 }, { label: 'Week 4', steps: 41100 },
];
const SquareStatCard = ({ label, value, subtext, icon: Icon, bgColor, textColor = "text-[#2D3E2F]" }) => (
  <div className={`${bgColor} aspect-square p-8 rounded-[48px] shadow-sm flex flex-col justify-between transition-all hover:scale-[1.03] active:scale-95 cursor-pointer group`}>
    <div className={`p-4 bg-white/40 backdrop-blur-md rounded-2xl w-fit ${textColor} transition-transform group-hover:rotate-6`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">{label}</p>
      <h3 className={`text-4xl font-serif font-bold leading-none ${textColor}`}>{value}</h3>
      <p className={`text-[9px] font-bold mt-3 opacity-60 uppercase tracking-wider ${textColor}`}>{subtext}</p>
    </div>
  </div>
);

const DashboardUI = ({ user, isLoggedIn, onLogout, darkMode, setDarkMode }) => {
  // 1. Keep the Page state
  const [currentPage, setCurrentPage] = useState('Dashboard'); 
  
  // 2. REMOVE the extra isLoggedIn state here (it's already in props!)
  
  const [isAlerting, setIsAlerting] = useState(false);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [wellnessRange, setWellnessRange] = useState('Day');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isPrivacyMasked, setIsPrivacyMasked] = useState(false);
  const [currentAction, setCurrentAction] = useState('Sitting');
  //const [darkMode, setDarkMode] = useState(false);
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
  // Calculate dynamic values for cards
const getMetricValue = (label) => {
  if (label === 'Steps') {
    if (wellnessRange === 'Day') return "5,420";
    if (wellnessRange === 'Week') return "32,100";
    return "128,400"; // Month
  }
  if (label === 'Active effort') {
    if (wellnessRange === 'Day') return "42m";
    if (wellnessRange === 'Week') return "5.2h";
    return "22h";
  }
  return label === 'Stability' ? "88%" : "99%"; // Defaults
};

// Select the correct data set for the chart
const chartData = wellnessRange === 'Day' ? DATA_DAY : (wellnessRange === 'Week' ? DATA_WEEK : DATA_MONTH);
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
        <nav className="flex-1 py-10 px-4 space-y-2 overflow-y-auto no-scrollbar">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={currentPage === 'Dashboard'} onClick={() => setCurrentPage('Dashboard')} />
          <NavItem icon={<Activity size={20}/>} label="Wellness Stats" active={currentPage === 'Wellness Stats'} onClick={() => setCurrentPage('Wellness Stats')} />
          <NavItem icon={<Stethoscope size={20}/>} label="Medical Records" active={currentPage === 'Medical Records'} onClick={() => setCurrentPage('Medical Records')} />
          <NavItem icon={<User size={20}/>} label="Profile" active={currentPage === 'Profile'} onClick={() => setCurrentPage('Profile')} />
        </nav>
        <div className="p-6 border-t border-white/10">
          <button 
          onClick={onLogout} 
          className="w-full flex items-center justify-center gap-3 px-4 py-4 text-[#F0EFE9]/40 hover:text-white hover:bg-white/5 rounded-[20px] transition-all text-xs font-bold uppercase tracking-widest"
          >
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
  <div className="space-y-8 animate-in fade-in duration-700">
    {/* 1. Security Alert Banner */}
    <div className={`p-8 rounded-[40px] flex items-center justify-between border shadow-sm transition-all duration-700 ${isAlerting ? 'bg-[#E11D48] text-white border-none' : darkMode ? 'bg-emerald-900/20 border-emerald-800 text-emerald-400' : 'bg-[#FAF9F6] border-[#2D3E2F]/10 text-[#2D3E2F]'}`}>
      <div className="flex items-center gap-6">
        {isAlerting ? <AlertTriangle size={32} className="animate-bounce" /> : <CheckCircle size={32} />}
        <div>
          <h3 className="text-2xl font-serif tracking-tight">{isAlerting ? "Immediate fall alert" : "Security status: secure"}</h3>
          <p className="text-sm opacity-60 font-medium">Monitoring patient movement via YOLOv11.</p>
        </div>
      </div>
      {isAlerting && <button onClick={() => { setIsAlerting(false); setIsSOSActive(false); }} className="bg-white px-10 py-4 rounded-full text-[#E11D48] active:scale-95 font-black text-xs uppercase tracking-widest transition-all">Clear alert</button>}
    </div>

    {/* 2. LIVE VIDEO FEED */}
    <div className="bg-[#1C1C1C] rounded-[60px] overflow-hidden relative aspect-video shadow-2xl border border-[#2D3E2F]/10">
      <div className="absolute top-8 left-8 z-10 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-3 border border-white/10">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        <span className="text-white text-[10px] uppercase font-black tracking-[0.2em]">Live node</span>
      </div>
      <img 
        src="https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1600" 
        className={`w-full h-full object-cover transition-all duration-1000 ${isPrivacyMasked ? 'blur-[120px] opacity-10' : 'grayscale opacity-30'}`} 
        alt="Feed" 
      />
      {!isPrivacyMasked && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="35" r="1.5" fill="#10B981" className="animate-pulse" />
          <path d="M50 35 L50 60 M50 40 L40 55 M50 40 L60 55 M50 60 L42 80 M50 60 L58 80" stroke="#10B981" strokeWidth="0.6" fill="none" strokeDasharray="1,1" />
        </svg>
      )}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center">
        <div className="bg-white/95 backdrop-blur-2xl p-6 rounded-[35px] flex gap-10 items-center shadow-2xl">
          <div>
            <p className="text-[9px] uppercase font-black opacity-30 tracking-[0.2em]">State</p>
            <p className="font-serif italic text-3xl text-[#2D3E2F]">{currentAction}</p>
          </div>
          <div className="w-px h-12 bg-[#2D3E2F]/10" />
          <button onClick={() => setIsPrivacyMasked(!isPrivacyMasked)} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#2D3E2F]">
            {isPrivacyMasked ? <Eye size={22} /> : <EyeOff size={22} />} {isPrivacyMasked ? 'Reveal Stream' : 'Privacy Mask'}
          </button>
        </div>
      </div>
    </div>

    {/* 3. STATS CARDS ROW */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
      <SquareStatCard label="Stability" value="94.2%" subtext="Consistent" icon={Activity} bgColor="bg-[#E9EDC9]" />
      <SquareStatCard label="Daily Steps" value="4,821" subtext="82% Target" icon={TrendingUp} bgColor="bg-[#CCD5AE]" />
      <SquareStatCard label="Heart Rate" value="72 bpm" subtext="Stable" icon={Heart} bgColor="bg-[#FAEDCD]" />
      <SquareStatCard label="Active Time" value="6.5h" subtext="Measured" icon={Zap} bgColor="bg-[#D4A373]" textColor="text-white" />
    </div>

    {/* 4. ANALYTICS GRID (Intensity Trend + Movement Distribution) */}
    <div className="grid grid-cols-12 gap-8">
      
      {/* LEFT: INTENSITY TREND */}
      <div className="col-span-12 bg-white p-12 rounded-[60px] border border-[#2D3E2F]/5 shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Density Analytics</h4>
            <p className="text-2xl font-serif text-[#2D3E2F]">Movement Intensity Trend</p>
          </div>
          <BarChart3 size={24} className="opacity-20" />
        </div>
        
        <div className="relative h-64 w-full bg-[#FDFCF9] rounded-3xl border border-[#2D3E2F]/5 p-8 flex items-end gap-3 group">
          <div className="absolute inset-0 flex flex-col justify-between py-8 px-4 pointer-events-none opacity-[0.03]">
            {[...Array(5)].map((_, i) => <div key={i} className="w-full h-px bg-[#2D3E2F]" />)}
          </div>
          
          {[25, 40, 30, 65, 50, 85, 55, 70, 35, 95, 60, 45, 75, 90, 45, 35, 60, 80, 100, 65, 50, 35, 55, 25].map((h, i) => (
            <div key={i} className="flex-1 relative h-full flex items-end">
              <div 
                style={{ height: `${h}%` }} 
                className="w-full bg-[#2D3E2F] rounded-t-lg transition-all duration-500 hover:bg-[#D4A373] shadow-md relative group"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 rounded-t-lg" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between mt-6 px-2 text-[9px] font-black uppercase opacity-30 tracking-[0.4em]">
          <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>Now</span>
        </div>
      </div> 

      {/* RIGHT: MOVEMENT DISTRIBUTION */}
      <div className="col-span-12 lg:col-span-12 space-y-8">
        <div className="bg-[#2D3E2F] p-10 rounded-[60px] shadow-2xl text-white h-full flex flex-col justify-center">
          <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-10 text-center">Movement Distribution</h4>
          <div className="flex items-center justify-center gap-10">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full rotate-[-90deg]">
                <circle cx="72" cy="72" r="64" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
                <circle cx="72" cy="72" r="64" fill="none" stroke="#D4A373" strokeWidth="16" strokeDasharray="402" strokeDashoffset="140" strokeLinecap="round" />
                <circle cx="72" cy="72" r="64" fill="none" stroke="white" strokeWidth="16" strokeDasharray="402" strokeDashoffset="300" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">14h</span>
                <span className="text-[9px] font-black uppercase opacity-40">Total</span>
              </div>
            </div>
            <div className="space-y-4">
              {[{ label: 'Rest', color: 'bg-white', val: '45%' }, { label: 'Active', color: 'bg-[#D4A373]', val: '30%' }, { label: 'Static', color: 'bg-white/10', val: '25%' }].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40 leading-none">{item.label}</span>
                    <span className="text-sm font-bold">{item.val}</span>
                  </div>
                </div>
              ))}
            </div>
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
        {['Day', 'Week', 'Month'].map(r => (
          <button 
            key={r} 
            onClick={() => setWellnessRange(r)} 
            className={`px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${wellnessRange === r ? 'bg-[#2D3E2F] text-[#F0EFE9]' : 'text-[#2D3E2F]/40 hover:bg-[#2D3E2F]/5'}`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>

    {/* Dynamic Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <MetricCard label="Steps" value={getMetricValue('Steps')} trend="+5.2%" darkMode={darkMode} />
      <MetricCard label="Stability" value={getMetricValue('Stability')} trend="Secure" darkMode={darkMode} />
      <MetricCard label="Active effort" value={getMetricValue('Active effort')} trend="+12%" darkMode={darkMode} />
      <MetricCard label="Sync health" value={getMetricValue('Sync health')} trend="Secure" darkMode={darkMode} />
    </div>

    {/* Dynamic Graph */}
    <div className={`p-12 rounded-[60px] border ${cardClass}`}>
      <h3 className="text-xl font-serif mb-14 tracking-tight">{wellnessRange} Intensity Trend</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {wellnessRange === 'Day' ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2D3E2F" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2D3E2F" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.05} />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#2D3E2F', fontSize: 10, opacity: 0.4}} />
              <Tooltip />
              <Area type="monotone" dataKey="intensity" stroke="#2D3E2F" strokeWidth={3} fillOpacity={1} fill="url(#c)" />
            </AreaChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.05} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#2D3E2F', fontSize: 10, opacity: 0.4}} />
              <Tooltip />
              <Bar dataKey={wellnessRange === 'Month' ? 'steps' : 'steps'} fill="#2D3E2F" radius={[10, 10, 0, 0]} barSize={40} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  </div>
)}

          {currentPage === 'Medical Records' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
              <div className={`p-12 rounded-[50px] border ${cardClass}`}>
                <h3 className="text-2xl font-serif mb-10 flex items-center gap-4 tracking-tight"><Stethoscope size={28} className="text-[#2D3E2F]" /> Clinical Logs</h3>
                {!isFamily ? (<div className="space-y-6 mb-12"><textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Enter clinical observation..." className={`w-full p-8 rounded-[35px] outline-none border focus:ring-4 focus:ring-[#2D3E2F]/5 transition-all text-sm placeholder-[#2D3E2F]/20 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-[#2D3E2F]/5 border-[#2D3E2F]/5'}`} rows="4" /><button onClick={handleSaveNote} className="w-full bg-[#2D3E2F] text-[#F0EFE9] py-6 rounded-full text-xs font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">Submit Medical Record</button></div>) : (<div className="p-6 bg-amber-50 border border-amber-200 rounded-[25px] text-amber-800 text-[10px] font-black uppercase tracking-widest mb-10 flex items-center gap-3"><Shield size={20} /> Encrypted View Mode</div>)}
                <div className="space-y-4">{clinicalNotes.map(n => <div key={n.id} className={`p-8 rounded-[35px] border ${cardClass}`}><div className="flex justify-between mb-4 text-[10px] font-black uppercase tracking-widest opacity-30"><span>{n.author}</span><span>{n.date}</span></div>{editingNoteId === n.id ? (<div className="space-y-4"><textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full p-6 rounded-2xl border bg-transparent text-sm outline-none" /><div className="flex gap-2"><button onClick={saveEdit} className="px-6 py-2 bg-[#2D3E2F] text-white rounded-full text-[10px] font-black uppercase">Save</button><button onClick={() => setEditingNoteId(null)} className="px-6 py-2 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest">Exit</button></div></div>) : (<><p className="text-sm leading-relaxed mb-6">{n.text}</p>{!isFamily && (<div className="flex gap-6 border-t border-[#2D3E2F]/5 pt-5"><button onClick={() => startEdit(n)} className="text-[#2D3E2F]/30 hover:text-[#2D3E2F] transition-all"><Edit3 size={16} /></button><button onClick={() => deleteNote(n.id)} className="text-[#2D3E2F]/30 hover:text-rose-500 transition-all"><Trash2 size={16} /></button></div>)}</>)}</div>)}</div>
              </div>
              <div className="space-y-12">
                <div className={`p-12 rounded-[50px] bg-[#2D3E2F] text-[#F0EFE9] shadow-2xl relative overflow-hidden`}><h3 className="text-2xl font-serif mb-6 flex items-center gap-4 tracking-tight"><Sparkles size={28}/> Research Vault</h3><div className="relative mb-10"><input type="text" value={researchQuery} onChange={(e) => setResearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleResearch()} className="w-full bg-white/10 border border-white/10 rounded-full p-6 pr-20 outline-none focus:ring-4 focus:ring-white/20 text-sm placeholder-white/40 text-white" placeholder="Search medical database..." /><button onClick={handleResearch} disabled={isResearching} className="absolute right-3 top-3 p-4 bg-[#FAF9F6] text-[#2D3E2F] rounded-full hover:scale-105 active:scale-90 transition-all">{isResearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}</button></div>{researchOutput && <div className="p-8 bg-white/5 rounded-[30px] text-xs leading-relaxed italic opacity-80 animate-in fade-in shadow-inner font-normal ">"{researchOutput}"</div>}</div>
                <div className={`p-12 rounded-[50px] border ${cardClass}`}><div className="flex items-center justify-between mb-8"><h3 className="text-2xl font-serif tracking-tight"><h2 className="flex items-center gap-2 text-2xl font-serif">
  <Brain className="w-6 h-6 text-black" /> 
  AI Insights
</h2></h3><button onClick={handleSummary} disabled={isGeneratingSummary} className="p-4 bg-[#2D3E2F] text-[#F0EFE9] rounded-full hover:scale-110 active:scale-90 transition-all shadow-xl">{isGeneratingSummary ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}</button></div><div className={`p-8 rounded-[30px] text-sm leading-relaxed italic ${darkMode ? 'bg-slate-800' : 'bg-[#2D3E2F]/5 border border-[#2D3E2F]/5'}`}>"{aiSummary}"</div></div>
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

function LoginPage({ onLogin, backToWeb, darkMode, setDarkMode }) {
  const [role, setRole] = useState('caregiver');

  return (
    <div className="min-h-screen bg-[#F3F1E9] flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
      {/* Decorative Brand Background */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[#2D3E2F]/5 -skew-x-12 translate-x-20 z-0" />
      
      <div className="w-full max-w-5xl bg-white rounded-[40px] shadow-[0_50px_100px_-20px_rgba(45,62,47,0.15)] flex flex-col md:flex-row overflow-hidden relative z-10 border border-[#2D3E2F]/5">
        
        {/* Left Side: Branding & Experience */}
        <div className="w-full md:w-5/12 bg-[#2D3E2F] p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-20 translate-x-20" />
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-8 border border-white/10">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-4xl font-serif leading-tight tracking-tight mb-4">
              The standard for <br />
              <span className="italic font-light opacity-80 text-[#F3F1E9]">dignified care.</span>
            </h2>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs uppercase tracking-widest font-bold text-[10px]">
              Encrypted Session Architecture v4.0
            </p>
          </div>

          <div className="relative z-10 space-y-4 opacity-40">
             <div className="flex items-center gap-3">
               <Fingerprint size={16} />
               <span className="text-[10px] font-bold uppercase tracking-widest">Biometric Ready</span>
             </div>
             <div className="flex items-center gap-3">
               <Lock size={16} />
               <span className="text-[10px] font-bold uppercase tracking-widest">ISO 27001 Compliant</span>
             </div>
          </div>
        </div>

        {/* Right Side: Access Control */}
        <div className="flex-1 p-12 md:p-20 flex flex-col justify-center bg-white">
          <div className="mb-12">
            <h1 className="text-4xl font-serif text-[#1C1C1C] tracking-tighter mb-2">Access Portal</h1>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#2D3E2F]/40">Authorized Entry Only</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onLogin({ role }); }} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[#2D3E2F]/60 ml-1 tracking-widest">Node Identifier</label>
              <input 
                type="email" 
                required 
                placeholder="care@ambisense.ai"
                className="w-full px-6 py-4 rounded-2xl border border-[#2D3E2F]/10 bg-[#F3F1E9]/30 focus:bg-white focus:border-[#2D3E2F] focus:ring-4 focus:ring-[#2D3E2F]/5 outline-none transition-all placeholder:text-[#1C1C1C]/20" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[#2D3E2F]/60 ml-1 tracking-widest">Access Key</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                className="w-full px-6 py-4 rounded-2xl border border-[#2D3E2F]/10 bg-[#F3F1E9]/30 focus:bg-white focus:border-[#2D3E2F] focus:ring-4 focus:ring-[#2D3E2F]/5 outline-none transition-all placeholder:text-[#1C1C1C]/20" 
              />
            </div>

            <div className="flex p-1.5 bg-[#F3F1E9] rounded-2xl mt-8">
              {['caregiver', 'family'].map(r => (
                <button 
                  key={r} 
                  type="button" 
                  onClick={() => setRole(r)} 
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${role === r ? 'bg-white text-[#2D3E2F] shadow-md' : 'text-[#2D3E2F]/30 hover:text-[#2D3E2F]'}`}
                >
                  {r}
                </button>
              ))}
            </div>

            <button className="w-full group mt-8 bg-[#2D3E2F] text-white py-5 rounded-2xl transition-all hover:scale-[1.01] active:scale-95 shadow-xl shadow-[#2D3E2F]/20 flex items-center justify-center gap-4">
              <span className="font-black text-[12px] uppercase tracking-[0.2em]">Authorize Portal</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          
          <div className="mt-12 flex justify-between items-center border-t border-[#2D3E2F]/5 pt-8">
            <button onClick={backToWeb} className="text-[10px] text-[#2D3E2F]/60 font-black uppercase tracking-widest hover:text-[#2D3E2F] transition-colors flex items-center gap-2">
              <ChevronRight className="rotate-180" size={14} /> Back to Web
            </button>
            <button className="text-[10px] text-[#2D3E2F]/40 font-bold uppercase tracking-widest hover:text-[#2D3E2F] transition-colors">
              Reset Node
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-6 px-4 py-5 rounded-[25px] transition-all duration-500 ${active ? 'bg-[#FAF9F6] text-[#2D3E2F] shadow-xl' : 'text-[#F0EFE9]/40 hover:text-[#F0EFE9] hover:bg-white/5'}`}>
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
        <h3 className="text-4xl font-serif text-[#2D3E2F] tracking-tight">{value}</h3>
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
