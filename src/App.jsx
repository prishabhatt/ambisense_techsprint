
import React, { useState, useEffect } from 'react';
import { auth, signInWithEmailAndPassword, signOut } from './firebase/client.js';
import { 
  Shield, LayoutDashboard, Activity, Stethoscope, User, LogOut, 
  Bell, AlertTriangle, CheckCircle, Eye, EyeOff, Calendar, 
  Send, ArrowRight, Sparkles, Volume2, Search, 
  Loader2, Settings, Info, Activity as ActivityIcon,
  Pill, HeartPulse, UserCircle, Trash2, Edit3, Sun, Moon
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';

// --- UTILITY: PCM TO WAV (Fixed version) ---
function pcmToWav(pcmBase64, sampleRate = 24000) {
  try {
    console.log('🎵 Converting PCM to WAV, input size:', pcmBase64?.length || 0);
    
    // Decode base64
    const binaryString = atob(pcmBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create WAV header
    const dataLength = bytes.length;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);
    
    // Helper to write strings
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    // Write WAV header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write PCM data
    const pcmView = new Uint8Array(buffer, 44);
    pcmView.set(bytes);
    
    console.log('✅ WAV created:', buffer.byteLength, 'bytes');
    return new Blob([buffer], { type: 'audio/wav' });
    
  } catch (error) {
    console.error('❌ PCM to WAV error:', error);
    
    // Create silent fallback audio
    const duration = 1;
    const numSamples = sampleRate * duration;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    
    // Write WAV header for silent audio
    view.setUint32(0, 0x46464952, true); // "RIFF"
    view.setUint32(4, 36 + numSamples * 2, true);
    view.setUint32(8, 0x45564157, true); // "WAVE"
    view.setUint32(12, 0x20746d66, true); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x61746164, true); // "data"
    view.setUint32(40, numSamples * 2, true);
    
    // Fill with silence
    for (let i = 0; i < numSamples; i++) {
      view.setInt16(44 + i * 2, 0, true);
    }
    
    console.log('⚠️ Created silent fallback audio');
    return new Blob([buffer], { type: 'audio/wav' });
  }
}

// --- API HELPER ---
const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('idToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`http://localhost:3001${url}`, {
      ...options,
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('idToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      window.location.reload();
      return null;
    }
    
    return response;
  } catch (error) {
    console.error('API fetch error:', error);
    return null;
  }
};

// Chart data
const DATA_DAY = [
  { time: '08:00', intensity: 20 }, { time: '10:00', intensity: 85 },
  { time: '12:00', intensity: 45 }, { time: '14:00', intensity: 30 },
  { time: '16:00', intensity: 75 }, { time: '18:00', intensity: 15 },
];

const DATA_WEEK = [
  { label: 'Mon', steps: 4200 }, 
  { label: 'Tue', steps: 5800 },
  { label: 'Wed', steps: 3100 }, 
  { label: 'Thu', steps: 7200 },
  { label: 'Fri', steps: 6300 }, 
  { label: 'Sat', steps: 8900 }, 
  { label: 'Sun', steps: 5400 },
];

