// ══════════════════════════════════════════════════════════════════
//  GCOEA Connect — Community Forum
//  Full Firebase Integration: Auth + Firestore Real-time
//  Version 3.0 — Production Ready
// ══════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { auth, db, ADMIN_EMAIL } from "./firebase";
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged,
} from "firebase/auth";
import {
  collection, doc, setDoc, getDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, arrayUnion, arrayRemove,
  increment, writeBatch, getDocs,
} from "firebase/firestore";
import {
  MessageCircle, Home, Users, Sun, Moon, LogOut, Send, Search,
  Plus, Shield, Trash2, Menu, X, GraduationCap, Heart, User, Lock,
  Mail, Eye, EyeOff, Star, MessageSquare, ArrowRight, Activity,
  UserCheck, UserX, Hash, BookOpen, Award, Calendar, Globe,
  Bookmark, Link, Edit3, AlertTriangle, Download, Clock,
  Check, CheckCircle, Bell, Zap, ExternalLink, Settings,
  MoreHorizontal, Info,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────
//  CONSTANTS
// ────────────────────────────────────────────────────────────────
const BRANCHES = [
  "Computer Science Engineering","Information Technology",
  "Electronics & Telecommunication","Civil Engineering",
  "Mechanical Engineering","Electrical Engineering","Chemical Engineering",
];
const STUDENT_YEARS = ["1st Year","2nd Year","3rd Year","4th Year"];
const CY = new Date().getFullYear();
const PASS_YEARS = Array.from({ length: CY - 1967 }, (_, i) => `${CY - i}`);
const DEFAULT_CATS = [
  "General","Announcements","Placements","Projects",
  "Events","Alumni Connect","Academics","Help & Q&A","Technical Discussion","Sports & Culture",
];
const BADGES = {
  star:    { e:"⭐", label:"Star Member",       col:"#f5b83d" },
  fire:    { e:"🔥", label:"Active Contributor", col:"#f04e4e" },
  diamond: { e:"💎", label:"Elite Member",       col:"#06b6d4" },
  rocket:  { e:"🚀", label:"High Achiever",      col:"#b47fff" },
  shield:  { e:"🛡️", label:"Verified",           col:"#4f7aff" },
  crown:   { e:"👑", label:"Community Legend",   col:"#f5b83d" },
  mentor:  { e:"🎓", label:"Mentor",             col:"#00c49a" },
  brain:   { e:"🧠", label:"Knowledge Expert",   col:"#3b82f6" },
  trophy:  { e:"🏆", label:"Top Contributor",    col:"#d97706" },
  heart:   { e:"💙", label:"Community Helper",   col:"#4f7aff" },
};

// ────────────────────────────────────────────────────────────────
//  THEME
// ────────────────────────────────────────────────────────────────
const TH = {
  dark: {
    bg:"#06091a", surface:"#0c1127", card:"#101830", border:"#1c2a4a",
    glass:"rgba(10,16,36,0.94)", text:"#dce8ff", textSub:"#7a93c4", textMuted:"#3d5070",
    accent:"#4f7aff", accentGlow:"#4f7aff30", teal:"#00c49a", tealGlow:"#00c49a22",
    gold:"#f5b83d", danger:"#f04e4e", success:"#1fcb6c", warning:"#f59e0b", purple:"#b47fff",
  },
  light: {
    bg:"#eef2ff", surface:"#e4e9fc", card:"#ffffff", border:"#c8d0f0",
    glass:"rgba(255,255,255,0.97)", text:"#0d1535", textSub:"#3a4d80", textMuted:"#8a9bbf",
    accent:"#3b63ee", accentGlow:"#3b63ee22", teal:"#00957a", tealGlow:"#00957a18",
    gold:"#d4900a", danger:"#dc3545", success:"#198754", warning:"#d97706", purple:"#8b5cf6",
  }
};

// ────────────────────────────────────────────────────────────────
//  UTILITIES
// ────────────────────────────────────────────────────────────────
const ini = n => (n||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
const ACOLORS = ["#4f7aff","#00c49a","#f5b83d","#f04e4e","#b47fff","#06b6d4","#ec4899","#22c55e"];
const avBg = n => ACOLORS[(n||"A").charCodeAt(0)%ACOLORS.length];
const chatKey = (a,b) => [a,b].sort().join("-");
const canDeleteOwn = ts => ts && (Date.now()-(ts?.toMillis?.()??ts)) < 3600000;
const canEditProfile = u => !u.lastEditYear || u.lastEditYear < new Date().getFullYear();
const userLabel = u => {
  if(u?.role==="admin")      return {txt:"Admin",      col:"#f5b83d"};
  if(u?.role==="moderator")  return {txt:"Moderator",  col:"#b47fff"};
  if(u?.isAlumni)            return {txt:`Alumni '${u.year}`, col:"#b47fff"};
  return {txt:u?.year||"Member", col:"#00c49a"};
};
const fmtTime = ts => {
  if(!ts) return "Just now";
  const ms = ts?.toMillis?.() ?? (typeof ts==="number"?ts:Date.now());
  const diff = Date.now()-ms;
  if(diff<60000) return "Just now";
  if(diff<3600000) return `${Math.floor(diff/60000)}m ago`;
  if(diff<86400000) return `${Math.floor(diff/3600000)}h ago`;
  return `${Math.floor(diff/86400000)}d ago`;
};
const exportCSV = (users) => {
  const rows = [["Name","Email","Branch","Year/PassOut","Role","Badges","Joined","Posts"]];
  users.forEach(u => rows.push([u.name,u.email,u.branch,u.year,u.role,(u.badges||[]).join(";"),u.joinDate||"",u.posts||0]));
  const csv = rows.map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
  a.download = `GCOEA_Members_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
};

// ────────────────────────────────────────────────────────────────
//  GLOBAL CSS
// ────────────────────────────────────────────────────────────────
const GS = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body,input,textarea,select,button{font-family:'Sora',system-ui,sans-serif;}
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-thumb{background:#1c2a4a;border-radius:4px;}
input::placeholder,textarea::placeholder{opacity:.45;}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}`;

// ────────────────────────────────────────────────────────────────
//  BASE COMPONENTS
// ────────────────────────────────────────────────────────────────
function Av({ name="?", sz=42, online }) {
  const c = avBg(name);
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      <div style={{ width:sz, height:sz, borderRadius:"50%",
        background:`linear-gradient(135deg,${c},${c}88)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:sz*.34, fontWeight:900, color:"#fff", border:`2px solid ${c}44`, letterSpacing:-1 }}>
        {ini(name)}
      </div>
      {online!==undefined && (
        <div style={{ position:"absolute", bottom:1, right:1,
          width:Math.max(sz*.24,8), height:Math.max(sz*.24,8), borderRadius:"50%",
          background:online?"#1fcb6c":"#3d5070", border:"2.5px solid white" }}/>
      )}
    </div>
  );
}

function Chip({ txt, col, emoji="" }) {
  return (
    <span style={{ background:`${col}18`, color:col, border:`1px solid ${col}30`, borderRadius:100,
      padding:"2px 10px", fontSize:11, fontWeight:700, letterSpacing:.3,
      whiteSpace:"nowrap", display:"inline-flex", alignItems:"center", gap:3 }}>
      {emoji}{txt}
    </span>
  );
}

function BadgesRow({ badges=[] }) {
  return (
    <span style={{ display:"inline-flex", gap:3 }}>
      {(badges||[]).slice(0,4).map(b => BADGES[b] && (
        <span key={b} title={BADGES[b].label} style={{ fontSize:13 }}>{BADGES[b].e}</span>
      ))}
    </span>
  );
}

function Orbs({ dm }) {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
      <div style={{ position:"absolute", top:-120, left:-80, width:500, height:500, borderRadius:"50%",
        background:dm?"radial-gradient(circle,#4f7aff14,transparent 70%)":"radial-gradient(circle,#3b63ee10,transparent 70%)",
        filter:"blur(24px)" }}/>
      <div style={{ position:"absolute", bottom:-100, right:-60, width:420, height:420, borderRadius:"50%",
        background:dm?"radial-gradient(circle,#00c49a10,transparent 70%)":"radial-gradient(circle,#00957a0c,transparent 70%)",
        filter:"blur(24px)" }}/>
    </div>
  );
}

function Spinner({ col="#4f7aff" }) {
  return (
    <div style={{ width:22, height:22, border:`2.5px solid ${col}30`,
      borderTop:`2.5px solid ${col}`, borderRadius:"50%",
      animation:"spin .8s linear infinite", display:"inline-block" }}/>
  );
}

function GCOEALogo({ sz=44 }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1a3a8f"/><stop offset="100%" stopColor="#0a1f5c"/>
        </linearGradient>
        <linearGradient id="lg2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f5b83d"/><stop offset="100%" stopColor="#e07b00"/>
        </linearGradient>
      </defs>
      <path d="M50 5 L90 20 L90 55 Q90 80 50 97 Q10 80 10 55 L10 20 Z" fill="url(#lg1)" stroke="#2a5adf" strokeWidth="1.5"/>
      <path d="M50 12 L84 25 L84 55 Q84 76 50 91 Q16 76 16 55 L16 25 Z" fill="none" stroke="#f5b83d" strokeWidth="1.2" opacity="0.6"/>
      <rect x="32" y="35" width="17" height="22" rx="2" fill="#f5b83d" opacity="0.9"/>
      <rect x="51" y="35" width="17" height="22" rx="2" fill="#e8a820" opacity="0.9"/>
      <line x1="50" y1="35" x2="50" y2="57" stroke="#0a1f5c" strokeWidth="1.5"/>
      <circle cx="50" cy="27" r="7" fill="none" stroke="#f5b83d" strokeWidth="2"/>
      <circle cx="50" cy="27" r="3" fill="#f5b83d"/>
      <text x="50" y="71" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#f5b83d" fontFamily="serif" letterSpacing="1">GCOEA</text>
      <text x="50" y="82" textAnchor="middle" fontSize="4.5" fill="white" fontFamily="sans-serif" opacity="0.8">EST. 1960</text>
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────
//  MODALS
// ────────────────────────────────────────────────────────────────
function ProfessionalNotice({ onAccept, t }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.88)", zIndex:2000,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(12px)" }}>
      <div style={{ background:t.card, border:`2px solid ${t.warning}44`, borderRadius:24, padding:36,
        maxWidth:480, width:"100%", boxShadow:`0 0 60px ${t.warning}20`, animation:"fadeIn .3s ease" }}>
        <div style={{ textAlign:"center", marginBottom:22 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:`${t.warning}18`,
            display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
            <AlertTriangle size={28} color={t.warning}/>
          </div>
          <h2 style={{ color:t.text, fontSize:20, fontWeight:900, marginBottom:6 }}>⚠️ Professional Platform</h2>
          <p style={{ color:t.textSub, fontSize:13 }}>GCOEA Community Forum — Official Platform</p>
        </div>
        <div style={{ background:`${t.warning}10`, border:`1px solid ${t.warning}30`, borderRadius:14,
          padding:"16px 18px", marginBottom:20 }}>
          <p style={{ color:t.text, fontSize:13.5, lineHeight:1.9, margin:0 }}>
            ✅ Your <strong>real name, year & branch</strong> are mandatory.<br/>
            ✅ Use only your genuine college or personal email.<br/>
            ✅ Professional conduct is required at all times.<br/><br/>
            ⛔ <strong>Fake or incorrect identity = Permanent ban</strong> with no appeal.
          </p>
        </div>
        <button onClick={onAccept} style={{ width:"100%", background:`linear-gradient(135deg,#4f7aff,#b47fff)`,
          border:"none", borderRadius:14, padding:"14px", color:"#fff", fontSize:15, fontWeight:900,
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <CheckCircle size={18}/> I Understand — Proceed with Real Identity
        </button>
      </div>
    </div>
  );
}

function LogoutConfirm({ onYes, onNo, t }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:2000,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(8px)" }}>
      <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:22, padding:32,
        maxWidth:360, width:"100%", textAlign:"center", animation:"fadeIn .25s ease" }}>
        <div style={{ width:56, height:56, borderRadius:"50%", background:`${t.danger}18`,
          display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
          <LogOut size={24} color={t.danger}/>
        </div>
        <h3 style={{ color:t.text, fontSize:19, fontWeight:900, marginBottom:8 }}>Logout?</h3>
        <p style={{ color:t.textSub, fontSize:13, marginBottom:24, lineHeight:1.7 }}>
          Are you sure you want to logout from GCOEA Connect?<br/>
          Your session is remembered for 3+ days — you can log back in anytime.
        </p>
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={onNo} style={{ flex:1, padding:"13px", background:t.surface,
            border:`1.5px solid ${t.border}`, borderRadius:12, color:t.text, fontSize:14, fontWeight:700, cursor:"pointer" }}>
            No, Stay
          </button>
          <button onClick={onYes} style={{ flex:1, padding:"13px",
            background:`linear-gradient(135deg,${t.danger},#c0392b)`,
            border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:900, cursor:"pointer" }}>
            Yes, Logout
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//  LOGIN PAGE
// ────────────────────────────────────────────────────────────────
function LoginPage({ goReg, dm, toggleDm }) {
  const t = dm?TH.dark:TH.light;
  const [email,setEmail] = useState("");
  const [pass,setPass] = useState("");
  const [showP,setShowP] = useState(false);
  const [err,setErr] = useState("");
  const [loading,setLoading] = useState(false);
  const [showNotice,setShowNotice] = useState(true);

  const inp = { width:"100%", background:t.surface, border:`1.5px solid ${t.border}`, borderRadius:12,
    padding:"13px 16px", color:t.text, fontSize:14, outline:"none", boxSizing:"border-box" };

  const submit = async () => {
    if(!email.trim()||!pass){setErr("Please enter email and password.");return;}
    setLoading(true); setErr("");
    try {
      // 🔥 FIREBASE AUTH — Real encrypted login
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      // onAuthStateChanged in root App handles the rest
    } catch(e) {
      const msgs = {
        "auth/user-not-found":"No account found with this email.",
        "auth/wrong-password":"Incorrect password.",
        "auth/invalid-email":"Invalid email address.",
        "auth/user-disabled":"This account has been disabled.",
        "auth/invalid-credential":"Invalid email or password.",
        "auth/too-many-requests":"Too many attempts. Try again later.",
      };
      setErr(msgs[e.code]||"Login failed. Check your email and password.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:t.bg, display:"flex", alignItems:"center",
      justifyContent:"center", padding:20, position:"relative" }}>
      <style>{GS+`input:focus,select:focus{border-color:${t.accent}!important;outline:none!important;}`}</style>
      <Orbs dm={dm}/>
      {showNotice && <ProfessionalNotice onAccept={()=>setShowNotice(false)} t={t}/>}
      <button onClick={toggleDm} style={{ position:"fixed", top:18, right:18, background:t.card,
        border:`1px solid ${t.border}`, borderRadius:12, padding:"9px 13px", cursor:"pointer",
        color:t.textSub, zIndex:10, display:"flex", alignItems:"center", gap:6 }}>
        {dm?<Sun size={16}/>:<Moon size={16}/>}
      </button>
      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1, animation:"fadeIn .4s ease" }}>
        <div style={{ textAlign:"center", marginBottom:30 }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}><GCOEALogo sz={82}/></div>
          <h1 style={{ fontSize:28, fontWeight:900, color:t.text, letterSpacing:-1, margin:"0 0 6px" }}>GCOEA Connect</h1>
          <p style={{ color:t.textSub, fontSize:13 }}>Official Community Forum — Students & Alumni</p>
        </div>
        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:22, padding:32,
          boxShadow:dm?"0 24px 64px rgba(0,0,0,.5)":"0 24px 64px rgba(0,0,0,.1)" }}>
          <h2 style={{ color:t.text, fontSize:20, fontWeight:900, marginBottom:22 }}>Welcome Back 👋</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
            <div style={{ position:"relative" }}>
              <Mail size={15} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:t.textMuted }}/>
              <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
                placeholder="your@email.com" style={{ ...inp, paddingLeft:42 }}/>
            </div>
            <div style={{ position:"relative" }}>
              <Lock size={15} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:t.textMuted }}/>
              <input value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
                type={showP?"text":"password"} placeholder="Password" style={{ ...inp, paddingLeft:42, paddingRight:44 }}/>
              <button onClick={()=>setShowP(!showP)} style={{ position:"absolute", right:12, top:"50%",
                transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:t.textMuted, padding:4 }}>
                {showP?<EyeOff size={15}/>:<Eye size={15}/>}
              </button>
            </div>
          </div>
          {err && <div style={{ color:t.danger, fontSize:12, marginBottom:14, padding:"10px 14px",
            background:`${t.danger}12`, borderRadius:10, border:`1px solid ${t.danger}25`, lineHeight:1.6 }}>{err}</div>}
          <button onClick={submit} disabled={loading}
            style={{ width:"100%", background:`linear-gradient(135deg,${t.accent},${t.purple})`,
            border:"none", borderRadius:14, padding:"14px", color:"#fff", fontSize:15, fontWeight:900,
            cursor:loading?"not-allowed":"pointer", opacity:loading?.8:1,
            boxShadow:`0 8px 24px ${t.accentGlow}`, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
            {loading?<><Spinner col="#fff"/> Signing in...</>:<>Sign In <ArrowRight size={16}/></>}
          </button>
          <div style={{ background:`${t.warning}10`, border:`1px solid ${t.warning}28`, borderRadius:12,
            padding:"10px 14px", marginTop:16, display:"flex", gap:8, alignItems:"flex-start" }}>
            <AlertTriangle size={14} color={t.warning} style={{ flexShrink:0, marginTop:1 }}/>
            <p style={{ color:t.textSub, fontSize:11, margin:0, lineHeight:1.7 }}>
              <strong style={{ color:t.text }}>Professional use only.</strong> Your correct name, year & branch are mandatory.
              Fake identity = permanent ban.
            </p>
          </div>
          <p style={{ textAlign:"center", marginTop:18, color:t.textSub, fontSize:13 }}>
            New here?{" "}
            <button onClick={goReg} style={{ background:"none", border:"none", color:t.accent,
              cursor:"pointer", fontWeight:700, fontSize:13, padding:0 }}>Create Account</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//  REGISTER PAGE
// ────────────────────────────────────────────────────────────────
function RegisterPage({ goLogin, dm }) {
  const t = dm?TH.dark:TH.light;
  const [step,setStep] = useState(1);
  const [form,setForm] = useState({ name:"", email:"", pass:"", confirmPass:"", type:"", branch:"", year:"", linkedin:"", bio:"" });
  const [err,setErr] = useState("");
  const [showP,setShowP] = useState(false);
  const [loading,setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const inp = { width:"100%", background:t.surface, border:`1.5px solid ${t.border}`, borderRadius:12,
    padding:"13px 16px", color:t.text, fontSize:14, outline:"none", boxSizing:"border-box" };
  const s1ok = form.name.trim()&&form.email.includes("@")&&form.pass.length>=6&&form.pass===form.confirmPass;
  const s2ok = form.type&&form.branch&&form.year;

  const submit = async () => {
    if(!s2ok){setErr("Please complete all fields.");return;}
    setLoading(true); setErr("");
    try {
      // 🔥 FIREBASE: Create auth user (password is encrypted by Firebase — bcrypt)
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.pass);
      const uid = cred.user.uid;
      const isAdm = form.email.trim().toLowerCase()===ADMIN_EMAIL.toLowerCase();
      // 🔥 FIREBASE: Save profile to Firestore
      await setDoc(doc(db,"users",uid), {
        name: form.name.trim(),
        email: form.email.trim(),
        branch: form.branch,
        year: form.year,
        isAlumni: form.type==="alumni",
        role: isAdm?"admin":"member",   // Admin email gets admin role automatically
        badges: isAdm?["crown","shield"]:[],
        customTags: isAdm?["Founder","Owner"]:[],
        linkedin: form.linkedin.trim(),
        bio: form.bio.trim()||"👋 New GCOEA community member!",
        isOnline: true,
        isBanned: false,
        lastEditYear: null,
        posts: 0,
        joinDate: new Date().toLocaleDateString("en-IN",{month:"short",year:"numeric"}),
        createdAt: serverTimestamp(),
      });
      // Seed default categories on first registration (admin)
      if(isAdm){
        const catSnap = await getDocs(collection(db,"categories"));
        if(catSnap.empty){
          await Promise.all(DEFAULT_CATS.map(name => addDoc(collection(db,"categories"),{name,createdAt:serverTimestamp()})));
        }
      }
    } catch(e) {
      const msgs = {
        "auth/email-already-in-use":"An account with this email already exists.",
        "auth/invalid-email":"Invalid email address.",
        "auth/weak-password":"Password must be at least 6 characters.",
      };
      setErr(msgs[e.code]||e.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:t.bg, display:"flex", alignItems:"center",
      justifyContent:"center", padding:20, position:"relative" }}>
      <style>{GS+`input:focus,select:focus{border-color:${t.accent}!important;outline:none!important;}`}</style>
      <Orbs dm={dm}/>
      <div style={{ width:"100%", maxWidth:460, position:"relative", zIndex:1, animation:"fadeIn .4s ease" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}><GCOEALogo sz={62}/></div>
          <h1 style={{ fontSize:24, fontWeight:900, color:t.text, letterSpacing:-1 }}>Join GCOEA Connect</h1>
          <p style={{ color:t.textSub, fontSize:13 }}>Use your real identity — it's mandatory</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
          {[1,2].map(s=>(
            <div key={s} style={{ display:"flex", alignItems:"center", gap:8, flex:1 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0,
                background:step>=s?`linear-gradient(135deg,${t.accent},${t.purple})`:t.surface,
                border:`2px solid ${step>=s?t.accent:t.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12, fontWeight:900, color:step>=s?"#fff":t.textMuted }}>{s}</div>
              {s<2&&<div style={{ flex:1, height:2, background:step>s?t.accent:t.border, borderRadius:2 }}/>}
              <span style={{ color:t.textSub, fontSize:11, fontWeight:600 }}>{s===1?"Account":"Profile"}</span>
            </div>
          ))}
        </div>
        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:22, padding:28,
          boxShadow:dm?"0 24px 64px rgba(0,0,0,.4)":"0 24px 64px rgba(0,0,0,.08)" }}>
          {step===1?(
            <>
              <h3 style={{ color:t.text, fontWeight:900, fontSize:17, marginBottom:18 }}>Account Details</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Full Name (as per college records)" style={inp}/>
                <input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="Email (college or personal Gmail)" style={inp}/>
                <div style={{ position:"relative" }}>
                  <input value={form.pass} onChange={e=>set("pass",e.target.value)}
                    type={showP?"text":"password"} placeholder="Password (min 6 characters)" style={{ ...inp, paddingRight:44 }}/>
                  <button onClick={()=>setShowP(!showP)} style={{ position:"absolute", right:12, top:"50%",
                    transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:t.textMuted, padding:4 }}>
                    {showP?<EyeOff size={15}/>:<Eye size={15}/>}
                  </button>
                </div>
                <input value={form.confirmPass} onChange={e=>set("confirmPass",e.target.value)}
                  type="password" placeholder="Confirm Password" style={inp}/>
              </div>
              {form.confirmPass&&form.pass!==form.confirmPass&&
                <p style={{ color:t.danger, fontSize:12, marginTop:8 }}>Passwords don't match</p>}
              {err&&<p style={{ color:t.danger, fontSize:12, marginTop:8 }}>{err}</p>}
              <button onClick={()=>{if(!s1ok){setErr("Fill all fields correctly.");return;}setErr("");setStep(2);}}
                style={{ width:"100%", marginTop:18, background:`linear-gradient(135deg,${t.accent},${t.purple})`,
                border:"none", borderRadius:12, padding:"13px", color:"#fff", fontSize:14, fontWeight:900,
                cursor:"pointer", opacity:s1ok?1:.5, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                Next <ArrowRight size={16}/>
              </button>
            </>
          ):(
            <>
              <h3 style={{ color:t.text, fontWeight:900, fontSize:17, marginBottom:18 }}>Your Profile</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div>
                  <label style={{ display:"block", color:t.textSub, fontSize:11, fontWeight:700, marginBottom:6, letterSpacing:.5 }}>I AM A</label>
                  <div style={{ display:"flex", gap:8 }}>
                    {["student","alumni"].map(ty=>(
                      <button key={ty} onClick={()=>{set("type",ty);set("year","");}}
                        style={{ flex:1, padding:"11px", borderRadius:12, border:`2px solid ${form.type===ty?t.accent:t.border}`,
                        background:form.type===ty?`${t.accent}18`:t.surface, color:form.type===ty?t.accent:t.textSub,
                        fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                        {ty==="student"?<BookOpen size={13}/>:<GraduationCap size={13}/>}
                        {ty==="student"?"Current Student":"Alumni"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display:"block", color:t.textSub, fontSize:11, fontWeight:700, marginBottom:6, letterSpacing:.5 }}>BRANCH</label>
                  <select value={form.branch} onChange={e=>set("branch",e.target.value)}
                    style={{ ...inp, appearance:"none", cursor:"pointer" }}>
                    <option value="">Select your branch</option>
                    {BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                {form.type&&(
                  <div>
                    <label style={{ display:"block", color:t.textSub, fontSize:11, fontWeight:700, marginBottom:6, letterSpacing:.5 }}>
                      {form.type==="student"?"CURRENT YEAR":"PASS-OUT YEAR (Alumni from 1968 onwards)"}
                    </label>
                    <select value={form.year} onChange={e=>set("year",e.target.value)}
                      style={{ ...inp, appearance:"none", cursor:"pointer" }}>
                      <option value="">Select year</option>
                      {(form.type==="student"?STUDENT_YEARS:PASS_YEARS).map(y=><option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label style={{ display:"block", color:t.textSub, fontSize:11, fontWeight:700, marginBottom:6, letterSpacing:.5 }}>LINKEDIN PROFILE URL (optional)</label>
                  <div style={{ position:"relative" }}>
                    <Link size={14} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:t.textMuted }}/>
                    <input value={form.linkedin} onChange={e=>set("linkedin",e.target.value)}
                      placeholder="https://linkedin.com/in/yourname" style={{ ...inp, paddingLeft:38 }}/>
                  </div>
                </div>
                <div>
                  <label style={{ display:"block", color:t.textSub, fontSize:11, fontWeight:700, marginBottom:6, letterSpacing:.5 }}>SHORT BIO (optional)</label>
                  <textarea value={form.bio} onChange={e=>set("bio",e.target.value)}
                    placeholder="Tell the GCOEA community about yourself..." rows={2}
                    style={{ ...inp, resize:"none", lineHeight:1.6 }}/>
                </div>
              </div>
              {err&&<p style={{ color:t.danger, fontSize:12, marginTop:8 }}>{err}</p>}
              <div style={{ display:"flex", gap:10, marginTop:18 }}>
                <button onClick={()=>setStep(1)} style={{ flex:.35, padding:"13px", background:t.surface,
                  border:`1.5px solid ${t.border}`, borderRadius:12, color:t.textSub, cursor:"pointer", fontWeight:700, fontSize:14 }}>Back</button>
                <button onClick={submit} disabled={!s2ok||loading}
                  style={{ flex:1, background:`linear-gradient(135deg,${t.accent},${t.purple})`,
                  border:"none", borderRadius:12, padding:"13px", color:"#fff", fontSize:14, fontWeight:900,
                  cursor:s2ok&&!loading?"pointer":"not-allowed", opacity:s2ok&&!loading?1:.55,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                  {loading?<><Spinner col="#fff"/> Creating...</>:<>🚀 Join Community!</>}
                </button>
              </div>
            </>
          )}
          <p style={{ textAlign:"center", marginTop:16, color:t.textSub, fontSize:13 }}>
            Already have an account?{" "}
            <button onClick={goLogin} style={{ background:"none", border:"none", color:t.accent,
              cursor:"pointer", fontWeight:700, fontSize:13, padding:0 }}>Sign In</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//  POST CARD
// ────────────────────────────────────────────────────────────────
function PostCard({ post, me, onPin, t, dm }) {
  const [expand,setExpand] = useState(false);
  const [liked,setLiked] = useState((post.likedBy||[]).includes(me.id));
  const [likes,setLikes] = useState(post.likes||0);
  const [ctxt,setCtxt] = useState("");
  const [comments,setComments] = useState([]);
  const [cLoading,setCLoading] = useState(false);

  // Real-time comments listener
  useEffect(()=>{
    if(!expand) return;
    const q = query(collection(db,"posts",post.id,"comments"),orderBy("createdAt","asc"));
    return onSnapshot(q,(snap)=>{
      setComments(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
  },[expand,post.id]);

  const canMod = me.role==="admin"||me.role==="moderator";
  const canDel = canMod||(me.id===post.authorId&&canDeleteOwn(post.createdAt));
  const lbl = post.authorYear==="Admin"?{txt:"Admin",col:"#f5b83d"}:
    post.authorRole==="moderator"?{txt:"Moderator",col:"#b47fff"}:
    post.isAlumni?{txt:`Alumni '${post.authorYear}`,col:"#b47fff"}:{txt:post.authorYear,col:"#00c49a"};

  const handleLike = async () => {
    if(me.isBanned) return;
    const ref = doc(db,"posts",post.id);
    if(liked){
      await updateDoc(ref,{ likes:increment(-1), likedBy:arrayRemove(me.id) });
      setLiked(false); setLikes(n=>n-1);
    } else {
      await updateDoc(ref,{ likes:increment(1), likedBy:arrayUnion(me.id) });
      setLiked(true); setLikes(n=>n+1);
    }
  };

  const addComment = async () => {
    if(!ctxt.trim()||me.isBanned) return;
    setCLoading(true);
    await addDoc(collection(db,"posts",post.id,"comments"),{
      authorId:me.id, authorName:me.name, authorYear:me.year,
      isAlumni:me.isAlumni, authorRole:me.role, authorBadges:me.badges||[],
      content:ctxt.trim(), createdAt:serverTimestamp(),
    });
    setCtxt(""); setCLoading(false);
  };

  const delPost = async () => {
    if(!window.confirm("Delete this post? This cannot be undone.")) return;
    await deleteDoc(doc(db,"posts",post.id));
  };

  const delComment = async (cid) => {
    await deleteDoc(doc(db,"posts",post.id,"comments",cid));
  };

  return (
    <div style={{ background:t.card, border:`1px solid ${post.pinned?t.accent+"55":t.border}`,
      borderRadius:18, padding:"20px 22px", marginBottom:16,
      boxShadow:post.pinned?`0 0 0 1px ${t.accent}25,0 4px 24px rgba(0,0,0,.25)`:`0 2px 12px rgba(0,0,0,.12)` }}>
      {post.pinned&&<div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10,
        color:t.accent, fontSize:11, fontWeight:800, letterSpacing:.5 }}>
        <Bookmark size={11} fill={t.accent}/> PINNED ANNOUNCEMENT
      </div>}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, minWidth:0 }}>
          <Av name={post.authorName} sz={46}/>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:5 }}>
              <span style={{ fontWeight:800, color:t.text, fontSize:15 }}>{post.authorName}</span>
              <BadgesRow badges={post.authorBadges||[]}/>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
              <Chip txt={lbl.txt} col={lbl.col}/>
              <span style={{ color:t.textMuted, fontSize:12 }}>{post.authorBranch}</span>
              <span style={{ color:t.textMuted, fontSize:12 }}>· {fmtTime(post.createdAt)}</span>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <Chip txt={`#${post.category}`} col={t.accent}/>
          {canMod&&<button onClick={()=>onPin(post.id,post.pinned)} title={post.pinned?"Unpin":"Pin"}
            style={{ background:"none", border:"none", cursor:"pointer", color:post.pinned?t.accent:t.textMuted, padding:4, borderRadius:8, display:"flex" }}>
            <Bookmark size={14} fill={post.pinned?t.accent:"none"}/>
          </button>}
          {canDel&&<button onClick={delPost}
            style={{ background:"none", border:"none", cursor:"pointer", color:t.textMuted, padding:4, borderRadius:8, display:"flex" }}>
            <Trash2 size={14}/>
          </button>}
        </div>
      </div>
      <p style={{ color:t.text, fontSize:14, lineHeight:1.85, margin:"0 0 16px", whiteSpace:"pre-wrap" }}>{post.content}</p>
      <div style={{ display:"flex", alignItems:"center", gap:12, paddingTop:14, borderTop:`1px solid ${t.border}` }}>
        <button onClick={handleLike} disabled={me.isBanned}
          style={{ display:"flex", alignItems:"center", gap:7, background:liked?`${t.accent}18`:"none",
          border:`1.5px solid ${liked?t.accent:t.border}`, borderRadius:100, padding:"7px 16px",
          cursor:me.isBanned?"not-allowed":"pointer", color:liked?t.accent:t.textSub, fontSize:13, fontWeight:700, transition:"all .2s" }}>
          <Heart size={14} fill={liked?t.accent:"none"}/> {likes}
        </button>
        <button onClick={()=>setExpand(e=>!e)}
          style={{ display:"flex", alignItems:"center", gap:7, background:"none",
          border:`1.5px solid ${t.border}`, borderRadius:100, padding:"7px 16px",
          cursor:"pointer", color:t.textSub, fontSize:13, fontWeight:700 }}>
          <MessageSquare size={14}/> {expand?"Hide":"Comments"}
        </button>
      </div>
      {expand&&(
        <div style={{ marginTop:16 }}>
          {comments.map(c=>{
            const cl = c.authorRole==="admin"?{txt:"Admin",col:"#f5b83d"}:
              c.authorRole==="moderator"?{txt:"Moderator",col:"#b47fff"}:
              c.isAlumni?{txt:`Alumni '${c.authorYear}`,col:"#b47fff"}:{txt:c.authorYear,col:"#00c49a"};
            const canDelC = canMod||(me.id===c.authorId&&canDeleteOwn(c.createdAt));
            return (
              <div key={c.id} style={{ display:"flex", gap:10, marginBottom:12, alignItems:"flex-start" }}>
                <Av name={c.authorName} sz={32}/>
                <div style={{ flex:1, background:dm?"#0c1127":"#f0f4ff", borderRadius:14, padding:"10px 14px", position:"relative" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4, flexWrap:"wrap" }}>
                    <span style={{ fontWeight:800, color:t.text, fontSize:13 }}>{c.authorName}</span>
                    <BadgesRow badges={c.authorBadges||[]}/>
                    <Chip txt={cl.txt} col={cl.col}/>
                    <span style={{ color:t.textMuted, fontSize:11 }}>{fmtTime(c.createdAt)}</span>
                  </div>
                  <p style={{ color:t.text, fontSize:13, margin:0, lineHeight:1.65 }}>{c.content}</p>
                  {canDelC&&<button onClick={()=>delComment(c.id)}
                    style={{ position:"absolute", top:8, right:8, background:"none", border:"none",
                    cursor:"pointer", color:t.textMuted, padding:2, borderRadius:6, display:"flex" }}>
                    <Trash2 size={11}/>
                  </button>}
                </div>
              </div>
            );
          })}
          {!me.isBanned?(
            <div style={{ display:"flex", gap:10, alignItems:"center", marginTop:8 }}>
              <Av name={me.name} sz={32}/>
              <div style={{ flex:1, display:"flex", gap:8 }}>
                <input value={ctxt} onChange={e=>setCtxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addComment()}
                  placeholder="Write a comment..." style={{ flex:1, background:dm?"#0c1127":"#f0f4ff",
                  border:`1.5px solid ${t.border}`, borderRadius:100, padding:"9px 18px",
                  color:t.text, fontSize:13, outline:"none" }}/>
                <button onClick={addComment} disabled={cLoading||!ctxt.trim()}
                  style={{ background:`linear-gradient(135deg,${t.accent},${t.purple})`,
                  border:"none", borderRadius:100, padding:"9px 18px", color:"#fff",
                  cursor:"pointer", display:"flex", alignItems:"center" }}>
                  {cLoading?<Spinner col="#fff"/>:<Send size={13}/>}
                </button>
              </div>
            </div>
          ):(
            <p style={{ color:t.danger, fontSize:12, padding:"8px 14px",
              background:`${t.danger}10`, borderRadius:10, marginTop:8 }}>
              ⛔ Account blocked — cannot post comments.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//  NEW POST MODAL
// ────────────────────────────────────────────────────────────────
function NewPostModal({ me, onClose, categories, t }) {
  const [content,setContent] = useState("");
  const [cat,setCat] = useState(categories[0]?.name||"General");
  const [loading,setLoading] = useState(false);
  const lbl = userLabel(me);

  const submit = async () => {
    if(!content.trim()||loading) return;
    setLoading(true);
    await addDoc(collection(db,"posts"),{
      authorId:me.id, authorName:me.name, authorBranch:me.branch,
      authorYear:me.year, isAlumni:me.isAlumni, authorRole:me.role,
      authorBadges:me.badges||[], content:content.trim(), category:cat,
      likes:0, likedBy:[], pinned:false, createdAt:serverTimestamp(),
    });
    // Update user post count
    await updateDoc(doc(db,"users",me.id),{ posts:increment(1) });
    setLoading(false); onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(8px)" }}>
      <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:22, padding:28,
        width:"100%", maxWidth:560, boxShadow:"0 30px 80px rgba(0,0,0,.5)", animation:"fadeIn .25s ease" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
          <h3 style={{ color:t.text, fontSize:18, fontWeight:900, margin:0 }}>Create a Post</h3>
          <button onClick={onClose} style={{ background:t.surface, border:`1px solid ${t.border}`,
            borderRadius:10, padding:6, cursor:"pointer", color:t.textSub, display:"flex" }}><X size={18}/></button>
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16 }}>
          <Av name={me.name} sz={42}/>
          <div>
            <div style={{ fontWeight:800, color:t.text, fontSize:14, display:"flex", alignItems:"center", gap:8 }}>
              {me.name} <BadgesRow badges={me.badges||[]}/>
            </div>
            <div style={{ marginTop:3 }}><Chip txt={lbl.txt} col={lbl.col}/></div>
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", color:t.textSub, fontSize:11, fontWeight:700, marginBottom:8, letterSpacing:.5 }}>CATEGORY</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
            {categories.map(c=>(
              <button key={c.id} onClick={()=>setCat(c.name)}
                style={{ padding:"6px 14px", borderRadius:100, border:`1.5px solid ${cat===c.name?t.accent:t.border}`,
                background:cat===c.name?`${t.accent}18`:"none", color:cat===c.name?t.accent:t.textSub,
                fontSize:12, fontWeight:700, cursor:"pointer", transition:"all .2s" }}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <textarea value={content} onChange={e=>setContent(e.target.value)}
          placeholder={`Share with the GCOEA community, ${me.name.split(" ")[0]}... 💬`} rows={5}
          style={{ width:"100%", background:t.surface, border:`1.5px solid ${t.border}`, borderRadius:14,
          padding:"14px 16px", color:t.text, fontSize:14, outline:"none", resize:"none",
          lineHeight:1.8, boxSizing:"border-box" }}/>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:16 }}>
          <button onClick={onClose} style={{ padding:"11px 22px", background:t.surface,
            border:`1.5px solid ${t.border}`, borderRadius:12, color:t.textSub, cursor:"pointer", fontWeight:700, fontSize:14 }}>Cancel</button>
          <button onClick={submit} disabled={!content.trim()||loading}
            style={{ padding:"11px 22px", background:`linear-gradient(135deg,${t.accent},${t.purple})`,
            border:"none", borderRadius:12, color:"#fff", cursor:"pointer",
            fontWeight:900, fontSize:14, opacity:content.trim()&&!loading?1:.5,
            display:"flex", alignItems:"center", gap:8 }}>
            {loading?<><Spinner col="#fff"/> Posting...</>:<><Send size={14}/> Post</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//  FORUM PAGE
// ────────────────────────────────────────────────────────────────
function ForumPage({ me, posts, users, categories, announcement, t, dm }) {
  const [activeCat,setActiveCat] = useState("All");
  const [search,setSearch] = useState("");
  const [showNew,setShowNew] = useState(false);

  const filtered = [...posts]
    .sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0))
    .filter(p=>(activeCat==="All"||p.category===activeCat)&&
      (!search||p.content?.toLowerCase().includes(search.toLowerCase())||p.authorName?.toLowerCase().includes(search.toLowerCase())));

  const online = users.filter(u=>u.isOnline&&u.id!==me.id&&!u.isBanned);

  const pinPost = async (pid,pinned) => {
    await updateDoc(doc(db,"posts",pid),{ pinned:!pinned });
  };

  return (
    <div style={{ display:"flex", gap:20 }}>
      <div style={{ flex:1, minWidth:0 }}>
        {announcement&&<div style={{ background:`${t.accent}12`, border:`1px solid ${t.accent}33`,
          borderRadius:14, padding:"12px 18px", marginBottom:18, display:"flex", gap:10, alignItems:"center" }}>
          <Bell size={16} color={t.accent}/><p style={{ color:t.text, fontSize:13, margin:0 }}>{announcement}</p>
        </div>}
        {me.isBanned&&<div style={{ background:`${t.danger}12`, border:`1px solid ${t.danger}30`,
          borderRadius:14, padding:"12px 18px", marginBottom:18, display:"flex", gap:10, alignItems:"center" }}>
          <AlertTriangle size={16} color={t.danger}/>
          <p style={{ color:t.danger, fontSize:13, margin:0, fontWeight:700 }}>
            ⛔ Your account is permanently blocked. You can read posts but cannot interact.
          </p>
        </div>}
        <div style={{ display:"flex", gap:12, marginBottom:18 }}>
          <div style={{ flex:1, position:"relative" }}>
            <Search size={15} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:t.textMuted }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search posts..."
              style={{ width:"100%", background:t.card, border:`1.5px solid ${t.border}`, borderRadius:14,
              padding:"12px 16px 12px 42px", color:t.text, fontSize:14, outline:"none", boxSizing:"border-box" }}/>
          </div>
          {!me.isBanned&&<button onClick={()=>setShowNew(true)}
            style={{ background:`linear-gradient(135deg,${t.accent},${t.purple})`, border:"none",
            borderRadius:14, padding:"12px 20px", color:"#fff", cursor:"pointer",
            display:"flex", alignItems:"center", gap:8, fontWeight:800, fontSize:14,
            whiteSpace:"nowrap", boxShadow:`0 4px 16px ${t.accentGlow}` }}>
            <Plus size={16}/> New Post
          </button>}
        </div>
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:18, scrollbarWidth:"none" }}>
          {["All",...categories.map(c=>c.name)].map(c=>(
            <button key={c} onClick={()=>setActiveCat(c)}
              style={{ padding:"8px 16px", borderRadius:100, border:`1.5px solid ${activeCat===c?t.accent:t.border}`,
              background:activeCat===c?`linear-gradient(135deg,${t.accent},${t.purple})`:t.card,
              color:activeCat===c?"#fff":t.textSub, fontSize:12, fontWeight:700, cursor:"pointer",
              whiteSpace:"nowrap", flexShrink:0, transition:"all .2s",
              boxShadow:activeCat===c?`0 4px 12px ${t.accentGlow}`:"none" }}>
              {c}
            </button>
          ))}
        </div>
        {filtered.length===0?<div style={{ textAlign:"center", padding:"60px 20px", color:t.textMuted }}>
          <MessageSquare size={48} style={{ opacity:.2, marginBottom:12 }}/>
          <p>No posts yet. Be the first to share!</p>
        </div>:filtered.map(p=><PostCard key={p.id} post={p} me={me} onPin={pinPost} t={t} dm={dm}/>)}
      </div>
      <div className="frm-sidebar" style={{ width:240, flexShrink:0 }}>
        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:18, padding:18, marginBottom:14 }}>
          <h4 style={{ color:t.text, fontSize:13, fontWeight:800, margin:"0 0 14px", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:t.success, display:"inline-block" }}/> Live Now ({online.length})
          </h4>
          {online.slice(0,6).map(u=>{
            const l=userLabel(u);
            return <div key={u.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <Av name={u.name} sz={32} online={true}/>
              <div>
                <div style={{ fontWeight:700, color:t.text, fontSize:12 }}>{u.name.split(" ")[0]}</div>
                <Chip txt={l.txt} col={l.col}/>
              </div>
            </div>;
          })}
          {online.length===0&&<p style={{ color:t.textMuted, fontSize:12 }}>No one else online right now.</p>}
        </div>
        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:18, padding:18 }}>
          <h4 style={{ color:t.text, fontSize:13, fontWeight:800, margin:"0 0 12px" }}>Community Stats</h4>
          {[{l:"Members",v:users.filter(u=>!u.isBanned).length,c:t.accent},
            {l:"Posts",v:posts.length,c:t.teal},{l:"Alumni",v:users.filter(u=>u.isAlumni).length,c:t.purple},
            {l:"Online",v:online.length,c:t.success}].map(s=>(
            <div key={s.l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${t.border}` }}>
              <span style={{ color:t.textSub, fontSize:12 }}>{s.l}</span>
              <span style={{ fontWeight:800, color:s.c, fontSize:14 }}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>
      {showNew&&<NewPostModal me={me} onClose={()=>setShowNew(false)} categories={categories} t={t}/>}
      <style>{`@media(max-width:860px){.frm-sidebar{display:none!important}}`}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//  CHAT PAGE
// ────────────────────────────────────────────────────────────────
function ChatPage({ me, users, t, dm }) {
  const [sel,setSel] = useState(null);
  const [msgs,setMsgs] = useState([]);
  const [inp,setInp] = useState("");
  const [srch,setSrch] = useState("");
  const [showList,setShowList] = useState(true);
  const [sending,setSending] = useState(false);
  const bottomRef = useRef(null);

  const chatUsers = users.filter(u=>u.id!==me.id&&!u.isBanned);
  const filtered = chatUsers.filter(u=>u.name.toLowerCase().includes(srch.toLowerCase())||u.branch.toLowerCase().includes(srch.toLowerCase()));
  const key = sel?chatKey(me.id,sel.id):null;

  // Real-time chat listener
  useEffect(()=>{
    if(!key) return;
    setMsgs([]);
    const q = query(collection(db,"messages",key,"msgs"),orderBy("createdAt","asc"));
    return onSnapshot(q,(snap)=>{
      setMsgs(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
  },[key]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs.length]);

  const send = async () => {
    if(!inp.trim()||!key||me.isBanned||sending) return;
    setSending(true);
    await addDoc(collection(db,"messages",key,"msgs"),{
      from:me.id, text:inp.trim(), createdAt:serverTimestamp(),
    });
    setInp(""); setSending(false);
  };

  const delMsg = async (msgId,ts) => {
    if(!canDeleteOwn(ts)&&me.role!=="admin"){alert("Messages can only be deleted within 1 hour of sending.");return;}
    if(!window.confirm("Delete this message?")) return;
    await deleteDoc(doc(db,"messages",key,"msgs",msgId));
  };

  const lbl = sel?userLabel(sel):null;

  return (
    <div style={{ display:"flex", height:"calc(100vh - 130px)", background:t.card, borderRadius:20,
      border:`1px solid ${t.border}`, overflow:"hidden", boxShadow:`0 4px 24px rgba(0,0,0,${dm?.3:.08})` }}>
      <div className="chat-list" style={{ width:280, borderRight:`1px solid ${t.border}`,
        display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"18px 14px 10px", borderBottom:`1px solid ${t.border}` }}>
          <h3 style={{ color:t.text, fontSize:16, fontWeight:800, marginBottom:10 }}>Messages</h3>
          <div style={{ position:"relative" }}>
            <Search size={13} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:t.textMuted }}/>
            <input value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search people..."
              style={{ width:"100%", background:t.surface, border:`1px solid ${t.border}`, borderRadius:12,
              padding:"8px 12px 8px 32px", color:t.text, fontSize:12, outline:"none", boxSizing:"border-box" }}/>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"6px" }}>
          {filtered.map(u=>{
            const ul=userLabel(u);
            return <div key={u.id} onClick={()=>{setSel(u);setShowList(false);}}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 10px", borderRadius:14,
              cursor:"pointer", background:sel?.id===u.id?`${t.accent}15`:"transparent", marginBottom:2, transition:"background .2s" }}>
              <Av name={u.name} sz={42} online={u.isOnline}/>
              <div style={{ flex:1, minWidth:0 }}>
                <span style={{ fontWeight:700, color:t.text, fontSize:13, display:"block",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.name}</span>
                <div style={{ display:"flex", gap:5, marginTop:2, alignItems:"center" }}>
                  <Chip txt={ul.txt} col={ul.col}/>
                  <span style={{ fontSize:10, color:u.isOnline?t.success:t.textMuted }}>
                    {u.isOnline?"●":"○"}
                  </span>
                </div>
              </div>
            </div>;
          })}
        </div>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        {sel?(
          <>
            <div style={{ padding:"14px 20px", borderBottom:`1px solid ${t.border}`,
              display:"flex", alignItems:"center", gap:12 }}>
              <button onClick={()=>setShowList(true)} className="back-btn"
                style={{ background:"none", border:"none", cursor:"pointer", color:t.textSub,
                padding:4, borderRadius:8, display:"none", fontSize:20 }}>←</button>
              <Av name={sel.name} sz={40} online={sel.isOnline}/>
              <div>
                <div style={{ fontWeight:800, color:t.text, fontSize:15, display:"flex", alignItems:"center", gap:8 }}>
                  {sel.name} <BadgesRow badges={sel.badges||[]}/>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:3 }}>
                  <Chip txt={lbl.txt} col={lbl.col}/>
                  <span style={{ fontSize:12, color:sel.isOnline?t.success:t.textMuted }}>
                    {sel.isOnline?"● Online":"○ Offline"}
                  </span>
                </div>
              </div>
              {sel.linkedin&&<a href={sel.linkedin} target="_blank" rel="noreferrer"
                style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6, color:"#0a66c2",
                background:"#0a66c215", border:"1px solid #0a66c230", borderRadius:10,
                padding:"7px 14px", textDecoration:"none", fontSize:12, fontWeight:700 }}>
                <ExternalLink size={13}/> LinkedIn
              </a>}
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:20, display:"flex", flexDirection:"column", gap:10 }}>
              {msgs.length===0&&<div style={{ textAlign:"center", color:t.textMuted, margin:"auto", padding:40 }}>
                <MessageCircle size={40} style={{ opacity:.2, marginBottom:12 }}/>
                <p>Say hello to {sel.name.split(" ")[0]}!</p>
              </div>}
              {msgs.map(m=>{
                const isMe = m.from===me.id;
                const ts = m.createdAt?.toMillis?.()??0;
                const tstr = ts?new Date(ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"";
                const canDel = isMe&&(canDeleteOwn(m.createdAt)||me.role==="admin");
                return (
                  <div key={m.id} style={{ display:"flex", justifyContent:isMe?"flex-end":"flex-start",
                    gap:8, alignItems:"flex-end" }}>
                    {!isMe&&<Av name={sel.name} sz={26}/>}
                    <div style={{ maxWidth:"72%" }}>
                      <div style={{ background:isMe?`linear-gradient(135deg,${t.accent},${t.purple})`:(dm?"#0c1127":"#f0f4ff"),
                        borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px",
                        padding:"10px 15px", color:isMe?"#fff":t.text, fontSize:13, lineHeight:1.65,
                        boxShadow:isMe?`0 4px 16px ${t.accentGlow}`:"none" }}>
                        {m.text}
                      </div>
                      <div style={{ fontSize:10, color:t.textMuted, marginTop:3,
                        textAlign:isMe?"right":"left", display:"flex", gap:8,
                        justifyContent:isMe?"flex-end":"flex-start", alignItems:"center" }}>
                        {tstr}
                        {canDel&&<button onClick={()=>delMsg(m.id,m.createdAt)}
                          style={{ background:"none", border:"none", cursor:"pointer",
                          color:t.textMuted, padding:0, fontSize:10, textDecoration:"underline" }}>del</button>}
                      </div>
                    </div>
                    {isMe&&<Av name={me.name} sz={26}/>}
                  </div>
                );
              })}
              <div ref={bottomRef}/>
            </div>
            {me.isBanned?(
              <div style={{ padding:16, borderTop:`1px solid ${t.border}`,
                background:`${t.danger}08`, color:t.danger, fontSize:13, fontWeight:700, textAlign:"center" }}>
                ⛔ Blocked — cannot send messages
              </div>
            ):(
              <div style={{ padding:"14px 20px", borderTop:`1px solid ${t.border}`, display:"flex", gap:10, alignItems:"center" }}>
                <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
                  placeholder={`Message ${sel.name.split(" ")[0]}...`}
                  style={{ flex:1, background:t.surface, border:`1.5px solid ${t.border}`, borderRadius:14,
                  padding:"12px 18px", color:t.text, fontSize:13, outline:"none" }}/>
                <button onClick={send} disabled={sending||!inp.trim()}
                  style={{ background:`linear-gradient(135deg,${t.accent},${t.purple})`,
                  border:"none", borderRadius:14, padding:"12px 18px", color:"#fff",
                  cursor:"pointer", display:"flex", alignItems:"center",
                  boxShadow:`0 4px 16px ${t.accentGlow}`, opacity:inp.trim()?1:.6 }}>
                  {sending?<Spinner col="#fff"/>:<Send size={16}/>}
                </button>
              </div>
            )}
          </>
        ):(
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
            flexDirection:"column", color:t.textMuted, gap:10 }}>
            <MessageCircle size={52} style={{ opacity:.18 }}/>
            <p style={{ fontSize:15, fontWeight:600 }}>Select a conversation</p>
            <p style={{ fontSize:13 }}>Connect with fellow GCOEA members</p>
          </div>
        )}
      </div>
      <style>{`@media(max-width:640px){.chat-list{position:absolute!important;z-index:10!important;height:100%;width:100%!important;background:${t.card};}.back-btn{display:flex!important;}}`}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//  MEMBERS PAGE
// ────────────────────────────────────────────────────────────────
function MembersPage({ me, users, onMessage, t }) {
  const [filter,setFilter] = useState("all");
  const [srch,setSrch] = useState("");

  const visible = users.filter(u=>{
    if(u.isBanned&&me.role!=="admin"&&me.role!=="moderator") return false;
    const mF = filter==="all"||(filter==="students"&&!u.isAlumni&&!u.isAdmin)
      ||(filter==="alumni"&&u.isAlumni)||(filter==="online"&&u.isOnline)
      ||(filter==="moderators"&&u.role==="moderator");
    const mS = !srch||u.name.toLowerCase().includes(srch.toLowerCase())||u.branch.toLowerCase().includes(srch.toLowerCase());
    return mF&&mS;
  });

  return (
    <div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18, alignItems:"center" }}>
        <div style={{ position:"relative", flex:1, minWidth:180 }}>
          <Search size={14} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:t.textMuted }}/>
          <input value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search by name or branch..."
            style={{ width:"100%", background:t.card, border:`1.5px solid ${t.border}`, borderRadius:14,
            padding:"11px 16px 11px 40px", color:t.text, fontSize:13, outline:"none", boxSizing:"border-box" }}/>
        </div>
        <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
          {["all","students","alumni","online","moderators"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              style={{ padding:"9px 14px", borderRadius:100, border:`1.5px solid ${filter===f?t.accent:t.border}`,
              background:filter===f?`${t.accent}18`:t.card, color:filter===f?t.accent:t.textSub,
              fontSize:12, fontWeight:700, cursor:"pointer", textTransform:"capitalize", transition:"all .2s" }}>
              {f==="online"?"🟢 Live":f==="moderators"?"⚖️ Mods":f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(238px,1fr))", gap:14 }}>
        {visible.map(u=>{
          const lbl=userLabel(u);
          return (
            <div key={u.id} style={{ background:t.card,
              border:`1px solid ${u.isBanned?t.danger+"33":u.id===me.id?t.accent+"44":t.border}`,
              borderRadius:18, padding:20, opacity:u.isBanned?.65:1, transition:"all .2s" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:14 }}>
                <Av name={u.name} sz={52} online={u.isOnline}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:800, color:t.text, fontSize:14, marginBottom:5,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {u.name} {u.id===me.id&&<span style={{ color:t.textMuted, fontSize:12 }}>(You)</span>}
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:4 }}>
                    <Chip txt={lbl.txt} col={lbl.col}/>
                    {u.role==="admin"&&<Chip txt="Admin" col={t.gold} emoji="🛡️"/>}
                    {u.role==="moderator"&&<Chip txt="Mod" col={t.purple} emoji="⚖️"/>}
                    {u.isBanned&&<Chip txt="BANNED" col={t.danger}/>}
                  </div>
                  <div style={{ display:"flex", gap:4 }}><BadgesRow badges={u.badges||[]}/></div>
                  {u.customTags?.length>0&&<div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:5 }}>
                    {u.customTags.map(tg=><Chip key={tg} txt={tg} col={t.teal}/>)}
                  </div>}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:u.isOnline?"#1fcb6c":"#3d5070" }}/>
                <span style={{ color:u.isOnline?t.success:t.textMuted, fontSize:12, fontWeight:600 }}>
                  {u.isOnline?"Online now":"Offline"}
                </span>
              </div>
              <p style={{ color:t.textSub, fontSize:12, margin:"0 0 6px", lineHeight:1.5,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.bio}</p>
              <p style={{ color:t.textMuted, fontSize:12, margin:"0 0 14px" }}>📚 {u.branch}</p>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                paddingTop:12, borderTop:`1px solid ${t.border}`, gap:8, flexWrap:"wrap" }}>
                <span style={{ color:t.textMuted, fontSize:11 }}>📝 {u.posts||0} posts</span>
                <div style={{ display:"flex", gap:7 }}>
                  {u.linkedin&&<a href={u.linkedin} target="_blank" rel="noreferrer"
                    style={{ background:"#0a66c215", border:"1px solid #0a66c230", borderRadius:9,
                    padding:"5px 11px", color:"#0a66c2", textDecoration:"none", fontSize:11, fontWeight:700,
                    display:"flex", alignItems:"center", gap:5 }}>
                    <ExternalLink size={11}/> LinkedIn
                  </a>}
                  {u.id!==me.id&&!u.isBanned&&!me.isBanned&&<button onClick={()=>onMessage(u)}
                    style={{ background:`${t.accent}18`, border:`1px solid ${t.accent}33`, borderRadius:9,
                    padding:"5px 12px", color:t.accent, cursor:"pointer", fontSize:11, fontWeight:700,
                    display:"flex", alignItems:"center", gap:5 }}>
                    <MessageCircle size={11}/> Message
                  </button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//  PROFILE PAGE (with edit)
// ────────────────────────────────────────────────────────────────
function ProfilePage({ user, posts, t, dm }) {
  const [showEdit,setShowEdit] = useState(false);
  const [editForm,setEditForm] = useState({ bio:user.bio||"", linkedin:user.linkedin||"", branch:user.branch, year:user.year, type:user.isAlumni?"alumni":"student" });
  const [saving,setSaving] = useState(false);
  const myPosts = posts.filter(p=>p.authorId===user.id);
  const lbl = userLabel(user);
  const canEdit = canEditProfile(user);

  const saveProfile = async () => {
    if(!canEdit) return;
    setSaving(true);
    const isAlumni = editForm.type==="alumni";
    await updateDoc(doc(db,"users",user.id),{
      bio:editForm.bio.trim(), linkedin:editForm.linkedin.trim(),
      branch:editForm.branch, year:editForm.year,
      isAlumni, lastEditYear:new Date().getFullYear(),
    });
    setSaving(false); setShowEdit(false);
  };

  const inp = { width:"100%", background:t.surface, border:`1.5px solid ${t.border}`, borderRadius:12,
    padding:"12px 16px", color:t.text, fontSize:14, outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ maxWidth:720, margin:"0 auto" }}>
      <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:20,
        overflow:"hidden", marginBottom:20, boxShadow:`0 4px 24px rgba(0,0,0,${dm?.3:.06})` }}>
        <div style={{ height:90, background:`linear-gradient(135deg,${t.accent},${t.purple})`, position:"relative" }}>
          <div style={{ position:"absolute", inset:0, opacity:.12,
            backgroundImage:"repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",
            backgroundSize:"20px 20px" }}/>
        </div>
        <div style={{ padding:"0 28px 24px" }}>
          <div style={{ marginTop:-36, marginBottom:14 }}>
            <div style={{ width:78, height:78, borderRadius:"50%",
              background:`linear-gradient(135deg,${avBg(user.name)},${avBg(user.name)}88)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:26, fontWeight:900, color:"#fff", border:`4px solid ${t.card}` }}>
              {ini(user.name)}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div>
              <h2 style={{ color:t.text, fontSize:22, fontWeight:900, margin:"0 0 8px", display:"flex", alignItems:"center", gap:10 }}>
                {user.name} <BadgesRow badges={user.badges||[]}/>
              </h2>
              <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:8 }}>
                <Chip txt={lbl.txt} col={lbl.col}/>
                {user.role==="admin"&&<Chip txt="Admin" col={t.gold} emoji="🛡️"/>}
                {user.role==="moderator"&&<Chip txt="Moderator" col={t.purple} emoji="⚖️"/>}
                {user.customTags?.map(tg=><Chip key={tg} txt={tg} col={t.teal}/>)}
              </div>
              <p style={{ color:t.textSub, fontSize:13, margin:"0 0 8px", lineHeight:1.65 }}>{user.bio}</p>
              <div style={{ color:t.textMuted, fontSize:12, display:"flex", gap:14, flexWrap:"wrap" }}>
                <span>📚 {user.branch}</span>
                <span>📅 Joined {user.joinDate}</span>
                <span>✉️ {user.email}</span>
              </div>
              {user.linkedin&&<a href={user.linkedin} target="_blank" rel="noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:7, marginTop:10, color:"#0a66c2",
                background:"#0a66c215", border:"1px solid #0a66c230", borderRadius:10,
                padding:"7px 16px", textDecoration:"none", fontSize:13, fontWeight:700 }}>
                <ExternalLink size={14}/> View LinkedIn Profile
              </a>}
            </div>
            <button onClick={()=>setShowEdit(true)} style={{ display:"flex", alignItems:"center", gap:8,
              background:canEdit?`${t.accent}18`:t.surface, border:`1.5px solid ${canEdit?t.accent:t.border}`,
              borderRadius:12, padding:"10px 18px", color:canEdit?t.accent:t.textMuted,
              cursor:"pointer", fontSize:13, fontWeight:700 }}>
              <Edit3 size={14}/> {canEdit?"Edit Profile":"Locked (once/year)"}
            </button>
          </div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
        {[{l:"Posts",v:myPosts.length,col:t.accent},{l:"Total Likes",v:myPosts.reduce((s,p)=>s+(p.likes||0),0),col:t.danger},
          {l:"Comments",v:myPosts.reduce((s,p)=>s+(p.comments||0),0),col:t.teal}].map(s=>(
          <div key={s.l} style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:16, padding:"18px", textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:900, color:s.col }}>{s.v}</div>
            <div style={{ fontSize:12, color:t.textSub, marginTop:4 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <h3 style={{ color:t.text, fontSize:17, fontWeight:800, marginBottom:14 }}>My Posts</h3>
      {myPosts.length===0?<div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:16,
        padding:"40px", textAlign:"center", color:t.textMuted }}>
        <MessageSquare size={36} style={{ opacity:.2, marginBottom:12 }}/>
        <p>No posts yet. Share something with the community!</p>
      </div>:myPosts.slice(0,10).map(p=>(
        <div key={p.id} style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:16,
          padding:"16px 20px", marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <Chip txt={`#${p.category}`} col={t.accent}/>
            <span style={{ color:t.textMuted, fontSize:11 }}>❤️{p.likes||0} · {fmtTime(p.createdAt)}</span>
          </div>
          <p style={{ color:t.text, fontSize:13, lineHeight:1.7, margin:0,
            overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{p.content}</p>
        </div>
      ))}
      {/* Edit Profile Modal */}
      {showEdit&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.65)", zIndex:1000,
          display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(8px)" }}>
          <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:22, padding:28,
            width:"100%", maxWidth:480, animation:"fadeIn .25s ease" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <h3 style={{ color:t.text, fontSize:18, fontWeight:900, margin:0 }}>Edit Profile</h3>
              <button onClick={()=>setShowEdit(false)} style={{ background:t.surface, border:`1px solid ${t.border}`,
                borderRadius:10, padding:6, cursor:"pointer", color:t.textSub, display:"flex" }}><X size={18}/></button>
            </div>
            {!canEdit&&<div style={{ background:`${t.warning}12`, border:`1px solid ${t.warning}30`,
              borderRadius:12, padding:"12px 16px", marginBottom:16 }}>
              <p style={{ color:t.textSub, fontSize:13, margin:0 }}>
                ⚠️ Profile editing is allowed <strong>once per year</strong>. You've already edited this year.
                You can edit again in {new Date().getFullYear()+1}.
              </p>
            </div>}
            <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
              <div>
                <label style={{ display:"block", color:t.textSub, fontSize:11, fontWeight:700, marginBottom:6 }}>BIO</label>
                <textarea value={editForm.bio} onChange={e=>setEditForm(f=>({...f,bio:e.target.value}))} rows={3}
                  style={{ ...inp, resize:"none", lineHeight:1.6 }} disabled={!canEdit}/>
              </div>
              <div>
                <label style={{ display:"block", color:t.textSub, fontSize:11, fontWeight:700, marginBottom:6 }}>LINKEDIN URL</label>
                <input value={editForm.linkedin} onChange={e=>setEditForm(f=>({...f,linkedin:e.target.value}))}
                  placeholder="https://linkedin.com/in/yourname" style={inp} disabled={!canEdit}/>
              </div>
              {canEdit&&<>
                <div>
                  <label style={{ display:"block", color:t.textSub, fontSize:11, fontWeight:700, marginBottom:6 }}>BRANCH</label>
                  <select value={editForm.branch} onChange={e=>setEditForm(f=>({...f,branch:e.target.value}))}
                    style={{ ...inp, appearance:"none", cursor:"pointer" }}>
                    {BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:"block", color:t.textSub, fontSize:11, fontWeight:700, marginBottom:6 }}>
                    {editForm.type==="alumni"?"PASS-OUT YEAR":"CURRENT YEAR"}
                    <span style={{ color:t.textMuted, fontWeight:400, marginLeft:6 }}>(once per year)</span>
                  </label>
                  <select value={editForm.year} onChange={e=>setEditForm(f=>({...f,year:e.target.value}))}
                    style={{ ...inp, appearance:"none", cursor:"pointer" }}>
                    {(editForm.type==="alumni"?PASS_YEARS:STUDENT_YEARS).map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {editForm.type==="student"&&editForm.year==="4th Year"&&<div style={{ background:`${t.teal}12`,
                  border:`1px solid ${t.teal}30`, borderRadius:12, padding:"12px 16px" }}>
                  <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                    <input type="checkbox" checked={editForm.type==="alumni"}
                      onChange={e=>setEditForm(f=>({...f,type:e.target.checked?"alumni":"student"}))}/>
                    <span style={{ color:t.text, fontSize:13 }}>I have completed 4th year → Switch to Alumni</span>
                  </label>
                </div>}
              </>}
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button onClick={()=>setShowEdit(false)} style={{ flex:.4, padding:"12px", background:t.surface,
                border:`1.5px solid ${t.border}`, borderRadius:12, color:t.textSub, cursor:"pointer", fontWeight:700, fontSize:14 }}>Cancel</button>
              {canEdit&&<button onClick={saveProfile} disabled={saving}
                style={{ flex:1, background:`linear-gradient(135deg,${t.accent},${t.purple})`,
                border:"none", borderRadius:12, padding:"12px", color:"#fff",
                cursor:"pointer", fontWeight:900, fontSize:14,
                display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {saving?<><Spinner col="#fff"/> Saving...</>:<><Check size={16}/> Save Changes</>}
              </button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//  ADMIN PANEL — Full Power
// ────────────────────────────────────────────────────────────────
function AdminPanel({ users, posts, categories, me, t, dm }) {
  const [tab,setTab] = useState("overview");
  const [userSrch,setUserSrch] = useState("");
  const [newCat,setNewCat] = useState("");
  const [selUid,setSelUid] = useState(null);
  const [announce,setAnnounce] = useState("");
  const [tagInp,setTagInp] = useState("");
  const [auditLog,setAuditLog] = useState([]);
  const [savedAnnounce,setSavedAnnounce] = useState("");
  const [savingAnn,setSavingAnn] = useState(false);

  useEffect(()=>{
    // Load current announcement
    const unsub = onSnapshot(doc(db,"settings","main"),(snap)=>{
      if(snap.exists()) { setAnnounce(snap.data().announcement||""); setSavedAnnounce(snap.data().announcement||""); }
    });
    // Load audit log
    const q = query(collection(db,"auditLog"),orderBy("createdAt","desc"));
    const unsub2 = onSnapshot(q,(snap)=>{ setAuditLog(snap.docs.map(d=>({id:d.id,...d.data()}))); });
    return ()=>{ unsub(); unsub2(); };
  },[]);

  const addLog = async (action,targetName,detail) => {
    await addDoc(collection(db,"auditLog"),{
      action, adminName:me.name, targetName, detail, createdAt:serverTimestamp()
    });
  };

  const toggleBan = async (uid) => {
    const u=users.find(x=>x.id===uid); if(!u||u.role==="admin") return;
    await updateDoc(doc(db,"users",uid),{ isBanned:!u.isBanned });
    await addLog(u.isBanned?"USER_UNBANNED":"USER_BANNED",u.name,u.isBanned?"Account unbanned":"Permanently banned");
  };

  const setRole = async (uid,role) => {
    const u=users.find(x=>x.id===uid); if(!u||u.role==="admin") return;
    await updateDoc(doc(db,"users",uid),{ role });
    await addLog("ROLE_CHANGED",u.name,`Role changed to: ${role}`);
    setSelUid(null);
  };

  const toggleBadge = async (uid,badge) => {
    const u=users.find(x=>x.id===uid); if(!u) return;
    const has=(u.badges||[]).includes(badge);
    await updateDoc(doc(db,"users",uid),{ badges:has?arrayRemove(badge):arrayUnion(badge) });
    await addLog(has?"BADGE_REMOVED":"BADGE_GIVEN",u.name,`${BADGES[badge]?.e} ${BADGES[badge]?.label}`);
  };

  const addTag = async (uid) => {
    if(!tagInp.trim()) return;
    const u=users.find(x=>x.id===uid); if(!u) return;
    await updateDoc(doc(db,"users",uid),{ customTags:arrayUnion(tagInp.trim()) });
    await addLog("TAG_ADDED",u.name,`Tag: "${tagInp.trim()}"`);
    setTagInp("");
  };

  const removeTag = async (uid,tag) => {
    const u=users.find(x=>x.id===uid);
    await updateDoc(doc(db,"users",uid),{ customTags:arrayRemove(tag) });
    await addLog("TAG_REMOVED",u?.name||uid,`Tag removed: "${tag}"`);
  };

  const pinPost = async (pid,pinned) => {
    await updateDoc(doc(db,"posts",pid),{ pinned:!pinned });
    const p=posts.find(x=>x.id===pid);
    await addLog(pinned?"POST_UNPINNED":"POST_PINNED",p?.authorName||"",`Post in #${p?.category}`);
  };

  const delPost = async (pid) => {
    if(!window.confirm("Permanently delete this post?")) return;
    const p=posts.find(x=>x.id===pid);
    await deleteDoc(doc(db,"posts",pid));
    await addLog("POST_DELETED",p?.authorName||"",`Post in #${p?.category} deleted`);
  };

  const addCategory = async () => {
    if(!newCat.trim()) return;
    await addDoc(collection(db,"categories"),{ name:newCat.trim(), createdAt:serverTimestamp() });
    await addLog("CATEGORY_ADDED","Forum",`Added: "${newCat.trim()}"`);
    setNewCat("");
  };

  const removeCategory = async (catId,name) => {
    if(!window.confirm(`Remove category "${name}"?`)) return;
    await deleteDoc(doc(db,"categories",catId));
    await addLog("CATEGORY_REMOVED","Forum",`Removed: "${name}"`);
  };

  const saveAnnouncement = async () => {
    setSavingAnn(true);
    await setDoc(doc(db,"settings","main"),{ announcement:announce.trim(), updatedAt:serverTimestamp() },{merge:true});
    await addLog("ANNOUNCEMENT_UPDATED","All Members","New announcement set");
    setSavedAnnounce(announce.trim()); setSavingAnn(false);
    alert("✅ Announcement saved and live!");
  };

  const filtU = users.filter(u=>!userSrch||u.name.toLowerCase().includes(userSrch.toLowerCase())||u.email.toLowerCase().includes(userSrch.toLowerCase()));
  const stats = [
    {l:"Total Members",v:users.length,col:t.accent,i:Users},
    {l:"Current Students",v:users.filter(u=>!u.isAlumni&&!u.isAdmin&&!u.isBanned).length,col:t.teal,i:BookOpen},
    {l:"Alumni",v:users.filter(u=>u.isAlumni).length,col:t.purple,i:GraduationCap},
    {l:"Online Now",v:users.filter(u=>u.isOnline).length,col:t.success,i:Activity},
    {l:"Total Posts",v:posts.length,col:t.gold,i:MessageSquare},
    {l:"Banned",v:users.filter(u=>u.isBanned).length,col:t.danger,i:UserX},
    {l:"Moderators",v:users.filter(u=>u.role==="moderator").length,col:t.purple,i:Shield},
    {l:"Categories",v:categories.length,col:t.teal,i:Hash},
  ];
  const TABS = [
    {id:"overview",l:"📊 Overview"},{id:"users",l:"👥 Users"},
    {id:"posts",l:"📝 Posts"},{id:"cats",l:"🏷️ Categories"},
    {id:"promote",l:"⭐ Promote"},{id:"announce",l:"📢 Announce"},
    {id:"export",l:"📤 Export"},{id:"audit",l:"📋 Audit Log"},
  ];
  const inp = { background:t.surface, border:`1.5px solid ${t.border}`, borderRadius:12,
    padding:"11px 14px", color:t.text, fontSize:14, outline:"none" };

  return (
    <div>
      <div style={{ background:`linear-gradient(135deg,${dm?"#1a1000":"#fffaed"},${dm?"#0a0a1a":"#f0eeff"})`,
        border:`1px solid ${t.border}`, borderRadius:18, padding:"22px 26px", marginBottom:22,
        display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ width:54, height:54, borderRadius:16,
          background:`linear-gradient(135deg,${t.gold},#ff9500)`, display:"flex",
          alignItems:"center", justifyContent:"center", boxShadow:`0 0 30px ${t.gold}25`, flexShrink:0 }}>
          <Shield size={26} color="#fff"/>
        </div>
        <div>
          <h2 style={{ color:t.text, fontSize:22, fontWeight:900, margin:"0 0 4px" }}>Admin Control Panel</h2>
          <p style={{ color:t.textSub, fontSize:13, margin:0 }}>
            {me.role==="admin"?"Full community management — GCOEA Forum":"Moderator tools — content moderation"}
          </p>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:22, paddingBottom:4, scrollbarWidth:"none" }}>
        {TABS.filter(tb=>me.role!=="moderator"||(tb.id!=="promote"&&tb.id!=="export")).map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)}
            style={{ padding:"9px 18px", borderRadius:12, border:`1.5px solid ${tab===tb.id?t.gold:t.border}`,
            background:tab===tb.id?`${t.gold}18`:t.card, color:tab===tb.id?t.gold:t.textSub,
            fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
            {tb.l}
          </button>
        ))}
      </div>

      {tab==="overview"&&<>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:14, marginBottom:22 }}>
          {stats.map(s=>(
            <div key={s.l} style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:16, padding:"18px 20px" }}>
              <div style={{ width:38, height:38, borderRadius:12, background:`${s.col}18`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                <s.i size={18} color={s.col}/>
              </div>
              <div style={{ fontSize:26, fontWeight:900, color:t.text }}>{s.v}</div>
              <div style={{ fontSize:12, color:t.textSub, marginTop:5 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:16, padding:20 }}>
          <h3 style={{ color:t.text, fontSize:16, fontWeight:800, margin:"0 0 14px" }}>Recent Posts</h3>
          {posts.slice(0,6).map(p=>(
            <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${t.border}` }}>
              <Av name={p.authorName} sz={34}/>
              <div style={{ flex:1, minWidth:0 }}>
                <span style={{ fontWeight:700, color:t.text, fontSize:13 }}>{p.authorName}</span>
                <span style={{ color:t.accent, fontSize:13, fontWeight:700 }}> #{p.category}</span>
                <p style={{ color:t.textMuted, fontSize:12, margin:"2px 0 0",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.content?.slice(0,60)}</p>
              </div>
              <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                <button onClick={()=>pinPost(p.id,p.pinned)}
                  style={{ background:`${p.pinned?t.accent:t.surface}18`, border:`1px solid ${p.pinned?t.accent:t.border}`,
                  borderRadius:8, padding:"5px 10px", color:p.pinned?t.accent:t.textSub, cursor:"pointer", fontSize:11, fontWeight:700 }}>
                  {p.pinned?"📌 Unpin":"📌 Pin"}
                </button>
                <button onClick={()=>delPost(p.id)} style={{ background:`${t.danger}12`,
                  border:`1px solid ${t.danger}30`, borderRadius:8, padding:"5px 10px",
                  color:t.danger, cursor:"pointer", fontSize:11, fontWeight:700 }}>Del</button>
              </div>
            </div>
          ))}
        </div>
      </>}

      {tab==="users"&&<div>
        <div style={{ position:"relative", marginBottom:16 }}>
          <Search size={14} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:t.textMuted }}/>
          <input value={userSrch} onChange={e=>setUserSrch(e.target.value)} placeholder="Search users..."
            style={{ ...inp, width:"100%", paddingLeft:40, boxSizing:"border-box" }}/>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtU.map(u=>{
            const lbl=userLabel(u);
            return (
              <div key={u.id} style={{ background:t.card, border:`1px solid ${u.isBanned?t.danger+"44":t.border}`,
                borderRadius:16, padding:"16px 20px", opacity:u.isBanned?.7:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                  <Av name={u.name} sz={46} online={u.isOnline}/>
                  <div style={{ flex:1, minWidth:180 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:5 }}>
                      <span style={{ fontWeight:800, color:t.text, fontSize:15 }}>{u.name}</span>
                      <Chip txt={lbl.txt} col={lbl.col}/>
                      {u.role==="admin"&&<Chip txt="Admin" col={t.gold} emoji="🛡️"/>}
                      {u.role==="moderator"&&<Chip txt="Mod" col={t.purple} emoji="⚖️"/>}
                      {u.isBanned&&<Chip txt="BANNED" col={t.danger}/>}
                      <BadgesRow badges={u.badges||[]}/>
                    </div>
                    <div style={{ color:t.textMuted, fontSize:12 }}>{u.email} · {u.branch} · {u.joinDate}</div>
                    {u.customTags?.length>0&&<div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:5 }}>
                      {u.customTags.map(tg=>(
                        <span key={tg} style={{ background:`${t.teal}18`, color:t.teal, border:`1px solid ${t.teal}30`,
                          borderRadius:100, padding:"2px 10px", fontSize:11, fontWeight:700,
                          display:"inline-flex", alignItems:"center", gap:5 }}>
                          {tg}
                          <button onClick={()=>removeTag(u.id,tg)} style={{ background:"none", border:"none",
                            cursor:"pointer", color:t.teal, padding:0, lineHeight:1, fontSize:14 }}>×</button>
                        </span>
                      ))}
                    </div>}
                  </div>
                  {u.role!=="admin"&&me.role==="admin"&&<div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <button onClick={()=>toggleBan(u.id)}
                      style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px",
                      border:`1.5px solid ${u.isBanned?t.success+"55":t.danger+"55"}`,
                      background:u.isBanned?`${t.success}10`:`${t.danger}10`,
                      color:u.isBanned?t.success:t.danger, borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700 }}>
                      {u.isBanned?<><UserCheck size={13}/> Unban</>:<><UserX size={13}/> Ban</>}
                    </button>
                    <button onClick={()=>setSelUid(selUid===u.id?null:u.id)}
                      style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px",
                      border:`1.5px solid ${selUid===u.id?t.accent:t.border}`, background:t.surface,
                      color:selUid===u.id?t.accent:t.textSub, borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700 }}>
                      <Settings size={13}/> Manage
                    </button>
                  </div>}
                </div>
                {selUid===u.id&&<div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${t.border}` }}>
                  <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                    <div>
                      <p style={{ color:t.textSub, fontSize:11, fontWeight:700, letterSpacing:.5, marginBottom:8 }}>SET ROLE</p>
                      <div style={{ display:"flex", gap:7 }}>
                        {["member","moderator"].map(r=>(
                          <button key={r} onClick={()=>setRole(u.id,r)}
                            style={{ padding:"7px 16px", borderRadius:10, border:`1.5px solid ${u.role===r?t.accent:t.border}`,
                            background:u.role===r?`${t.accent}18`:t.surface, color:u.role===r?t.accent:t.textSub,
                            fontSize:12, fontWeight:700, cursor:"pointer", textTransform:"capitalize" }}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ flex:1, minWidth:200 }}>
                      <p style={{ color:t.textSub, fontSize:11, fontWeight:700, letterSpacing:.5, marginBottom:8 }}>ADD CUSTOM TAG</p>
                      <div style={{ display:"flex", gap:8 }}>
                        <input value={tagInp} onChange={e=>setTagInp(e.target.value)}
                          placeholder="e.g. Class Rep, Sports Captain..." style={{ ...inp, flex:1, padding:"8px 12px", fontSize:13 }}/>
                        <button onClick={()=>addTag(u.id)} style={{ background:t.teal, border:"none",
                          borderRadius:10, padding:"8px 16px", color:"#fff", cursor:"pointer", fontSize:12, fontWeight:700 }}>Add</button>
                      </div>
                    </div>
                  </div>
                </div>}
              </div>
            );
          })}
        </div>
      </div>}

      {tab==="posts"&&<div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {posts.map(p=>{
          const lbl=p.authorYear==="Admin"?{txt:"Admin",col:t.gold}:p.isAlumni?{txt:`Alumni '${p.authorYear}`,col:t.purple}:{txt:p.authorYear,col:t.teal};
          return (
            <div key={p.id} style={{ background:t.card, border:`1px solid ${p.pinned?t.accent+"44":t.border}`,
              borderRadius:16, padding:"16px 20px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                  <Av name={p.authorName} sz={38}/>
                  <div>
                    <div style={{ display:"flex", gap:7, alignItems:"center", marginBottom:3, flexWrap:"wrap" }}>
                      <span style={{ fontWeight:800, color:t.text, fontSize:14 }}>{p.authorName}</span>
                      <Chip txt={lbl.txt} col={lbl.col}/><Chip txt={`#${p.category}`} col={t.accent}/>
                      {p.pinned&&<Chip txt="📌 Pinned" col={t.accent}/>}
                    </div>
                    <span style={{ color:t.textMuted, fontSize:12 }}>❤️{p.likes||0} · {fmtTime(p.createdAt)}</span>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>pinPost(p.id,p.pinned)}
                    style={{ display:"flex", alignItems:"center", gap:6,
                    background:`${p.pinned?t.accent:t.surface}18`, border:`1px solid ${p.pinned?t.accent:t.border}`,
                    borderRadius:10, padding:"7px 14px", color:p.pinned?t.accent:t.textSub, cursor:"pointer", fontSize:12, fontWeight:700 }}>
                    <Bookmark size={12} fill={p.pinned?t.accent:"none"}/> {p.pinned?"Unpin":"Pin"}
                  </button>
                  <button onClick={()=>delPost(p.id)} style={{ display:"flex", alignItems:"center", gap:6,
                    background:`${t.danger}10`, border:`1px solid ${t.danger}30`, borderRadius:10,
                    padding:"7px 14px", color:t.danger, cursor:"pointer", fontSize:12, fontWeight:700 }}>
                    <Trash2 size={12}/> Delete
                  </button>
                </div>
              </div>
              <p style={{ color:t.textSub, fontSize:13, margin:0, lineHeight:1.65,
                overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{p.content}</p>
            </div>
          );
        })}
      </div>}

      {tab==="cats"&&<div>
        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:18, padding:24, marginBottom:16 }}>
          <h3 style={{ color:t.text, fontSize:16, fontWeight:800, margin:"0 0 16px" }}>Add New Category</h3>
          <div style={{ display:"flex", gap:10 }}>
            <input value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCategory()}
              placeholder="Category name..." style={{ ...inp, flex:1 }}/>
            <button onClick={addCategory} style={{ background:`linear-gradient(135deg,${t.accent},${t.purple})`,
              border:"none", borderRadius:12, padding:"11px 20px", color:"#fff", cursor:"pointer", fontWeight:800, fontSize:14,
              display:"flex", alignItems:"center", gap:8 }}>
              <Plus size={16}/> Add
            </button>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
          {categories.map(c=>(
            <div key={c.id} style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:14,
              padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Hash size={14} color={t.accent}/>
                <span style={{ fontWeight:700, color:t.text, fontSize:14 }}>{c.name}</span>
              </div>
              <button onClick={()=>removeCategory(c.id,c.name)} style={{ background:`${t.danger}12`,
                border:`1px solid ${t.danger}25`, borderRadius:8, padding:"5px 10px",
                color:t.danger, cursor:"pointer", fontSize:11, fontWeight:700 }}>Remove</button>
            </div>
          ))}
        </div>
      </div>}

      {tab==="promote"&&me.role==="admin"&&<div>
        <p style={{ color:t.textSub, fontSize:14, marginBottom:18 }}>
          Click a badge to assign or remove it. Use ⚙️ Manage in Users tab to set roles and custom tags.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {users.filter(u=>u.role!=="admin").map(u=>{
            const lbl=userLabel(u);
            return (
              <div key={u.id} style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:16, padding:"16px 20px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
                  <Av name={u.name} sz={42} online={u.isOnline}/>
                  <div>
                    <div style={{ fontWeight:800, color:t.text, fontSize:15, marginBottom:4 }}>{u.name}</div>
                    <div style={{ display:"flex", gap:6 }}>
                      <Chip txt={lbl.txt} col={lbl.col}/>
                      {u.role==="moderator"&&<Chip txt="Mod" col={t.purple} emoji="⚖️"/>}
                      {u.isOnline?<Chip txt="🟢 Online" col={t.success}/>:<Chip txt="⚫ Offline" col={t.textMuted}/>}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {Object.entries(BADGES).map(([k,b])=>{
                    const has=(u.badges||[]).includes(k);
                    return (
                      <button key={k} onClick={()=>toggleBadge(u.id,k)} title={b.label}
                        style={{ padding:"7px 14px", borderRadius:100, border:`1.5px solid ${has?b.col:t.border}`,
                        background:has?`${b.col}20`:t.surface, color:has?b.col:t.textSub,
                        cursor:"pointer", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
                        {b.e} {b.label} {has&&<Check size={11}/>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>}

      {tab==="announce"&&<div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:18, padding:24 }}>
        <h3 style={{ color:t.text, fontSize:16, fontWeight:800, margin:"0 0 6px" }}>📢 Community Announcement</h3>
        <p style={{ color:t.textSub, fontSize:13, marginBottom:18 }}>
          Shown at the top of the forum for all members. Leave blank to hide.
        </p>
        {savedAnnounce&&<div style={{ background:`${t.success}10`, border:`1px solid ${t.success}30`, borderRadius:12,
          padding:"10px 16px", marginBottom:14, display:"flex", gap:8, alignItems:"center" }}>
          <CheckCircle size={14} color={t.success}/>
          <span style={{ color:t.success, fontSize:12, fontWeight:700 }}>Current announcement is live:</span>
          <span style={{ color:t.textSub, fontSize:12 }}>{savedAnnounce.slice(0,60)}{savedAnnounce.length>60?"...":""}</span>
        </div>}
        <textarea value={announce} onChange={e=>setAnnounce(e.target.value)}
          placeholder="Write an announcement for all community members..." rows={5}
          style={{ width:"100%", background:t.surface, border:`1.5px solid ${t.border}`, borderRadius:14,
          padding:"14px 16px", color:t.text, fontSize:14, outline:"none", resize:"none",
          lineHeight:1.7, boxSizing:"border-box", marginBottom:14 }}/>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={()=>setAnnounce("")}
            style={{ padding:"11px 20px", background:t.surface, border:`1.5px solid ${t.border}`,
            borderRadius:12, color:t.textSub, cursor:"pointer", fontWeight:700, fontSize:14 }}>Clear</button>
          <button onClick={saveAnnouncement} disabled={savingAnn}
            style={{ flex:1, background:`linear-gradient(135deg,${t.accent},${t.purple})`,
            border:"none", borderRadius:12, padding:"11px", color:"#fff", cursor:"pointer",
            fontWeight:900, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {savingAnn?<><Spinner col="#fff"/> Saving...</>:<><Bell size={15}/> Save Announcement</>}
          </button>
        </div>
      </div>}

      {tab==="export"&&me.role==="admin"&&<div>
        <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:18, padding:24, marginBottom:16 }}>
          <h3 style={{ color:t.text, fontSize:16, fontWeight:800, margin:"0 0 6px" }}>📤 Export Member Data</h3>
          <p style={{ color:t.textSub, fontSize:13, marginBottom:20 }}>
            Download all member data as CSV and open in Google Sheets.
          </p>
          <button onClick={()=>exportCSV(users)} style={{ display:"flex", alignItems:"center", gap:10,
            background:`linear-gradient(135deg,${t.success},#05a050)`, border:"none", borderRadius:14,
            padding:"14px 24px", color:"#fff", cursor:"pointer", fontWeight:800, fontSize:15, marginBottom:16 }}>
            <Download size={18}/> Download Members CSV
          </button>
          <div style={{ background:`${t.accent}10`, border:`1px solid ${t.accent}25`, borderRadius:14, padding:"16px 18px" }}>
            <p style={{ color:t.text, fontSize:13, fontWeight:700, margin:"0 0 8px" }}>📊 How to open in Google Sheets:</p>
            <p style={{ color:t.textSub, fontSize:13, lineHeight:2, margin:0 }}>
              1. Download the CSV above<br/>
              2. Open <strong>Google Sheets (sheets.google.com)</strong><br/>
              3. Click File → Import → Upload → Select the CSV file<br/>
              4. All member data will be in your sheet!<br/>
              <br/>
              For live auto-sync: Firebase Console → Extensions → "Sync to Sheets"
            </p>
          </div>
        </div>
      </div>}

      {tab==="audit"&&<div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:18, padding:24 }}>
        <h3 style={{ color:t.text, fontSize:16, fontWeight:800, margin:"0 0 16px" }}>📋 Admin Audit Log</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {auditLog.map(e=>(
            <div key={e.id} style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"12px 16px",
              background:t.surface, borderRadius:12, border:`1px solid ${t.border}` }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${t.accent}18`,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Activity size={16} color={t.accent}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:3 }}>
                  <span style={{ fontWeight:800, color:t.text, fontSize:13 }}>{e.adminName}</span>
                  <Chip txt={e.action?.replace(/_/g," ")||"ACTION"} col={t.gold}/>
                </div>
                <p style={{ color:t.textSub, fontSize:12, margin:"0 0 2px" }}>{e.detail}</p>
                <span style={{ color:t.textMuted, fontSize:11 }}>
                  Target: {e.targetName} · {fmtTime(e.createdAt)}
                </span>
              </div>
            </div>
          ))}
          {auditLog.length===0&&<p style={{ color:t.textMuted, textAlign:"center", padding:30 }}>No admin actions logged yet.</p>}
        </div>
      </div>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//  MAIN APP (after login)
// ────────────────────────────────────────────────────────────────
function MainApp({ me, dm, toggleDm, onLogoutRequest }) {
  const t = dm?TH.dark:TH.light;
  const [page,setPage] = useState("forum");
  const [mobileOpen,setMobileOpen] = useState(false);
  const [chatTarget,setChatTarget] = useState(null);
  const [users,setUsers] = useState([]);
  const [posts,setPosts] = useState([]);
  const [categories,setCategories] = useState([]);
  const [meData,setMeData] = useState(me);
  const [announcement,setAnnouncement] = useState("");
  const [loading,setLoading] = useState(true);

  // Real-time: current user
  useEffect(()=>{
    return onSnapshot(doc(db,"users",me.id),(snap)=>{
      if(snap.exists()) setMeData({id:snap.id,...snap.data()});
    });
  },[me.id]);

  // Real-time: all users
  useEffect(()=>{
    return onSnapshot(collection(db,"users"),(snap)=>{
      setUsers(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
  },[]);

  // Real-time: posts
  useEffect(()=>{
    const q = query(collection(db,"posts"),orderBy("createdAt","desc"));
    return onSnapshot(q,(snap)=>{
      setPosts(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    });
  },[]);

  // Real-time: categories
  useEffect(()=>{
    return onSnapshot(collection(db,"categories"),(snap)=>{
      setCategories(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
  },[]);

  // Real-time: announcement
  useEffect(()=>{
    return onSnapshot(doc(db,"settings","main"),(snap)=>{
      if(snap.exists()) setAnnouncement(snap.data().announcement||"");
    });
  },[]);

  // Online status management
  useEffect(()=>{
    const ref = doc(db,"users",me.id);
    updateDoc(ref,{ isOnline:true }).catch(()=>{});
    const handle = ()=>{ updateDoc(ref,{ isOnline:false }).catch(()=>{}); };
    window.addEventListener("beforeunload",handle);
    return ()=>{ handle(); window.removeEventListener("beforeunload",handle); };
  },[me.id]);

  useEffect(()=>{
    if(chatTarget){ setPage("chat"); setChatTarget(null); }
  },[chatTarget]);

  const navItems = [
    {id:"forum",label:"Forum",icon:Home},
    {id:"chat",label:"Messages",icon:MessageCircle},
    {id:"members",label:"Members",icon:Users},
    ...(meData.role==="admin"||meData.role==="moderator"?[{id:"admin",label:meData.role==="admin"?"Admin":"Mod Panel",icon:Shield}]:[]),
    {id:"profile",label:"Profile",icon:User},
  ];
  const lbl = userLabel(meData);
  const titls = { forum:"Community Forum 🏛️", chat:"Messages 💬", members:"Members 👥",
    admin:meData.role==="admin"?"Admin Panel 🛡️":"Moderator Panel ⚖️", profile:"My Profile" };
  const subs = {
    forum:"Connect, share, and grow with GCOEA",
    chat:"Direct conversations with members",
    members:`${users.filter(u=>!u.isBanned).length} members · ${users.filter(u=>u.isOnline).length} online now`,
    admin:meData.role==="admin"?"Full community control":"Content moderation",
    profile:"Your community presence"
  };

  if(loading) return (
    <div style={{ minHeight:"100vh", background:t.bg, display:"flex", alignItems:"center",
      justifyContent:"center", flexDirection:"column", gap:16, color:t.textSub }}>
      <Spinner col={t.accent}/>
      <p style={{ fontSize:14 }}>Loading GCOEA Forum...</p>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:t.bg, color:t.text }}>
      <style>{GS+`
        @media(max-width:720px){.desk-nav{display:none!important}.hamburger{display:flex!important}}
        @media(max-width:720px){.mob-nav{display:flex!important}main{padding-bottom:72px!important}}
        @media(min-width:900px){.ptxt{display:block!important}}
        input:focus,textarea:focus,select:focus{border-color:${t.accent}!important;outline:none!important;}
      `}</style>
      <Orbs dm={dm}/>

      {/* Topbar */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, height:62, background:t.glass,
        backdropFilter:"blur(20px)", borderBottom:`1px solid ${t.border}`, zIndex:100,
        display:"flex", alignItems:"center", padding:"0 20px", gap:12 }}>
        <button onClick={()=>setMobileOpen(o=>!o)} className="hamburger"
          style={{ background:"none", border:"none", cursor:"pointer", color:t.textSub, padding:6, display:"none", borderRadius:8 }}>
          <Menu size={22}/>
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginRight:"auto" }}>
          <GCOEALogo sz={36}/>
          <div>
            <div style={{ fontWeight:900, fontSize:15, color:t.text, letterSpacing:-.5, lineHeight:1 }}>GCOEA</div>
            <div style={{ fontSize:9, color:t.textMuted, fontWeight:700, letterSpacing:.8 }}>CONNECT</div>
          </div>
        </div>
        <div className="desk-nav" style={{ display:"flex", gap:4 }}>
          {navItems.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 15px", borderRadius:12,
              border:"none", background:page===n.id?`${t.accent}18`:"none",
              color:page===n.id?t.accent:t.textSub, fontSize:13, fontWeight:700, cursor:"pointer", transition:"all .2s" }}>
              <n.icon size={15}/> {n.label}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={toggleDm} style={{ background:t.surface, border:`1px solid ${t.border}`,
            borderRadius:12, padding:"8px", cursor:"pointer", color:t.textSub, display:"flex" }}>
            {dm?<Sun size={17}/>:<Moon size={17}/>}
          </button>
          <div onClick={()=>setPage("profile")} style={{ display:"flex", alignItems:"center", gap:9,
            cursor:"pointer", background:t.surface, border:`1px solid ${t.border}`, borderRadius:14, padding:"5px 12px 5px 5px" }}>
            <Av name={meData.name} sz={30} online={true}/>
            <div className="ptxt" style={{ display:"none" }}>
              <div style={{ fontWeight:800, fontSize:12, color:t.text }}>{meData.name.split(" ")[0]}</div>
              <div style={{ marginTop:1 }}><Chip txt={lbl.txt} col={lbl.col}/></div>
            </div>
          </div>
          <button onClick={onLogoutRequest} style={{ background:t.surface, border:`1px solid ${t.border}`,
            borderRadius:12, padding:"8px", cursor:"pointer", color:t.textMuted, display:"flex" }} title="Logout">
            <LogOut size={17}/>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen&&(
        <div style={{ position:"fixed", inset:0, zIndex:200 }}>
          <div onClick={()=>setMobileOpen(false)} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.6)", backdropFilter:"blur(6px)" }}/>
          <div style={{ position:"absolute", left:0, top:0, bottom:0, width:280, background:t.card,
            borderRight:`1px solid ${t.border}`, padding:20, display:"flex", flexDirection:"column", gap:6 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}><GCOEALogo sz={34}/>
                <span style={{ fontWeight:900, color:t.text, fontSize:16 }}>GCOEA</span></div>
              <button onClick={()=>setMobileOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:t.textSub, padding:4 }}><X size={22}/></button>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
              background:t.surface, borderRadius:14, marginBottom:8 }}>
              <Av name={meData.name} sz={42} online={true}/>
              <div>
                <div style={{ fontWeight:800, color:t.text, fontSize:14 }}>{meData.name}</div>
                <Chip txt={lbl.txt} col={lbl.col}/>
              </div>
            </div>
            {navItems.map(n=>(
              <button key={n.id} onClick={()=>{setPage(n.id);setMobileOpen(false);}}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px",
                borderRadius:14, border:"none", background:page===n.id?`${t.accent}18`:"none",
                color:page===n.id?t.accent:t.textSub, fontSize:15, fontWeight:700, cursor:"pointer", textAlign:"left", width:"100%" }}>
                <n.icon size={18}/> {n.label}
              </button>
            ))}
            <div style={{ marginTop:"auto" }}>
              <button onClick={()=>{setMobileOpen(false);toggleDm();}}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
                borderRadius:14, border:"none", background:t.surface, color:t.textSub,
                fontSize:14, fontWeight:700, cursor:"pointer", width:"100%", marginBottom:8 }}>
                {dm?<Sun size={17}/>:<Moon size={17}/>} {dm?"Light Mode":"Dark Mode"}
              </button>
              <button onClick={()=>{setMobileOpen(false);onLogoutRequest();}}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px",
                borderRadius:14, border:"none", background:`${t.danger}12`, color:t.danger,
                fontSize:14, fontWeight:700, cursor:"pointer", width:"100%" }}>
                <LogOut size={17}/> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ paddingTop:62, minHeight:"100vh", position:"relative", zIndex:1 }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"24px 16px" }}>
          <div style={{ marginBottom:22 }}>
            <h1 style={{ fontSize:24, fontWeight:900, color:t.text, margin:"0 0 4px", letterSpacing:-.5 }}>{titls[page]}</h1>
            <p style={{ color:t.textSub, fontSize:13, margin:0 }}>{subs[page]}</p>
          </div>
          {page==="forum"&&<ForumPage me={meData} posts={posts} users={users} categories={categories} announcement={announcement} t={t} dm={dm}/>}
          {page==="chat"&&<ChatPage me={meData} users={users} t={t} dm={dm}/>}
          {page==="members"&&<MembersPage me={meData} users={users} onMessage={u=>{setChatTarget(u);}} t={t}/>}
          {page==="admin"&&(meData.role==="admin"||meData.role==="moderator")&&
            <AdminPanel users={users} posts={posts} categories={categories} me={meData} t={t} dm={dm}/>}
          {page==="profile"&&<ProfilePage user={meData} posts={posts} t={t} dm={dm}/>}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mob-nav" style={{ position:"fixed", bottom:0, left:0, right:0, height:62,
        background:t.glass, backdropFilter:"blur(20px)", borderTop:`1px solid ${t.border}`,
        zIndex:100, display:"none", alignItems:"center", justifyContent:"space-around", padding:"0 8px" }}>
        {navItems.slice(0,5).map(n=>(
          <button key={n.id} onClick={()=>setPage(n.id)}
            style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"8px 10px",
            borderRadius:14, border:"none", background:page===n.id?`${t.accent}18`:"none",
            color:page===n.id?t.accent:t.textMuted, fontSize:10, fontWeight:700, cursor:"pointer", flex:1 }}>
            <n.icon size={20}/> {n.label.split(" ")[0]}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
//  ROOT APP — Auth State Manager
// ────────────────────────────────────────────────────────────────
export default function App() {
  const [dm,setDm] = useState(true);
  const [me,setMe] = useState(null);
  const [screen,setScreen] = useState("login");
  const [authLoading,setAuthLoading] = useState(true);
  const [showLogout,setShowLogout] = useState(false);
  const t = dm?TH.dark:TH.light;

  // Firebase auth state — persists across page refresh (3+ days)
  useEffect(()=>{
    return onAuthStateChanged(auth, async (firebaseUser)=>{
      if(firebaseUser){
        try {
          const snap = await getDoc(doc(db,"users",firebaseUser.uid));
          if(snap.exists()){
            setMe({ id:snap.id, ...snap.data() });
          } else {
            // Profile not in Firestore — logout
            await signOut(auth); setMe(null);
          }
        } catch(e){
          console.error(e); setMe(null);
        }
      } else {
        setMe(null);
      }
      setAuthLoading(false);
    });
  },[]);

  const handleLogout = async () => {
    await signOut(auth);
    setMe(null); setScreen("login"); setShowLogout(false);
  };

  if(authLoading) return (
    <div style={{ minHeight:"100vh", background:"#06091a", display:"flex", alignItems:"center",
      justifyContent:"center", flexDirection:"column", gap:16, fontFamily:"'Sora',system-ui,sans-serif" }}>
      <style>{GS}</style>
      <GCOEALogo sz={72}/>
      <div style={{ display:"flex", alignItems:"center", gap:10, color:"#7a93c4", fontSize:14 }}>
        <Spinner col="#4f7aff"/> Loading GCOEA Connect...
      </div>
    </div>
  );

  if(!me){
    if(screen==="register") return <RegisterPage goLogin={()=>setScreen("login")} dm={dm}/>;
    return <LoginPage goReg={()=>setScreen("register")} dm={dm} toggleDm={()=>setDm(d=>!d)}/>;
  }

  return (
    <>
      <MainApp me={me} dm={dm} toggleDm={()=>setDm(d=>!d)} onLogoutRequest={()=>setShowLogout(true)}/>
      {showLogout&&<LogoutConfirm onYes={handleLogout} onNo={()=>setShowLogout(false)} t={t}/>}
      <style>{GS}</style>
    </>
  );
}