const DATA_MONTH = [
  { label: 'Week 1', steps: 28400 }, 
  { label: 'Week 2', steps: 35200 },
  { label: 'Week 3', steps: 21600 }, 
  { label: 'Week 4', steps: 41100 },
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
  
  // Medical Records CRUD State
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

  // System States
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

  // --- ML INTEGRATION: POLLING BACKEND FOR FALLS ---
  useEffect(() => {
    if (!isLoggedIn) return;

    const checkFallStatus = async () => {
      try {
        // Asking your Node backend (Port 3001) for the status
        const response = await apiFetch('/api/check-fall'); 
        const data = await response.json();
        
        if (data.alert === true) {
          // These trigger your existing frontend red banner and posture card
          setIsAlerting(true); 
          setCurrentAction('FALL DETECTED');
        }
      } catch (err) {
        console.warn("ML Service connection pending...");
      }
    };

    // Check every 3 seconds
    const interval = setInterval(checkFallStatus, 3000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Check for stored login on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('idToken');
    const storedEmail = localStorage.getItem('userEmail');
    const storedRole = localStorage.getItem('userRole');
    
    if (storedToken && storedEmail) {
      setUser({
        email: storedEmail,
        role: storedRole || 'family',
        idToken: storedToken
      });
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      const actions = ['Walking', 'Sitting', 'Standing', 'Resting'];
      setCurrentAction(actions[Math.floor(Math.random() * actions.length)]);
    }, 6000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Actionable SOS logic
  const activateSOS = () => {
    setIsSOSActive(true);
    setIsAlerting(true);
  };

  // WORKING TTS Function with backend API
  const readScheduleAloud = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    
    console.log('🔊 Starting TTS playback...');
    
    try {
      const scheduleText = medications.map(m => 
        `${m.time}: ${m.med} (${m.dose})`
      ).join(". Next, ");
      
      const text = `Today's medication schedule: ${scheduleText}`;
      console.log('📝 Text to speak:', text.substring(0, 100) + '...');
      
      // Try Gemini TTS through backend
      const response = await apiFetch('/api/gemini/tts', {
        method: 'POST',
        body: JSON.stringify({ text })
      });
      
      if (!response) {
        console.error('❌ No response from server');
        setIsSpeaking(false);
        return;
      }
      
      const result = await response.json();
      console.log('📦 Response received:', result.success ? '✅' : '❌');
      
      if (result.success && result.data.audioBase64) {
        console.log('🎵 Audio data received:', result.data.audioBase64.length, 'bytes');
        
        // Method 1: Direct base64 playback
        const audio = new Audio();
        audio.src = `data:audio/wav;base64,${result.data.audioBase64}`;
        audio.controls = false;
        
        audio.oncanplaythrough = () => {
          console.log('✅ Audio can play');
          audio.play().then(() => {
            console.log('▶️ Audio playing');
          }).catch(e => {
            console.error('❌ Play failed:', e);
            setIsSpeaking(false);
          });
        };
        
        audio.onended = () => {
          console.log('✅ Audio finished');
          setIsSpeaking(false);
        };
        
        audio.onerror = (e) => {
          console.error('❌ Audio error:', e);
          setIsSpeaking(false);
          
          // Fallback to Blob playback
          playAudioWithBlob(result.data.audioBase64);
        };
        
        // Start loading
        audio.load();
        
      } else {
        console.error('❌ No audio in response');
        setIsSpeaking(false);
      }
      
    } catch (error) {
      console.error('❌ TTS request error:', error);
      
      // Ultimate fallback: Browser TTS
      useBrowserTTS();
    }
  };

  // Fallback: Blob playback method
  const playAudioWithBlob = (base64Audio) => {
    console.log('🔄 Trying Blob playback method...');
    
    try {
      const wavBlob = pcmToWav(base64Audio, 24000);
      console.log('📦 WAV Blob created:', wavBlob.size, 'bytes');
      
      const audioUrl = URL.createObjectURL(wavBlob);
      const audio = new Audio(audioUrl);
      
      audio.oncanplaythrough = () => {
        console.log('✅ Blob audio ready');
        audio.play().then(() => {
          console.log('🎶 Blob audio playing');
        }).catch(e => {
          console.error('❌ Blob play error:', e);
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
        });
      };
      
      audio.onended = () => {
        console.log('✅ Blob audio finished');
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
      };
      
      audio.onerror = (e) => {
        console.error('❌ Blob audio error:', e);
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
      };
      
      audio.load();
      
    } catch (error) {
      console.error('❌ Blob creation error:', error);
      setIsSpeaking(false);
    }
  };

  // Ultimate fallback: Browser TTS
  const useBrowserTTS = () => {
    console.log('🎤 Falling back to browser TTS');
    
    if ('speechSynthesis' in window) {
      const scheduleText = medications.map(m => 
        `${m.time}: ${m.med} (${m.dose})`
      ).join("\n");
      
      const utterance = new SpeechSynthesisUtterance(`Medication schedule: ${scheduleText}`);
      
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const englishVoice = voices.find(v => v.lang.includes('en'));
        if (englishVoice) utterance.voice = englishVoice;
      }
      
      utterance.rate = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Audio playback failed. Schedule:\n\n' + 
            medications.map(m => `${m.time}: ${m.med} (${m.dose})`).join('\n'));
      setIsSpeaking(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteInput.trim()) return;
    
    try {
      const response = await apiFetch('/api/medical', {
        method: 'POST',
        body: JSON.stringify({ note: noteInput })
      });
      
      if (!response) return;
      
      const result = await response.json();
      if (result.success) {
        const newNote = {
          id: result.data.id,
          text: noteInput,
          date: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit' }),
          author: user?.email || "Caregiver"
        };
        setClinicalNotes([newNote, ...clinicalNotes]);
        setNoteInput("");
      }
    } catch (error) {
      console.error('Save note error:', error);
    }
  };

  const deleteNote = async (id) => {
    try {
      const response = await apiFetch(`/api/medical/${id}`, {
        method: 'DELETE'
      });
      
      if (!response) return;
      
      const result = await response.json();
      if (result.success) {
        setClinicalNotes(clinicalNotes.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Delete note error:', error);
    }
  };

  const startEdit = (note) => { 
    setEditingNoteId(note.id); 
    setEditValue(note.text); 
  };
  
  const saveEdit = async () => {
    try {
      const response = await apiFetch(`/api/medical/${editingNoteId}`, {
        method: 'PUT',
        body: JSON.stringify({ note: editValue })
      });
      
      if (!response) return;
      
      const result = await response.json();
      if (result.success) {
        setClinicalNotes(clinicalNotes.map(n => 
          n.id === editingNoteId ? { ...n, text: editValue } : n
        ));
        setEditingNoteId(null);
      }
    } catch (error) {
      console.error('Update note error:', error);
    }
  };

  const handleResearch = async () => {
    if (!researchQuery.trim()) return;
    setIsResearching(true);
    try {
      const response = await apiFetch('/api/gemini/research', {
        method: 'POST',
        body: JSON.stringify({ query: researchQuery })
      });
      
      if (!response) return;
      
      const result = await response.json();
      if (result.success) {
        setResearchOutput(result.data.text);
      }
    } catch (e) { 
      setResearchOutput("Research module offline."); 
    } 
    finally { setIsResearching(false); }
  };

  const handleSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const response = await apiFetch('/api/gemini/summarize', {
        method: 'POST',
        body: JSON.stringify({ notes: clinicalNotes.map(n => n.text) })
      });
      
      if (!response) return;
      
      const result = await response.json();
      if (result.success) {
        setAiSummary(result.data.summary);
      }
    } catch (e) { 
      setAiSummary("Insights temporarily offline."); 
    } 
    finally { setIsGeneratingSummary(false); }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('idToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    setUser(null);
  };

  if (!isLoggedIn) return <LoginPage darkMode={darkMode} onLogin={(u) => { 
    setUser(u); 
    setIsLoggedIn(true);
    localStorage.setItem('idToken', u.idToken);
    localStorage.setItem('userEmail', u.email);
    localStorage.setItem('userRole', u.role);
  }} setDarkMode={setDarkMode} />;

  const isFamily = user?.role === 'family';
  const cardClass = darkMode ? 'bg-slate-800 border-slate-700 shadow-none text-slate-100' : 'bg-white border-slate-200 shadow-sm text-slate-800';

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark bg-[#0F172A]' : 'bg-[#F8FAFC]'}`}>
      <aside className={`w-64 flex flex-col z-20 ${darkMode ? 'bg-slate-950 border-r border-slate-800' : 'bg-[#0F172A] shadow-2xl'}`}>
        <div className="p-8 flex flex-col items-center border-b border-slate-800">
          <div className="bg-[#4F46E5] p-3 rounded-2xl mb-4 text-white"><Shield size={32} /></div>
          <h1 className="text-xl text-white uppercase tracking-tight font-normal">AmbiSense</h1>
          <span className="text-[10px] text-slate-300 uppercase tracking-widest font-medium mt-2 block">
            Security gateway
          </span>       
         </div>
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto no-scrollbar">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={currentPage === 'Dashboard'} onClick={() => setCurrentPage('Dashboard')} />
          <NavItem icon={<Activity size={20}/>} label="Wellness stats" active={currentPage === 'Wellness Stats'} onClick={() => setCurrentPage('Wellness Stats')} />
          <NavItem icon={<Stethoscope size={20}/>} label="Medical records" active={currentPage === 'Medical Records'} onClick={() => setCurrentPage('Medical Records')} />
          <NavItem icon={<User size={20}/>} label="Profile" active={currentPage === 'Profile'} onClick={() => setCurrentPage('Profile')} />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-4 py-4 text-slate-400 hover:text-white hover:bg-rose-500/10 rounded-2xl transition-all text-sm font-normal">
            <LogOut size={18} /> Logout system
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className={`h-16 flex items-center justify-between px-8 ${darkMode ? 'bg-slate-900 border-b border-slate-800' : 'bg-white border-b border-slate-200'}`}>
          <h2 className={`text-xl font-normal ${darkMode ? 'text-white' : 'text-slate-800'}`}>{currentPage}</h2>
          <div className="flex items-center gap-6">
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full transition-all ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-indigo-50 text-indigo-600'}`}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="relative">
              <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className={`p-2 rounded-full relative ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <Bell size={20} />
                {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
              </button>
              {isNotificationOpen && (
                <div className={`absolute right-0 mt-4 w-80 rounded-3xl shadow-2xl border p-4 z-50 animate-in fade-in slide-in-from-top-2 ${cardClass}`}>
                  <div className="flex justify-between mb-4 px-2 font-normal">
                    <span className="text-sm">Alerts</span>
                    <button onClick={() => setNotifications([])} className="text-[10px] text-indigo-500 uppercase font-normal">Clear all</button>
                  </div>
                  <div className="space-y-3">
                    {notifications.length === 0 ? 
                      <p className="text-xs text-center text-slate-500 py-4 font-normal">No active alerts</p> : 
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 rounded-2xl border ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
                          <p className="text-xs font-normal">{n.title}</p>
                          <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <button onClick={() => setCurrentPage('Profile')} className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-[#4F46E5] font-normal">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          {currentPage === 'Dashboard' && (
            <div className="space-y-6">
              <div className={`p-5 rounded-[2rem] flex items-center justify-between border shadow-sm transition-all duration-500 ${isAlerting ? 'bg-[#FFF1F2] border-rose-200 text-[#E11D48]' : darkMode ? 'bg-emerald-900/20 border-emerald-800 text-emerald-400' : 'bg-[#ECFDF5] border-emerald-200 text-[#059669]'}`}>
                <div className="flex items-center gap-4">
                  {isAlerting ? <AlertTriangle size={28} className="animate-bounce" /> : <CheckCircle size={28} />}
                  <div>
                    <h3 className="text-xl tracking-tight font-normal">{isAlerting ? "Immediate fall alert" : "Security status: secure"}</h3>
                    <p className="text-sm opacity-80 font-normal">Active monitoring is tracking patient movement.</p>
                  </div>
                </div>
                {isAlerting && (
                  <button onClick={() => { setIsAlerting(false); setIsSOSActive(false); }} className="bg-white px-8 py-3 rounded-2xl border border-rose-200 text-[#E11D48] active:scale-95 font-normal transition-all">
                    Clear alert
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#0F172A] rounded-[3rem] overflow-hidden relative aspect-video border border-slate-800">
                  <div className="absolute top-6 left-6 z-10 bg-black/40 px-3 py-1.5 rounded-full flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#E11D48] rounded-full animate-pulse"></div>
                    <span className="text-white text-[10px] uppercase font-normal">Live security feed</span>
                  </div>
                  <img 
                  src="http://localhost:5000/video_feed" 
                  className={`w-full h-full object-cover transition-all duration-1000 ${isPrivacyMasked ? 'blur-3xl' : ''}`} 
                  alt="Live AI Security Feed" 
                  />
                  {!isPrivacyMasked && (
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="35" r="2.5" fill="#059669" className="animate-pulse" />
                      <line x1="50" y1="35" x2="50" y2="65" stroke="#059669" strokeWidth="0.8" />
                      <line x1="50" y1="45" x2="38" y2="58" stroke="#059669" strokeWidth="0.8" />
                      <line x1="50" y1="45" x2="62" y2="58" stroke="#059669" strokeWidth="0.8" />
                    </svg>
                  )}
                  <div className="absolute bottom-8 right-8 flex gap-4">
                    <button onClick={() => setIsPrivacyMasked(!isPrivacyMasked)} className="bg-white/10 p-4 rounded-3xl text-white backdrop-blur-xl transition-all hover:bg-white/20">
                      {isPrivacyMasked ? <Eye size={22} /> : <EyeOff size={22} />}
                    </button>
                    <button onClick={() => setIsAlerting(true)} className="bg-[#E11D48] text-white px-8 py-3 rounded-3xl transition-all active:scale-95 font-normal">
                      Simulate fall
                    </button>
                  </div>
                </div>
                <div className="space-y-6 flex flex-col">
                  {/* Patient Posture Card */}
                  <div className={`p-6 rounded-[2.5rem] border ${cardClass}`}>
                    <h4 className="text-[10px] text-slate-400 uppercase mb-4 flex items-center gap-2 font-normal">
                      <HeartPulse size={12} className="text-rose-500" /> Patient posture
                    </h4>
                    <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-[2rem] flex items-center justify-between text-indigo-900">
                      <span className="text-xl font-normal">{currentAction}</span>
                      <ActivityIcon className="animate-pulse" />
                    </div>
                  </div>

                  {/* Daily Regimen Card */}
                  <div className={`p-6 rounded-[2.5rem] border flex-1 overflow-hidden ${cardClass}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] text-slate-400 uppercase font-normal tracking-wide">Daily regimen</h4>
                      <button 
                        onClick={readScheduleAloud} 
                        disabled={isSpeaking} 
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"
                      >
                        {isSpeaking ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {medications.map((m, i) => (
                        <div 
                          key={i} 
                          className={`p-3 rounded-2xl border flex items-center gap-4 ${
                            m.completed 
                              ? (darkMode ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-100') 
                              : (darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-100')
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            m.completed ? 'bg-emerald-500 text-white' : 'bg-indigo-100 text-indigo-600'
                          }`}>
                            {m.completed ? <CheckCircle size={14} /> : <Pill size={14} />}
                          </div>
                          <div>
                            <p className={`text-xs font-bold leading-none mb-1 ${
                              darkMode ? 'text-white' : 'text-slate-900'
                            }`}>
                              {m.med}
                            </p>
                            <span className={`text-[9px] uppercase font-bold tracking-wider ${
                              darkMode ? 'text-emerald-400' : 'text-slate-500'
                            }`}>
                              {m.time} • {m.dose}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={readScheduleAloud} 
                      disabled={isSpeaking} 
                      className="w-full mt-4 py-2 text-[10px] uppercase text-indigo-500 hover:underline transition-all"
                    >
                      Listen to schedule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentPage === 'Wellness Stats' && (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="flex items-center justify-between">
                <h1 className={`text-3xl tracking-tight font-normal ${darkMode ? 'text-white' : 'text-slate-800'}`}>Wellness center</h1>
                <div className={`p-1 rounded-3xl border flex ${cardClass}`}>
                  {['Day', 'Week', 'Month'].map(r => (
                    <button key={r} onClick={() => setWellnessRange(r)} className={`px-10 py-3 rounded-2xl text-xs transition-all uppercase tracking-widest font-normal ${wellnessRange === r ? 'bg-[#4F46E5] text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* DYNAMIC DATA CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard 
                  label="Steps" 
                  value={wellnessRange === 'Day' ? "5,420" : wellnessRange === 'Week' ? "32,100" : "128,400"} 
                  trend={wellnessRange === 'Day' ? "+5.2%" : "+8.1%"} 
                  darkMode={darkMode} 
                />
                <MetricCard 
                  label="Stability" 
                  value={wellnessRange === 'Day' ? "88%" : wellnessRange === 'Week' ? "92%" : "90%"} 
                  trend="Normal" 
                  darkMode={darkMode} 
                />
                <MetricCard 
                  label="Active effort" 
                  value={wellnessRange === 'Day' ? "42m" : wellnessRange === 'Week' ? "280m" : "1,120m"} 
                  trend={wellnessRange === 'Day' ? "+12%" : "+15%"} 
                  darkMode={darkMode} 
                />
                <MetricCard 
                  label="Sync health" 
                  value="99%" 
                  trend="Secure" 
                  darkMode={darkMode} 
                />
              </div>

              <div className={`p-12 rounded-[3.5rem] border ${cardClass}`}>
                <h3 className="text-lg mb-10 font-normal">Intensity trend ({wellnessRange})</h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {wellnessRange === 'Day' ? 
                      <AreaChart data={DATA_DAY}>
                        <defs>
                          <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke={darkMode ? "#334155" : "#F1F5F9"} />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                        <Area type="monotone" dataKey="intensity" stroke="#4F46E5" strokeWidth={5} fillOpacity={1} fill="url(#c)" />
                      </AreaChart> : 
                      <BarChart data={wellnessRange === 'Week' ? DATA_WEEK : DATA_MONTH}>
                        <CartesianGrid vertical={false} stroke={darkMode ? "#334155" : "#F1F5F9"} strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="label" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: darkMode ? '#94A3B8' : '#64748B', fontSize: 12}} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: darkMode ? '#94A3B8' : '#64748B', fontSize: 12}} 
                        />
                        <Tooltip 
                          cursor={{fill: darkMode ? '#1E293B' : '#F8FAFC'}}
                          contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Bar 
                          dataKey="steps" 
                          fill="#4F46E5" 
                          radius={[10, 10, 0, 0]} 
                          barSize={wellnessRange === 'Week' ? 40 : 60} 
                        />
                      </BarChart>
                    }
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {currentPage === 'Medical Records' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-7xl mx-auto">
              <div className={`p-10 rounded-[3rem] border ${cardClass}`}>
                <h3 className="text-2xl mb-8 flex items-center gap-3 font-normal tracking-tight">
                  <Stethoscope className="text-[#4F46E5]" /> Clinical log
                </h3>
                {!isFamily ? (
                  <div className="space-y-5 mb-10">
                    <textarea 
                      value={noteInput} 
                      onChange={(e) => setNoteInput(e.target.value)} 
                      placeholder="Add observation..." 
                      className={`w-full p-8 rounded-[2rem] outline-none border focus:ring-4 focus:ring-indigo-100 ${darkMode ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                      rows="3" 
                    />
                    <button onClick={handleSaveNote} className="w-full bg-[#4F46E5] text-white py-5 rounded-[2rem] shadow-xl uppercase font-normal tracking-wide transition-all active:scale-95">
                      Save medical record
                    </button>
                  </div>
                ) : (
                  <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl text-amber-800 text-xs mb-10 flex items-center gap-3 uppercase font-normal tracking-wide">
                    <Shield size={20} /> View mode active
                  </div>
                )}
                <div className="space-y-4">
                  {clinicalNotes.map(n => (
                    <div key={n.id} className={`p-6 rounded-3xl border ${cardClass}`}>
                      <div className="flex justify-between mb-3 text-[10px] uppercase text-slate-400 font-normal">
                        <span>{n.author}</span>
                        <span>{n.date}</span>
                      </div>
                      {editingNoteId === n.id ? (
                        <div className="space-y-3">
                          <textarea 
                            value={editValue} 
                            onChange={(e) => setEditValue(e.target.value)} 
                            className="w-full p-4 rounded-xl border focus:ring-2 focus:ring-indigo-500 bg-transparent text-sm" 
                          />
                          <div className="flex gap-2">
                            <button onClick={saveEdit} className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-normal">Save</button>
                            <button onClick={() => setEditingNoteId(null)} className="px-4 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-normal">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-normal">{n.text}</p>
                          {!isFamily && (
                            <div className="flex gap-4 border-t border-slate-100 dark:border-slate-700 mt-4 pt-3">
                              <button onClick={() => startEdit(n)} className="text-slate-400 hover:text-indigo-500">
                                <Edit3 size={14} />
                              </button>
                              <button onClick={() => deleteNote(n.id)} className="text-slate-400 hover:text-rose-500">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-10">
                <div className="bg-[#4F46E5] p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden font-normal">
                  <h3 className="text-2xl flex items-center gap-3 mb-4 uppercase font-normal">
                    <Sparkles size={28}/> Research vault
                  </h3>
                  <div className="relative mb-8">
                    <input 
                      type="text" 
                      value={researchQuery} 
                      onChange={(e) => setResearchQuery(e.target.value)} 
                      onKeyPress={(e) => e.key === 'Enter' && handleResearch()} 
                      className="w-full bg-white/10 border border-white/20 rounded-[2rem] p-6 pr-16 outline-none focus:ring-4 focus:ring-white/30 text-sm placeholder-white/50 text-white" 
                      placeholder="Search clinical data..." 
                    />
                    <button onClick={handleResearch} disabled={isResearching} className="absolute right-3 top-3 p-4 bg-white text-[#4F46E5] rounded-2xl active:scale-95 transition-all">
                      {isResearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                    </button>
                  </div>
                  {researchOutput && (
                    <div className="p-8 bg-white/10 rounded-[2.5rem] text-xs leading-relaxed animate-in fade-in shadow-inner font-normal italic">
                      {researchOutput}
                    </div>
                  )}
                </div>
                <div className={`p-10 rounded-[3rem] border ${cardClass}`}>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl tracking-wide font-normal">AI Insights ✨</h3>
                    <button onClick={handleSummary} disabled={isGeneratingSummary} className="p-3 bg-indigo-50 text-[#4F46E5] rounded-2xl active:scale-95">
                      {isGeneratingSummary ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                    </button>
                  </div>
                  <div className={`p-8 rounded-[2rem] text-sm leading-relaxed ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    "{aiSummary}"
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentPage === 'Profile' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-12 duration-700">
              <div className={`p-12 rounded-[4rem] border shadow-sm flex items-center gap-12 group ${cardClass}`}>
                <div className="w-40 h-40 rounded-[3rem] bg-[#4F46E5] text-white flex items-center justify-center text-6xl shadow-2xl transition-transform group-hover:scale-105">
                  {user?.email?.charAt(0).toUpperCase() || 'J'}
                </div>
                <div className="space-y-3 font-normal">
                  <h1 className="text-5xl tracking-tight font-normal">{user?.email?.split('@')[0] || 'John Doe'}</h1>
                  <p className="text-slate-400 text-xl flex items-center gap-3">
                    <UserCircle className="text-indigo-400"/> 
                    {user?.role === 'caregiver' ? 'Caregiver' : 'Family Member'} • {user?.email}
                  </p>
                  <div className="flex gap-3 pt-4">
                    <span className={`px-6 py-2 ${user?.role === 'caregiver' ? 'bg-emerald-500' : 'bg-blue-500'} text-white text-xs rounded-full shadow-sm uppercase tracking-wide`}>
                      {user?.role === 'caregiver' ? 'Full Access' : 'Read Only'}
                    </span>
                    <span className="px-6 py-2 bg-indigo-500 text-white text-xs rounded-full shadow-sm uppercase tracking-wide">Premium</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className={`p-12 rounded-[3.5rem] border shadow-sm space-y-8 ${cardClass}`}>
                  <h3 className="text-2xl flex items-center gap-3 uppercase font-normal">
                    <Settings className="text-indigo-500" /> System Integrity
                  </h3>
                  <div className="space-y-5">
                    <ToggleRow 
                      label="AI posture tracking engine" 
                      active={systemIntegrity.tracking} 
                      onClick={!isFamily ? () => setSystemIntegrity({...systemIntegrity, tracking: !systemIntegrity.tracking}) : undefined} 
                      disabled={isFamily} 
                      darkMode={darkMode} 
                    />
                    <ToggleRow 
                      label="Automated alert dispatch" 
                      active={systemIntegrity.alerts} 
                      onClick={!isFamily ? () => setSystemIntegrity({...systemIntegrity, alerts: !systemIntegrity.alerts}) : undefined} 
                      disabled={isFamily} 
                      darkMode={darkMode} 
                    />
                  </div>
                </div>
                <div className={`p-12 rounded-[3.5rem] border shadow-sm flex flex-col justify-between ${cardClass}`}>
                  <div>
                    <h3 className="text-2xl mb-3 uppercase font-normal">SOS Broadcast</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-10 font-normal">
                      Signal triggers priority dispatch to family responders and EMS units.
                    </p>
                  </div>
                  <button onClick={activateSOS} className="w-full bg-[#E11D48] text-white py-6 rounded-[2.5rem] text-2xl hover:bg-[#C41E3A] transition-all shadow-[0_20px_50px_rgba(225,29,72,0.3)] border-4 border-rose-300 active:scale-95 flex items-center justify-center gap-5 uppercase animate-pulse-slow">
                    <Send size={32} /> Activate SOS
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {isSOSActive && (
        <div className="fixed inset-0 z-[100] bg-rose-950/90 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="bg-white p-12 rounded-[4rem] text-center max-w-lg border-4 border-rose-200 animate-in zoom-in text-slate-900">
            <div className="bg-rose-50 p-8 rounded-full w-fit mx-auto mb-8 animate-bounce">
              <AlertTriangle size={64} className="text-[#E11D48]" />
            </div>
            <h1 className="text-4xl mb-4 tracking-tighter uppercase font-normal">SOS signal dispatched</h1>
            <p className="text-slate-500 text-sm mb-10 uppercase font-normal">
              Emergency responders have been paged. maintain patient contact.
            </p>
            <button onClick={() => { setIsSOSActive(false); setIsAlerting(false); }} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] text-lg active:scale-95 uppercase tracking-wide transition-all shadow-xl hover:bg-black">
              Cancel emergency signal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LoginPage({ onLogin, darkMode, setDarkMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('caregiver');
  const [otpModal, setOtpModal] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRealLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }
      
      if (!email.includes('@') || !email.includes('.')) {
        throw new Error('Please enter a valid email address');
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const idToken = await user.getIdToken();
      
      let userRole = 'family';
      if (email.includes('caregiver') || email.includes('admin') || email.includes('staff') || email.includes('doctor')) {
        userRole = 'caregiver';
      }
      
      onLogin({
        uid: user.uid,
        email: user.email,
        role: userRole,
        idToken: idToken
      });
      
    } catch (error) {
      console.error('Login error:', error.code, error.message);
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Try again later.');
      } else if (error.code === 'auth/user-disabled') {
        setError('This account has been disabled');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else {
        setError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden ${darkMode ? 'bg-slate-950' : 'bg-[#0F172A]'}`}>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      <div className={`w-full max-w-md rounded-[3.5rem] shadow-2xl p-12 border flex flex-col items-center relative z-10 animate-in fade-in zoom-in duration-700 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="bg-[#4F46E5] p-6 rounded-[2.5rem] text-white mb-8 shadow-xl shadow-indigo-600/30 font-normal">
          <Shield size={56} />
        </div>
        <h1 className="text-4xl tracking-tighter mb-2 uppercase text-[#1E293B] dark:text-white font-normal text-center">AmbiSense</h1>
        <p className="text-[#64748B] text-xs uppercase tracking-wide mb-12 font-normal text-center underline decoration-indigo-200">
          Authentication portal
        </p>
        
        {error && (
          <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleRealLogin} className="w-full space-y-7 text-slate-800">
          <input 
            type="email" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className={`w-full px-8 py-5 rounded-[2rem] border focus:ring-4 focus:ring-indigo-50 outline-none text-sm transition-all font-normal ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#F8FAFC] border-slate-200 text-slate-900'}`} 
            placeholder="Email address" 
            disabled={isLoading}
          />
          <input 
            type="password" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className={`w-full px-8 py-5 rounded-[2rem] border focus:ring-4 focus:ring-indigo-50 outline-none text-sm transition-all font-normal ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#F8FAFC] border-slate-200 text-slate-900'}`} 
            placeholder="Password" 
            disabled={isLoading}
          />
          <div className={`flex p-2 rounded-3xl gap-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            {['caregiver', 'family'].map(r => (
              <button 
                key={r} 
                type="button" 
                onClick={() => setRole(r)} 
                disabled={isLoading}
                className={`flex-1 py-4 text-xs rounded-2xl transition-all capitalize font-normal ${role === r ? 'bg-white text-[#4F46E5] shadow-xl dark:bg-[#4F46E5] dark:text-white' : 'text-slate-400'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {r}
              </button>
            ))}
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full group relative overflow-hidden bg-[#4F46E5] text-white py-6 rounded-[2.5rem] shadow-[0_20px_50px_-10px_rgba(79,70,229,0.5)] transition-all hover:shadow-[0_25px_60px_-10px_rgba(79,70,229,0.6)] hover:-translate-y-1 active:translate-y-0.5 active:shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center justify-center gap-4 relative z-10 font-normal">
              {isLoading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-xl tracking-tight uppercase">Authenticating...</span>
                </>
              ) : (
                <>
                  <span className="text-xl tracking-tight uppercase">Secure Entry</span>
                  <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </div>
          </button>
        </form>
        
        <div className="mt-10 text-center">
          <p className="text-[11px] text-slate-500 mb-4 font-normal">Demo Credentials:</p>
          <div className="space-y-2 text-[10px]">
            <p className="text-slate-600 dark:text-slate-400">
              <span className="font-medium">Caregiver:</span> caregiver@elderguard.com / Caregiver123!
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              <span className="font-medium">Family:</span> family@elderguard.com / Family123!
            </p>
          </div>
        </div>
        
        <button onClick={() => setDarkMode(!darkMode)} className="mt-6 text-slate-400 uppercase text-[9px] font-normal tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          {darkMode ? 'Go light' : 'Go dark'}
        </button>
        
        {otpModal && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-8 z-50 rounded-[3.5rem] animate-in fade-in duration-500">
            <div className="bg-white p-12 rounded-[3.5rem] text-center max-w-sm shadow-2xl border-4 border-indigo-100 text-slate-900">
              <div className="bg-[#ECFDF5] p-6 rounded-full w-fit mx-auto mb-8">
                <CheckCircle className="text-[#059669]" size={56} />
              </div>
              <h3 className="text-3xl text-slate-900 mb-3 tracking-tighter uppercase font-normal">OTP Dispatched</h3>
              <p className="text-[#64748B] text-sm mb-12 uppercase font-normal text-center">
                Verification key sent to verified device.
              </p>
              <button onClick={() => setOtpModal(false)} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] uppercase hover:bg-black transition-all shadow-xl font-normal">
                Continue
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
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-5 px-6 py-5 rounded-3xl transition-all duration-300 tracking-wide font-normal ${
        active 
          ? 'bg-[#4F46E5] text-white shadow-2xl translate-x-1.5' 
          : 'text-slate-400 hover:text-white hover:bg-white/10'
      }`}
    >
      <div className={active ? 'text-white' : 'text-slate-400'}>
        {icon}
      </div>
      <span className="text-sm tracking-tight">{label}</span>
    </button>
  );
}

function MetricCard({ label, value, trend, darkMode }) {
  return (
    <div className={`p-8 rounded-[2.5rem] border shadow-sm flex flex-col justify-center transition-all font-normal ${
      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
    }`}>
      <p className={`text-[10px] uppercase tracking-widest mb-2 font-bold ${
        darkMode ? 'text-slate-400' : 'text-slate-500'
      }`}>
        {label}
      </p>
      <div className="flex items-end justify-between font-normal">
        <h3 className={`text-3xl tracking-tighter font-bold ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>
          {value}
        </h3>
        <div className={`text-[10px] px-3 py-1 rounded-full uppercase font-bold ${
          trend.includes('+') || trend === 'Normal' || trend === 'Secure'
            ? (darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
            : (darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700')
        }`}>
          {trend}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, active, onClick, disabled, darkMode }) {
  const trackClass = active ? (disabled ? 'bg-indigo-200 border-indigo-100' : 'bg-[#4F46E5] border-indigo-400 shadow-inner') : (darkMode ? 'bg-slate-800 border-slate-700 shadow-inner' : 'bg-slate-200 border-slate-300 shadow-inner');
  const thumbClass = active ? 'translate-x-[30px]' : 'translate-x-[4px]';
  
  return (
    <div 
      onClick={!disabled ? onClick : undefined} 
      className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all ${disabled ? 'cursor-default opacity-80' : 'cursor-pointer hover:shadow-md hover:border-indigo-200'} ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-[#F8FAFC] border-slate-200'}`}
    >
      <span className="text-sm tracking-wide font-normal">{label}</span>
      <div className={`w-[58px] h-[30px] rounded-full relative transition-all border flex items-center ${trackClass}`} style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div className={`w-[22px] h-[22px] rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.15)] transition-all bg-white ${thumbClass}`} style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </div>
    </div>
  );
}
