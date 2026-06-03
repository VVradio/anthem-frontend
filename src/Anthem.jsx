import React, { useState, useRef, useEffect } from "react";
import {
  Disc3, Users2, Megaphone, MapPin, Scale, ImageIcon, PenLine,
  LayoutDashboard, Gift, Check, ArrowRight, Send, Sparkles, Music2,
  TrendingUp, Calendar, DollarSign, Activity, Cpu, Copy, Headphones, Mic2,
  MessageCircle, Wallet, UserCircle, Rocket, Loader2, BarChart3, Music, Link2,
  FileText, Link as LinkIcon, ListChecks, PenTool, Inbox, Award, Mail as MailIcon,
  ListMusic, Wrench, ArrowLeft
} from "lucide-react";

/* ============================ THEME — clean & indie, warm ============================ */
const C = {
  paper: "#faf6f0", cream: "#fffdf9", card: "#ffffff",
  ink: "#1f1a16", soft: "#6b6258", line: "#ece3d6",
  rust: "#c2542d", clay: "#d98b4a", sage: "#7b8b6f",
  plum: "#7a5c74", teal: "#3f7d78", gold: "#b8893f",
};
const FONT_DISPLAY = `"Fraunces", Georgia, serif`;
const FONT_BODY = `"Inter", system-ui, sans-serif`;

/* ============================ BACKEND WIRING ============================
 * Set API_BASE to your deployed backend (e.g. "https://api.anthem.fm").
 * When it's set, the app logs in and routes every agent call through your
 * server (where the AI key lives). When it's left empty — like in this
 * preview — the app falls back to a direct demo call so you can still try it.
 * ----------------------------------------------------------------------- */
const API_BASE = import.meta.env.VITE_API_BASE || ""; // set VITE_API_BASE in your host to go live

const api = {
  live: () => !!API_BASE,
  async signup(email, password, referralCode) {
    const r = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, referralCode }),
    });
    if (!r.ok) throw new Error((await r.json()).error || "Signup failed");
    return r.json();
  },
  async login(email, password) {
    const r = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) throw new Error((await r.json()).error || "Login failed");
    return r.json();
  },
  async chat(token, agentId, messages) {
    const r = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ agentId, messages }),
    });
    if (!r.ok) throw new Error((await r.json()).error || "Chat failed");
    return r.json(); // { text } or { svg }
  },
  async streams(token) {
    const r = await fetch(`${API_BASE}/api/streams`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error((await r.json()).error || "Streams failed");
    return r.json();
  },
};

// Fallback used only when no backend is configured (keeps the preview working).
async function directCall(system, messages) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, system,
      messages: messages.map(m => ({ role: m.role, content: m.content })) }),
  });
  const data = await res.json();
  return data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "";
}

const MODELS = [
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", vendor: "Anthropic" },
  { id: "gpt-class", label: "GPT-class", vendor: "OpenAI" },
  { id: "gemini-class", label: "Gemini-class", vendor: "Google" },
  { id: "llama-class", label: "Llama-class", vendor: "Meta / open" },
];

const AGENTS = [
  { id: "anr", name: "Nora", role: "A&R · Career Strategist", icon: Disc3, color: C.rust, model: "claude-sonnet-4-20250514",
    blurb: "Maps your release strategy, spots growth opportunities, and gives honest feedback on your direction.",
    sample: "Your last two singles leaned bedroom-pop but your streams spike on the upbeat tracks. I'd lead the next release with the high-energy single and stagger two slower B-sides. Want a 6-week rollout plan?" },
  { id: "social", name: "Mia", role: "Social & Fan Engagement", icon: Megaphone, color: C.plum, model: "gpt-class",
    blurb: "Plans content around your releases, writes captions in your voice, and keeps your fanbase warm between drops.",
    sample: "Release week plan ready: teaser Tuesday, snippet reel Thursday, drop-day countdown, and a fan Q&A Saturday. Want me to draft the caption for the snippet reel?" },
  { id: "booking", name: "Theo", role: "Booking & Gig Outreach", icon: MapPin, color: C.teal, model: "claude-sonnet-4-20250514",
    blurb: "Finds venues and promoters, drafts booking pitches, and helps route a tour that actually makes sense.",
    sample: "Found 8 venues that fit your draw (200–400 cap) along the I-95 corridor. Drafted a booking pitch with your stats and EPK link. Want me to tailor it per venue?" },
  { id: "legal", name: "Sol", role: "Royalties & Contracts", icon: Scale, color: C.gold, model: "claude-sonnet-4-20250514",
    blurb: "Explains splits, reviews contracts in plain language, and flags terms that could cost you down the line.",
    sample: "Reviewed the distribution deal. The 30% commission is high and the term auto-renews for 3 years. Recommend negotiating to 15% and a 1-year term. Not legal advice — run it by a music attorney too." },
  { id: "image", name: "Iris", role: "Cover Art & Promo", icon: ImageIcon, color: C.clay, model: "gemini-class",
    blurb: "Generates single covers, promo graphics, and social visuals from a description, in your aesthetic.",
    sample: "Describe the mood and I'll make a cover — e.g. \"moody analog single cover, warm grain, lone figure under a streetlight, muted oranges.\"" },
  { id: "blog", name: "Remy", role: "Press · Bio · Blog", icon: PenLine, color: C.sage, model: "claude-sonnet-4-20250514",
    blurb: "Writes press releases, artist bios, and EPK copy that sound like you — ready to send to blogs and playlists.",
    sample: "Give me the release details and a few facts about you, and I'll draft a press release, a short bio, and a playlist pitch. What are we announcing?" },
  { id: "chat", name: "Cleo", role: "Website Chat Widget", icon: MessageCircle, color: C.teal, model: "claude-sonnet-4-20250514",
    blurb: "A 24/7 chatbot for your site — answers fan FAQs, handles venue/booking inquiries, and captures leads while you sleep.",
    sample: "Hey! I'm the chat widget that lives on your site. Fans ask me about tour dates, merch, and releases; venues ask about booking. I capture their info and hand the hot ones to you. (Voice-call version coming as you scale.)" },
  { id: "finance", name: "June", role: "Money & Royalties Coach", icon: Wallet, color: C.gold, model: "claude-sonnet-4-20250514",
    blurb: "Helps you budget tours, make sense of royalty income, plan for taxes, and understand your numbers — in plain English.",
    sample: "Let's make your money make sense. I can budget a tour, break down where your streaming income comes from, or explain what to set aside for taxes. Heads up: I'm a financial literacy coach, not a licensed advisor — take big decisions to a real accountant. What are we looking at?" },
];

const PLANS = [
  { name: "Indie", price: 29, tag: "Solo & emerging artists", accent: C.teal,
    features: ["2 active agents", "Cover art generator", "Website chat widget", "Email support"] },
  { name: "Artist", price: 79, tag: "Working musicians", accent: C.rust, popular: true,
    features: ["All 8 agents", "Booking & press outreach", "Royalty & contract review", "Multi-AI model routing", "Referral rewards 2x"] },
  { name: "Label", price: 249, tag: "Managers, labels & studios", accent: C.plum,
    features: ["Unlimited artists & agents", "White-label dashboard", "Bring-your-own model keys", "Team seats", "Dedicated success manager"] },
];

/* ============================ ROOT ============================ */
export default function App() {
  const [view, setView] = useState("landing");
  const [auth, setAuth] = useState(null); // { token, user }

  function launch() {
    // If a backend is configured, require login first; otherwise go straight in (demo).
    if (api.live() && !auth) setView("login");
    else setView("dashboard");
  }

  return (
    <div style={{ background: C.paper, color: C.ink, fontFamily: FONT_BODY, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::selection { background:${C.clay}; color:#fff; }
        body { margin:0; }
        @keyframes rise { from { opacity:0; transform: translateY(16px);} to {opacity:1; transform:none;} }
        @keyframes blink { 50% { opacity:.25; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .rise { animation: rise .7s cubic-bezier(.2,.8,.2,1) both; }
        .lift { transition: transform .22s, box-shadow .22s, border-color .22s; }
        .lift:hover { transform: translateY(-3px); box-shadow: 0 18px 40px -24px rgba(31,26,22,.35); border-color:${C.clay}; }
        .scroll::-webkit-scrollbar{width:8px;} .scroll::-webkit-scrollbar-thumb{background:${C.line};border-radius:8px;}
      `}</style>
      {view === "landing" && <Landing onLaunch={launch} />}
      {view === "login" && <Login onAuthed={(a) => { setAuth(a); setView("dashboard"); }} onBack={() => setView("landing")} />}
      {view === "dashboard" && <Dashboard auth={auth} onExit={() => setView("landing")} />}
    </div>
  );
}

/* ============================ LANDING ============================ */
function Landing({ onLaunch }) {
  return (
    <div>
      <nav style={{ position: "sticky", top: 0, zIndex: 40, backdropFilter: "blur(10px)",
        background: "rgba(250,246,240,.8)", borderBottom: `1px solid ${C.line}` }}>
        <div style={wrap}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0" }}>
            <Logo />
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              {["Agents", "Pricing", "Referrals"].map(l => (
                <a key={l} href={`#${l.toLowerCase()}`} className="navlink"
                   style={{ color: C.soft, textDecoration: "none", fontSize: 14, display: "none" }}>{l}</a>
              ))}
              <button onClick={onLaunch} style={btn(C.rust)}>Open studio <ArrowRight size={16} /></button>
            </div>
          </div>
        </div>
        <style>{`@media(min-width:760px){.navlink{display:inline!important;}}`}</style>
      </nav>

      {/* Hero */}
      <header style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background:
          `radial-gradient(700px 380px at 85% -5%, rgba(217,139,74,.16), transparent),
           radial-gradient(600px 420px at -5% 25%, rgba(122,92,116,.12), transparent)` }} />
        <div style={{ ...wrap, position: "relative" }}>
          <div style={{ padding: "84px 0 64px", maxWidth: 820 }}>
            <span className="rise" style={pill}><Music2 size={14} color={C.rust} /> A creative team for working musicians</span>
            <h1 className="rise" style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(40px,7vw,74px)",
              lineHeight: 1.04, margin: "20px 0 0", fontWeight: 600, letterSpacing: -1 }}>
              Your whole <span style={{ color: C.rust, fontStyle: "italic" }}>music team</span>,
              run by <span style={{ color: C.teal, fontStyle: "italic" }}>AI</span>.
            </h1>
            <p className="rise" style={{ color: C.soft, fontSize: 19, lineHeight: 1.65, marginTop: 20, maxWidth: 600 }}>
              Anthem gives artists, managers, and labels an AI A&R strategist, social manager,
              booking agent, contract reviewer, cover artist, and press writer — all in one studio.
            </p>
            <div className="rise" style={{ display: "flex", gap: 12, marginTop: 30, flexWrap: "wrap" }}>
              <button onClick={onLaunch} style={btn(C.rust, true)}>Open the studio <ArrowRight size={18} /></button>
              <a href="#pricing" style={btn("transparent")}>See pricing</a>
            </div>
            <div className="rise" style={{ display: "flex", gap: 26, marginTop: 36, color: C.soft, fontSize: 13, flexWrap: "wrap" }}>
              <Stat n="24/7" l="always on" /><Stat n="8" l="specialist agents" />
              <Stat n="4+" l="AI models" /><Stat n="30%" l="referral commission" />
            </div>
          </div>
        </div>
      </header>

      {/* Agents */}
      <section id="agents" style={{ ...wrap, padding: "36px 0 28px" }}>
        <SectionHead kicker="The roster" title="Meet your studio" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 }}>
          {AGENTS.map((a, i) => (
            <div key={a.id} className="lift" style={{ ...card, animationDelay: `${i * 60}ms` }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, display: "grid", placeItems: "center",
                background: `${a.color}18`, border: `1px solid ${a.color}40` }}>
                <a.icon size={22} color={a.color} />
              </div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, marginTop: 14, fontWeight: 600 }}>{a.name}</div>
              <div style={{ color: a.color, fontSize: 12, fontWeight: 600, letterSpacing: .4, textTransform: "uppercase" }}>{a.role}</div>
              <p style={{ color: C.soft, fontSize: 14, lineHeight: 1.55, marginTop: 10 }}>{a.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ ...wrap, padding: "56px 0 28px" }}>
        <SectionHead kicker="Plans" title="Pricing that fits your stage" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
          {PLANS.map(p => (
            <div key={p.name} className="lift" style={{ ...card, position: "relative",
              borderColor: p.popular ? p.accent : C.line,
              boxShadow: p.popular ? `0 28px 60px -38px ${p.accent}` : "none" }}>
              {p.popular && <span style={{ position: "absolute", top: -12, right: 18, background: p.accent,
                color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20 }}>MOST POPULAR</span>}
              <div style={{ color: p.accent, fontSize: 12, fontWeight: 700, letterSpacing: .6, textTransform: "uppercase" }}>{p.name}</div>
              <div style={{ color: C.soft, fontSize: 13 }}>{p.tag}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "16px 0" }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 46, fontWeight: 600 }}>${p.price}</span>
                <span style={{ color: C.soft }}>/mo</span>
              </div>
              {p.features.map(f => (
                <div key={f} style={{ display: "flex", gap: 9, alignItems: "center", color: C.ink, fontSize: 14, padding: "6px 0" }}>
                  <Check size={16} color={p.accent} /> {f}
                </div>
              ))}
              <button onClick={onLaunch} style={{ ...btn(p.popular ? p.accent : "transparent"), width: "100%", marginTop: 16, justifyContent: "center" }}>
                Get started
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Referral */}
      <section id="referrals" style={{ ...wrap, padding: "56px 0 76px" }}>
        <div style={{ ...card, padding: 38, background: `linear-gradient(120deg, ${C.cream}, #fdf0e4)`, borderColor: C.clay }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "center" }}>
            <div>
              <span style={pill}><Gift size={14} color={C.rust} /> Referral program</span>
              <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 32, margin: "14px 0 10px", fontWeight: 600 }}>
                Put other artists on, earn <span style={{ color: C.rust }}>30%</span> recurring.
              </h3>
              <p style={{ color: C.soft, lineHeight: 1.65, fontSize: 15 }}>
                Share your link with other artists and bands. They get 20% off their first 3 months,
                and you earn 30% recurring for as long as they keep creating with Anthem.
              </p>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {[["Share", "Send your artist link"], ["They join", "20% off first 3 months"],
                ["You earn", "30% recurring, paid monthly"]].map(([t, d], i) => (
                <div key={t} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `${C.rust}18`,
                    color: C.rust, display: "grid", placeItems: "center", fontFamily: FONT_DISPLAY, fontWeight: 700 }}>{i + 1}</div>
                  <div><div style={{ fontWeight: 600 }}>{t}</div><div style={{ color: C.soft, fontSize: 13 }}>{d}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: "26px 0", textAlign: "center", color: C.soft, fontSize: 13 }}>
        <Logo /> <span style={{ marginLeft: 8 }}>© 2026 Anthem — demo build.</span>
      </footer>
    </div>
  );
}

/* ============================ LOGIN ============================ */
function Login({ onAuthed, onBack }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ref, setRef] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(""); setBusy(true);
    try {
      const res = mode === "signup"
        ? await api.signup(email, password, ref || undefined)
        : await api.login(email, password);
      onAuthed(res);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div className="rise" style={{ ...card, width: "100%", maxWidth: 400, padding: 30 }}>
        <Logo />
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, margin: "18px 0 4px" }}>
          {mode === "signup" ? "Create your studio" : "Welcome back"}
        </h2>
        <p style={{ color: C.soft, fontSize: 14, marginTop: 0 }}>
          {mode === "signup" ? "Start with the Indie plan free." : "Log in to your studio."}
        </p>
        <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
            style={inp} type="email" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
            style={inp} type="password" onKeyDown={e => e.key === "Enter" && submit()} />
          {mode === "signup" && (
            <input value={ref} onChange={e => setRef(e.target.value)} placeholder="Referral code (optional)" style={inp} />
          )}
          {err && <div style={{ color: C.rust, fontSize: 13 }}>{err}</div>}
          <button onClick={submit} disabled={busy}
            style={{ ...btn(C.rust), justifyContent: "center", opacity: busy ? .6 : 1 }}>
            {busy ? "…" : mode === "signup" ? "Create studio" : "Log in"}
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: 13 }}>
          <button onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            style={{ background: "none", border: "none", color: C.teal, cursor: "pointer", fontFamily: FONT_BODY }}>
            {mode === "signup" ? "Have an account? Log in" : "New here? Sign up"}
          </button>
          <button onClick={onBack}
            style={{ background: "none", border: "none", color: C.soft, cursor: "pointer", fontFamily: FONT_BODY }}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================ DASHBOARD ============================ */
function Dashboard({ auth, onExit }) {
  const [tab, setTab] = useState("overview");
  // Artist profile lives here so every agent can read it (the "memory").
  const [profile, setProfile] = useState(null);

  const nav = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "streams", label: "Streams", icon: BarChart3, color: C.teal },
    { id: "campaign", label: "Release Campaign", icon: Rocket, color: C.rust },
    { id: "tools", label: "Artist Tools", icon: Wrench, color: C.plum },
    ...AGENTS.map(a => ({ id: a.id, label: a.name, icon: a.icon, color: a.color })),
    { id: "profile", label: "Artist Profile", icon: UserCircle },
    { id: "referral", label: "Referrals", icon: Gift },
  ];
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside className="scroll" style={{ width: 234, borderRight: `1px solid ${C.line}`, background: C.cream,
        padding: "20px 14px", position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
        <div style={{ padding: "0 6px 18px" }}><Logo /></div>
        {nav.map(n => {
          const active = tab === n.id;
          return (
            <button key={n.id} onClick={() => setTab(n.id)} style={{
              display: "flex", gap: 11, alignItems: "center", width: "100%", textAlign: "left",
              padding: "11px 12px", marginBottom: 4, borderRadius: 10, cursor: "pointer",
              border: "none", fontSize: 14, fontFamily: FONT_BODY,
              background: active ? C.paper : "transparent",
              color: active ? C.ink : C.soft,
              borderLeft: `3px solid ${active ? (n.color || C.rust) : "transparent"}`, fontWeight: active ? 600 : 400 }}>
              <n.icon size={18} color={active ? (n.color || C.rust) : C.soft} /> {n.label}
            </button>
          );
        })}
        <button onClick={onExit} style={{ ...btn("transparent"), width: "100%", justifyContent: "center", marginTop: 20, fontSize: 13 }}>
          ← Back to site
        </button>
      </aside>

      <main className="scroll" style={{ flex: 1, padding: "26px 32px", overflow: "auto" }}>
        {tab === "overview" && <Overview onJump={setTab} profile={profile} />}
        {tab === "streams" && <StreamsPanel profile={profile} auth={auth} />}
        {tab === "campaign" && <CampaignPanel auth={auth} profile={profile} onSetup={() => setTab("profile")} />}
        {tab === "tools" && <ToolsPanel auth={auth} profile={profile} streams={{ months: STREAM_MONTHS, streams: STREAM_VALUES, topTracks: TOP_TRACKS, platforms: PLATFORMS }} />}
        {tab === "profile" && <ProfilePanel profile={profile} onSave={setProfile} />}
        {tab === "referral" && <ReferralPanel />}
        {AGENTS.map(a => tab === a.id && <AgentPanel key={a.id} agent={a} auth={auth} profile={profile} />)}
      </main>
    </div>
  );
}

/* ---- Streaming analytics dashboard ---- */
// NOTE: sample data. Real Spotify/Apple numbers require connecting those accounts
// via their official APIs on the backend (OAuth) — the connect buttons are the hooks.
const STREAM_MONTHS = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];
const STREAM_VALUES = [18200, 21400, 19800, 28600, 34100, 42800];
const TOP_TRACKS = [
  { title: "Wildfire", streams: 184200, pct: 100 },
  { title: "Slow Burn", streams: 121800, pct: 66 },
  { title: "Coastline", streams: 98400, pct: 53 },
  { title: "Paper Hearts", streams: 64100, pct: 35 },
  { title: "Lantern", streams: 41900, pct: 23 },
];
const CONNECT_PLATFORMS = [
  { name: "Spotify", color: "#1DB954" },
  { name: "Apple Music", color: "#fa2d48" },
  { name: "YouTube Music", color: "#ff0000" },
  { name: "Other", color: C.soft },
];
const PLATFORMS = [
  { name: "Spotify", pct: 58, color: "#1DB954", connected: true },
  { name: "Apple Music", pct: 24, color: "#fa2d48", connected: false },
  { name: "YouTube Music", pct: 11, color: "#ff0000", connected: false },
  { name: "Other", pct: 7, color: C.soft, connected: false },
];

function MiniLineChart({ values, labels, color }) {
  const w = 520, h = 160, pad = 28;
  const max = Math.max(...values) * 1.1, min = Math.min(...values) * 0.85;
  const x = i => pad + (i * (w - pad * 2)) / (values.length - 1);
  const y = v => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `${pad},${h - pad} ${pts} ${x(values.length - 1)},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="streamfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#streamfill)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill={color} />)}
      {labels.map((l, i) => (
        <text key={l} x={x(i)} y={h - 8} fontSize="11" fill={C.soft} textAnchor="middle" fontFamily="Inter">{l}</text>
      ))}
    </svg>
  );
}

function StreamsPanel({ profile, auth }) {
  const [connected, setConnected] = useState({ Spotify: true, "Apple Music": false, "YouTube Music": false, Other: false });
  const [data, setData] = useState({ months: STREAM_MONTHS, streams: STREAM_VALUES, topTracks: TOP_TRACKS, platforms: PLATFORMS, sample: true });

  // In live mode, pull real (or backend-sample) stats from the API.
  useEffect(() => {
    if (api.live() && auth?.token) {
      api.streams(auth.token).then(d => {
        setData({
          months: d.months || STREAM_MONTHS,
          streams: d.streams || STREAM_VALUES,
          topTracks: (d.topTracks || TOP_TRACKS).map(t => ({ ...t, pct: 100 })),
          platforms: (d.platforms || PLATFORMS).map(p => ({ ...p, color: (PLATFORMS.find(x => x.name === p.name) || {}).color || C.soft })),
          sample: d.sample,
        });
      }).catch(() => {});
    }
  }, [auth]);

  const SV = data.streams;
  const total = SV.reduce((a, b) => a + b, 0);
  const lastMo = SV[SV.length - 1];
  const prevMo = SV[SV.length - 2];
  const growth = (((lastMo - prevMo) / prevMo) * 100).toFixed(0);
  const maxTrack = Math.max(...data.topTracks.map(t => t.streams));
  const kpis = [
    { l: "Streams (6 mo)", v: total.toLocaleString(), c: C.teal },
    { l: "This month", v: lastMo.toLocaleString(), c: C.rust },
    { l: "Mo/mo growth", v: `+${growth}%`, c: C.sage },
    { l: "Monthly listeners", v: "42.8k", c: C.plum },
  ];
  return (
    <div className="rise">
      <PageTitle title={profile?.name ? `${profile.name} — streams` : "Streams"}
        sub="Your streaming performance across platforms." />

      <div style={{ ...card, marginBottom: 18, display: "flex", gap: 10, alignItems: "center",
        background: "#fdf0e4", borderColor: C.clay, fontSize: 13 }}>
        <BarChart3 size={18} color={C.rust} />
        <span style={{ flex: 1 }}>Showing <strong>sample data</strong>. Connect your accounts to see real numbers — Nora and June will use them automatically.</span>
      </div>

      {/* Connect buttons */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        {CONNECT_PLATFORMS.map(p => (
          <button key={p.name} onClick={() => setConnected(c => ({ ...c, [p.name]: !c[p.name] }))}
            style={{ ...btn(connected[p.name] ? p.color : "transparent"), fontSize: 14 }}>
            {connected[p.name] ? <Check size={16} /> : <Link2 size={16} />}
            {connected[p.name]
              ? (p.name === "Other" ? "Other connected" : `${p.name} connected`)
              : (p.name === "Other" ? "Connect other (Tidal, Deezer…)" : `Connect ${p.name}`)}
          </button>
        ))}
      </div>

      {/* Connected-platforms status widget */}
      <div style={{ ...card, marginBottom: 18, padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            Connected platforms
            <span style={{ color: C.soft, fontWeight: 400, marginLeft: 8 }}>
              {CONNECT_PLATFORMS.filter(p => connected[p.name]).length} of {CONNECT_PLATFORMS.length}
            </span>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {CONNECT_PLATFORMS.map(p => (
              <span key={p.name} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13,
                color: connected[p.name] ? C.ink : C.soft }}>
                <span style={{ width: 9, height: 9, borderRadius: 9, flexShrink: 0,
                  background: connected[p.name] ? p.color : "transparent",
                  border: connected[p.name] ? "none" : `1.5px solid ${C.line}` }} />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 18 }}>
        {kpis.map(k => (
          <div key={k.l} style={card}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, color: k.c }}>{k.v}</div>
            <div style={{ color: C.soft, fontSize: 13 }}>{k.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 18 }}>
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Streams over time</div>
          <MiniLineChart values={SV} labels={data.months} color={C.teal} />
        </div>
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 14 }}>By platform</div>
          {data.platforms.map(p => (
            <div key={p.name} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 9, background: p.color }} /> {p.name}
                </span>
                <span style={{ color: C.soft }}>{p.pct}%</span>
              </div>
              <div style={{ height: 7, background: C.line, borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: `${p.pct}%`, height: "100%", background: p.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>Top tracks</div>
        {data.topTracks.map((t, i) => (
          <div key={t.title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0",
            borderTop: i ? `1px solid ${C.line}` : "none" }}>
            <span style={{ color: C.soft, fontFamily: FONT_DISPLAY, width: 18 }}>{i + 1}</span>
            <Music size={15} color={C.teal} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{t.title}</span>
            <div style={{ width: 120, height: 6, background: C.line, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ width: `${Math.round((t.streams / maxTrack) * 100)}%`, height: "100%", background: C.teal }} />
            </div>
            <span style={{ color: C.soft, fontSize: 13, width: 70, textAlign: "right" }}>{t.streams.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Artist profile = the memory every agent uses ---- */
function profileToContext(p) {
  if (!p) return "";
  const parts = [];
  if (p.name) parts.push(`Artist/act name: ${p.name}`);
  if (p.genre) parts.push(`Genre/style: ${p.genre}`);
  if (p.stage) parts.push(`Career stage: ${p.stage}`);
  if (p.voice) parts.push(`Brand voice/personality: ${p.voice}`);
  if (p.goals) parts.push(`Current goals: ${p.goals}`);
  if (p.audience) parts.push(`Audience: ${p.audience}`);
  if (p.recent) parts.push(`Recent releases/context: ${p.recent}`);
  if (!parts.length) return "";
  return `\n\nHere is the artist's profile — use it to personalize everything:\n${parts.join("\n")}`;
}

function ProfilePanel({ profile, onSave }) {
  const [f, setF] = useState(profile || { name: "", genre: "", stage: "", voice: "", goals: "", audience: "", recent: "", photo: "" });
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setSaved(false); };

  function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { alert("Please choose an image under 4MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setF(prev => ({ ...prev, photo: reader.result })); setSaved(false); };
    reader.readAsDataURL(file);
  }

  const fields = [
    ["name", "Artist / act name", "e.g. The Hold Tights"],
    ["genre", "Genre & style", "e.g. indie rock with shoegaze textures"],
    ["stage", "Career stage", "e.g. ~5k monthly listeners, first headline tour soon"],
    ["voice", "Brand voice / personality", "e.g. warm, a little wry, never corporate"],
    ["goals", "Current goals", "e.g. grow to 25k listeners, land a sync placement"],
    ["audience", "Who's your audience?", "e.g. 18–30, college towns, vinyl buyers"],
    ["recent", "Recent releases / context", "e.g. dropped an EP in March, prepping a single"],
  ];
  return (
    <div className="rise">
      <PageTitle title="Artist profile" sub="Fill this once. Every agent uses it to personalize their work — this is your studio's memory." />
      <div style={{ ...card, maxWidth: 680 }}>
        {/* Headshot / artist photo */}
        <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 18 }}>
          <div onClick={() => fileRef.current?.click()}
            style={{ width: 92, height: 92, borderRadius: "50%", cursor: "pointer", flexShrink: 0,
              background: f.photo ? `center/cover url(${f.photo})` : `linear-gradient(135deg, ${C.rust}, ${C.plum})`,
              display: "grid", placeItems: "center", border: `2px solid ${C.line}`, overflow: "hidden" }}>
            {!f.photo && <UserCircle size={40} color="#fff" />}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Artist photo / headshot</div>
            <div style={{ color: C.soft, fontSize: 13, margin: "2px 0 8px" }}>Used on your EPK and smart link. Square images look best.</div>
            <button onClick={() => fileRef.current?.click()} style={{ ...btn("transparent"), fontSize: 13, padding: "8px 14px" }}>
              {f.photo ? "Change photo" : "Upload photo"}
            </button>
            {f.photo && (
              <button onClick={() => { setF(prev => ({ ...prev, photo: "" })); setSaved(false); }}
                style={{ ...btn("transparent"), fontSize: 13, padding: "8px 14px", marginLeft: 8, color: C.soft }}>
                Remove
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
          </div>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          {fields.map(([k, label, ph]) => (
            <div key={k}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.ink, display: "block", marginBottom: 5 }}>{label}</label>
              {k === "voice" || k === "recent" || k === "goals"
                ? <textarea value={f[k]} onChange={set(k)} placeholder={ph} rows={2} style={{ ...inp, resize: "vertical" }} />
                : <input value={f[k]} onChange={set(k)} placeholder={ph} style={inp} />}
            </div>
          ))}
          <button onClick={() => { onSave(f); setSaved(true); }}
            style={{ ...btn(C.rust), justifyContent: "center" }}>
            {saved ? <><Check size={16} /> Saved — agents will use this</> : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Release Campaign = one brief, fanned out to multiple agents ---- */
const CAMPAIGN_STEPS = [
  { id: "anr", label: "Nora", sub: "Rollout strategy", icon: Disc3, color: C.rust,
    prompt: (brief) => `Create a focused release rollout strategy for this: ${brief}. Give a clear week-by-week plan.` },
  { id: "social", label: "Mia", sub: "Social plan + captions", icon: Megaphone, color: C.plum,
    prompt: (brief) => `Plan the social rollout for this release and write 3 ready-to-post captions: ${brief}` },
  { id: "blog", label: "Remy", sub: "Press release", icon: PenLine, color: C.sage,
    prompt: (brief) => `Write a short press release and a one-paragraph playlist pitch for this release: ${brief}` },
  { id: "image", label: "Iris", sub: "Cover concept", icon: ImageIcon, color: C.clay,
    prompt: (brief) => `Design a single cover that fits this release: ${brief}` },
];

function CampaignPanel({ auth, profile, onSetup }) {
  const [brief, setBrief] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState({}); // id -> {status, text, svg}

  async function run() {
    const b = brief.trim();
    if (!b || running) return;
    setRunning(true);
    setResults(Object.fromEntries(CAMPAIGN_STEPS.map(s => [s.id, { status: "pending" }])));
    const ctx = profileToContext(profile);
    // Fan the one brief out to each agent in sequence.
    for (const step of CAMPAIGN_STEPS) {
      setResults(r => ({ ...r, [step.id]: { status: "running" } }));
      try {
        const system = (AGENT_SYSTEMS[step.id] || "") + ctx;
        const baseMsg = [{ role: "user", content: step.prompt(b) }];
        const messages = ctx
          ? [{ role: "user", content: `(Context about me:${ctx})` },
             { role: "assistant", content: "Understood." }, ...baseMsg]
          : baseMsg;
        if (api.live()) {
          const data = await api.chat(auth.token, step.id, messages);
          setResults(r => ({ ...r, [step.id]: { status: "done", text: data.text, svg: data.svg } }));
        } else {
          const raw = await directCall(system, baseMsg);
          if (step.id === "image") {
            const svg = (raw.match(/<svg[\s\S]*<\/svg>/i) || [])[0];
            setResults(r => ({ ...r, [step.id]: { status: "done", svg, text: svg ? "" : raw } }));
          } else {
            setResults(r => ({ ...r, [step.id]: { status: "done", text: raw } }));
          }
        }
      } catch (e) {
        setResults(r => ({ ...r, [step.id]: { status: "error", text: e.message } }));
      }
    }
    setRunning(false);
  }

  return (
    <div className="rise">
      <PageTitle title="Release Campaign" sub="Describe your release once. Your team builds the whole rollout together." />
      {!profile && (
        <div style={{ ...card, marginBottom: 16, display: "flex", gap: 12, alignItems: "center", borderColor: C.clay, background: "#fdf0e4" }}>
          <UserCircle size={20} color={C.rust} />
          <div style={{ flex: 1, fontSize: 14 }}>Set up your artist profile first so the campaign sounds like you.</div>
          <button onClick={onSetup} style={btn(C.rust)}>Set up profile</button>
        </div>
      )}
      <div style={{ ...card, marginBottom: 18 }}>
        <textarea value={brief} onChange={e => setBrief(e.target.value)} rows={3}
          placeholder='Describe the release — e.g. "New single \"Wildfire,\" upbeat indie-rock, out June 20, themes of starting over. Lead single off the fall EP."'
          style={{ ...inp, resize: "vertical" }} />
        <button onClick={run} disabled={running} style={{ ...btn(C.rust), marginTop: 12, opacity: running ? .6 : 1 }}>
          {running ? <><Loader2 size={16} className="spin" /> Building campaign…</> : <><Rocket size={16} /> Launch campaign</>}
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
        {CAMPAIGN_STEPS.map(s => {
          const r = results[s.id];
          return (
            <div key={s.id} style={{ ...card, borderColor: r?.status === "done" ? `${s.color}66` : C.line }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.color}18`,
                  border: `1px solid ${s.color}40`, display: "grid", placeItems: "center" }}>
                  <s.icon size={17} color={s.color} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.label}</div>
                  <div style={{ color: C.soft, fontSize: 11, textTransform: "uppercase", letterSpacing: .4 }}>{s.sub}</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 12, color: C.soft }}>
                  {r?.status === "running" && <Loader2 size={14} className="spin" />}
                  {r?.status === "pending" && "queued"}
                  {r?.status === "done" && <Check size={15} color={s.color} />}
                  {r?.status === "error" && "error"}
                </span>
              </div>
              {r?.svg && (
                <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.line}`, width: "100%", aspectRatio: "1", background: "#fff", marginBottom: 8 }}
                  dangerouslySetInnerHTML={{ __html: r.svg.replace(/<svg/, '<svg width="100%" height="100%"') }} />
              )}
              {r?.text && <div style={{ fontSize: 13, lineHeight: 1.55, color: C.ink, whiteSpace: "pre-wrap" }}>{r.text}</div>}
              {!r && <div style={{ fontSize: 13, color: C.soft }}>Will draft when you launch.</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}


function Overview({ onJump, profile }) {
  const kpis = [
    { l: "Monthly listeners", v: "42.8k", d: "+14% mo", icon: Headphones, c: C.rust },
    { l: "Shows booked", v: "9", d: "+3 this mo", icon: Calendar, c: C.teal },
    { l: "Royalties tracked", v: "$6.2k", d: "+8% mo", icon: DollarSign, c: C.gold },
    { l: "Active agents", v: "8 / 8", d: "all online", icon: Activity, c: C.plum },
  ];
  return (
    <div className="rise">
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 22 }}>
        {profile?.photo && (
          <div style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
            background: `center/cover url(${profile.photo})`, border: `2px solid ${C.line}` }} />
        )}
        <div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, margin: 0, fontWeight: 600 }}>
            {profile?.name ? `Welcome back, ${profile.name}` : "Studio overview"}
          </h2>
          <p style={{ color: C.soft, margin: "4px 0 0" }}>Everything your team worked on this week.</p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
        {kpis.map(k => (
          <div key={k.l} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <k.icon size={20} color={k.c} />
              <span style={{ color: k.c, fontSize: 12, fontWeight: 600 }}>{k.d}</span>
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, marginTop: 10, fontWeight: 600 }}>{k.v}</div>
            <div style={{ color: C.soft, fontSize: 13 }}>{k.l}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontFamily: FONT_DISPLAY, marginTop: 30, marginBottom: 14, fontWeight: 600 }}>Your studio</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
        {AGENTS.map(a => (
          <button key={a.id} onClick={() => onJump(a.id)} className="lift"
            style={{ ...card, cursor: "pointer", textAlign: "left" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${a.color}18`,
                border: `1px solid ${a.color}40`, display: "grid", placeItems: "center" }}>
                <a.icon size={20} color={a.color} />
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{a.name}</div>
                <div style={{ color: a.color, fontSize: 11, textTransform: "uppercase", letterSpacing: .4 }}>{a.role}</div>
              </div>
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.sage }}>
                <span style={{ width: 7, height: 7, borderRadius: 9, background: C.sage, animation: "blink 1.6s infinite" }} /> live
              </span>
            </div>
            <p style={{ color: C.soft, fontSize: 13, lineHeight: 1.5, marginTop: 12 }}>{a.sample}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================ ARTIST TOOLS ============================ */
const TOOLS = [
  { id: "epk", name: "EPK Generator", icon: FileText, color: C.rust,
    desc: "A polished one-page electronic press kit from your profile + streams.",
    cta: "Generate my EPK", input: false,
    prompt: (p, s, x) => `Write a professional one-page EPK (electronic press kit) for this artist. Include: a compelling 100-word bio, key stats, notable tracks, and a short pitch to bookers/press. Format with clear sections.${p}${s}` },
  { id: "smartlink", name: "Smart Link Page", icon: LinkIcon, color: C.teal,
    desc: "A 'listen everywhere' landing page for a release — replaces Linktree/Linkfire.",
    cta: "Build smart link", input: true, placeholder: "Release name + the platforms/links (Spotify, Apple, etc.)",
    builder: true },
  { id: "checklist", name: "Release Checklist", icon: ListChecks, color: C.sage,
    desc: "An auto-timed countdown of everything to do before a release date.",
    cta: "Build my checklist", input: true, placeholder: "Release name + release date (e.g. 'Wildfire, June 20')",
    prompt: (p, s, x) => `Create a release checklist and countdown timeline working backwards from the release date for: ${x}. Group tasks by timeframe (6 weeks out, 4 weeks, 2 weeks, 1 week, release day, after). Be specific and music-industry-savvy.${p}` },
  { id: "lyrics", name: "Lyric & Songwriting", icon: PenTool, color: C.plum,
    desc: "Rhymes, synonyms, hook ideas, and a cure for writer's block.",
    cta: "Open the writing room", input: true, placeholder: "What are you working on? (a line, a theme, a stuck spot…)",
    prompt: (p, s, x) => `You are a songwriting collaborator. Help with this: ${x}. Offer rhyme options, alternate lines, hook ideas, or imagery as fits. Keep the artist's voice.${p}` },
  { id: "templates", name: "Outreach Templates", icon: Inbox, color: C.clay,
    desc: "Ready-to-edit messages for curators, blogs, venues, and collabs.",
    cta: "Get templates", input: true, placeholder: "Who are you reaching out to? (playlist curator, blog, venue, producer…)",
    prompt: (p, s, x) => `Write 3 short, editable outreach message templates for a musician contacting: ${x}. Make them warm, specific, and non-spammy, with clear placeholders in [brackets].${p}` },
  { id: "grants", name: "Grants & Opportunities", icon: Award, color: C.gold,
    desc: "Find music grants, sync briefs, and submission deadlines to chase.",
    cta: "Find opportunities", input: true, placeholder: "Your country/region + genre (helps target real opportunities)",
    prompt: (p, s, x) => `Suggest types of music grants, funding programs, sync/licensing briefs, and competitions a musician in this situation should pursue: ${x}. Explain what each is, who qualifies, and how to find current openings. Note that the artist should verify current deadlines.${p}` },
  { id: "newsletter", name: "Fan Newsletter", icon: MailIcon, color: C.rust,
    desc: "Drafts release announcements and tour newsletters for your fans.",
    cta: "Write a newsletter", input: true, placeholder: "What's the news? (new single, tour dates, behind-the-scenes…)",
    prompt: (p, s, x) => `Write a warm, engaging fan newsletter/email about: ${x}. Include a subject line, a personal-feeling opening, the news, and a clear call to action. Match the artist's voice.${p}` },
  { id: "setlist", name: "Setlist & Show Day", icon: ListMusic, color: C.teal,
    desc: "Builds set lists by energy/tempo and a day-of-show checklist.",
    cta: "Plan a show", input: true, placeholder: "Set length + your songs (or vibe) + venue type",
    prompt: (p, s, x) => `Build a suggested setlist ordered by energy/tempo flow, plus a day-of-show checklist (load-in, soundcheck, merch, etc.) for: ${x}.${p}${s}` },
];

function ToolsPanel({ auth, profile, streams }) {
  const [open, setOpen] = useState(null); // tool id

  if (open) {
    const tool = TOOLS.find(t => t.id === open);
    return <ToolView tool={tool} auth={auth} profile={profile} streams={streams} onBack={() => setOpen(null)} />;
  }
  return (
    <div className="rise">
      <PageTitle title="Artist tools" sub="A growing toolkit to build and grow your career — all powered by your profile and stats." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 14 }}>
        {TOOLS.map(t => (
          <button key={t.id} onClick={() => setOpen(t.id)} className="lift"
            style={{ ...card, cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: `${t.color}18`,
              border: `1px solid ${t.color}40`, display: "grid", placeItems: "center" }}>
              <t.icon size={20} color={t.color} />
            </div>
            <div style={{ fontWeight: 700, marginTop: 12 }}>{t.name}</div>
            <p style={{ color: C.soft, fontSize: 13, lineHeight: 1.5, marginTop: 6 }}>{t.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// Builds a smart-link "listen everywhere" page preview from typed links.
function SmartLinkBuilder({ profile, input }) {
  // Parse "Platform: url" lines or bare urls.
  const lines = input.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  const links = lines.map(l => {
    const m = l.match(/(spotify|apple|youtube|tidal|soundcloud|bandcamp|amazon|deezer)/i);
    return { label: m ? m[1][0].toUpperCase() + m[1].slice(1) : "Listen", raw: l };
  });
  const title = lines[0] && !/https?:/.test(lines[0]) ? lines[0] : (profile?.name || "New Release");
  return (
    <div style={{ maxWidth: 360, margin: "0 auto", background: "#15110e", color: "#fff",
      borderRadius: 20, padding: 28, textAlign: "center", border: `1px solid ${C.line}` }}>
      <div style={{ width: 150, height: 150, borderRadius: 12, margin: "0 auto 16px", overflow: "hidden",
        background: profile?.photo ? `center/cover url(${profile.photo})` : `linear-gradient(135deg, ${C.rust}, ${C.plum})`,
        display: "grid", placeItems: "center" }}>
        {!profile?.photo && <Music size={48} color="#fff" />}
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>{title}</div>
      <div style={{ color: "#bbb", fontSize: 13, marginBottom: 18 }}>{profile?.name || "Your artist name"}</div>
      <div style={{ display: "grid", gap: 10 }}>
        {(links.length ? links : [{ label: "Spotify" }, { label: "Apple Music" }, { label: "YouTube" }]).map((l, i) => (
          <div key={i} style={{ background: "#241d18", borderRadius: 10, padding: "13px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14 }}>
            <span>{l.label}</span><span style={{ color: C.clay }}>Play ▸</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolView({ tool, auth, profile, streams, onBack }) {
  const [input, setInput] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [built, setBuilt] = useState(false);

  const pctx = profileToContext(profile);
  const sctx = streams ? `\n\nStreaming context: top tracks ${streams.topTracks.slice(0, 3).map(t => t.title).join(", ")}; recent monthly streams trending ${streams.streams[streams.streams.length - 1] > streams.streams[0] ? "up" : "down"}.` : "";

  async function run() {
    if (busy) return;
    if (tool.input && !input.trim()) return;
    if (tool.builder) { setBuilt(true); return; }
    setBusy(true); setOut("");
    try {
      const system = "You are an expert music-industry assistant helping an artist. Be practical, specific, and concise.";
      const userPrompt = tool.prompt(pctx, sctx, input.trim());
      if (api.live()) {
        const data = await api.chat(auth.token, "blog", [{ role: "user", content: system + "\n\n" + userPrompt }]);
        setOut(data.text || "…");
      } else {
        setOut(await directCall(system, [{ role: "user", content: userPrompt }]) || "…");
      }
    } catch (e) { setOut(`⚠️ ${e.message || "Something went wrong."}`); }
    finally { setBusy(false); }
  }

  return (
    <div className="rise">
      <button onClick={onBack} style={{ ...btn("transparent"), marginBottom: 14, fontSize: 13 }}>
        <ArrowLeft size={15} /> All tools
      </button>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: `${tool.color}18`,
          border: `1px solid ${tool.color}40`, display: "grid", placeItems: "center" }}>
          <tool.icon size={22} color={tool.color} />
        </div>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 23, fontWeight: 600 }}>{tool.name}</div>
          <div style={{ color: C.soft, fontSize: 13 }}>{tool.desc}</div>
        </div>
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        {tool.input && (
          <textarea value={input} onChange={e => { setInput(e.target.value); setBuilt(false); }} rows={3}
            placeholder={tool.placeholder} style={{ ...inp, resize: "vertical", marginBottom: 12 }} />
        )}
        <button onClick={run} disabled={busy} style={{ ...btn(tool.color), opacity: busy ? .6 : 1 }}>
          {busy ? <><Loader2 size={16} className="spin" /> Working…</> : <><tool.icon size={16} /> {tool.cta}</>}
        </button>
      </div>

      {tool.builder && built && (
        <div style={{ ...card }}>
          <div style={{ color: C.soft, fontSize: 13, marginBottom: 14 }}>Smart link preview — this is the page fans would see:</div>
          <SmartLinkBuilder profile={profile} input={input} />
        </div>
      )}
      {out && (
        <div style={{ ...card, whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 14 }}>{out}</div>
      )}
    </div>
  );
}

const AGENT_SYSTEMS = {
  anr: "You are Nora, an AI A&R and music career strategist. Advise artists on release strategy, audience growth, positioning, and honest creative direction. Be specific and practical. Be concise.",
  social: "You are Mia, an AI social media and fan-engagement manager for musicians. Plan release content, write captions in the artist's voice, and grow fan loyalty. Be punchy and concise.",
  booking: "You are Theo, an AI booking and gig-outreach agent. Find suitable venues/promoters, draft booking pitches, and help route tours sensibly. Be concise and practical.",
  legal: "You are Sol, an AI assistant for music royalties and contracts. Explain splits, royalties, and contract terms in plain language and flag risk. Always note you are not a substitute for a licensed music attorney. Be concise.",
  blog: "You are Remy, an AI writer for musicians. Draft press releases, artist bios, EPK copy, and playlist pitches in the artist's voice. Be polished and concise.",
  chat: "You are Cleo, a friendly 24/7 website chat widget for a musician or band. Answer fan questions (tour dates, releases, merch), handle venue and booking inquiries, capture contact info for leads, and escalate hot inquiries to the artist. Be warm, upbeat, and concise.",
  finance: "You are June, a financial literacy coach for musicians. Help with tour budgeting, understanding royalty and streaming income, planning for self-employment taxes, separating business and personal finances, and reading their numbers in plain English. Always note you are NOT a licensed financial advisor, accountant, or tax preparer, and recommend a qualified professional for filing, investment, or major decisions. Never give specific investment picks. Be practical and concise.",
  image: "You are Iris, an AI cover-art and promo image maker for musicians. You generate a single self-contained SVG image (viewBox 0 0 400 400) based on the description. Use gradients, shapes, and typography tastefully. Respond with ONLY the raw <svg>...</svg> markup, no backticks, no explanation.",
};

function AgentPanel({ agent, auth, profile }) {
  const [msgs, setMsgs] = useState([{ role: "assistant", text: agent.sample }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState(agent.model);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  // Persona + the artist profile (memory) so the agent personalizes its replies.
  const systemFor = (AGENT_SYSTEMS[agent.id] || "") + profileToContext(profile);

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    const next = [...msgs, { role: "user", text: q }];
    setMsgs(next); setInput(""); setBusy(true);
    const payload = next.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
    try {
      if (api.live()) {
        // Route through your backend (AI key stays server-side). Prepend profile
        // context so the server-side persona personalizes to this artist.
        const ctx = profileToContext(profile);
        const sent = ctx ? [{ role: "user", content: `(Context about me — keep in mind:${ctx})` },
                            { role: "assistant", content: "Got it — I'll keep your profile in mind." },
                            ...payload] : payload;
        const data = await api.chat(auth.token, agent.id, sent);
        setMsgs(m => [...m, agent.id === "image"
          ? (data.svg ? { role: "assistant", text: `Here's "${q}":`, svg: data.svg }
                       : { role: "assistant", text: "Couldn't render that one — try rephrasing." })
          : { role: "assistant", text: data.text || "…" }]);
      } else {
        // Preview fallback: direct demo call.
        const raw = await directCall(systemFor, payload);
        if (agent.id === "image") {
          const svg = (raw.match(/<svg[\s\S]*<\/svg>/i) || [])[0];
          setMsgs(m => [...m, svg ? { role: "assistant", text: `Here's "${q}":`, svg }
                                  : { role: "assistant", text: "Couldn't render that one — try rephrasing." }]);
        } else {
          setMsgs(m => [...m, { role: "assistant", text: raw || "…" }]);
        }
      }
    } catch (e) {
      setMsgs(m => [...m, { role: "assistant", text: `⚠️ ${e.message || "Connection issue — try again."}` }]);
    } finally { setBusy(false); }
  }

  return (
    <div className="rise" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 52px)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: `${agent.color}18`,
          border: `1px solid ${agent.color}40`, display: "grid", placeItems: "center" }}>
          <agent.icon size={22} color={agent.color} />
        </div>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 23, fontWeight: 600 }}>{agent.name}</div>
          <div style={{ color: agent.color, fontSize: 12, textTransform: "uppercase", letterSpacing: .4 }}>{agent.role}</div>
        </div>
        <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8,
          background: C.card, border: `1px solid ${C.line}`, padding: "8px 12px", borderRadius: 10 }}>
          <Cpu size={15} color={agent.color} />
          <span style={{ color: C.soft, fontSize: 12 }}>Model</span>
          <select value={model} onChange={e => setModel(e.target.value)}
            style={{ background: "transparent", color: C.ink, border: "none", outline: "none",
              fontFamily: FONT_BODY, fontSize: 13, cursor: "pointer" }}>
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.label} · {m.vendor}</option>)}
          </select>
        </label>
      </div>

      <div className="scroll" style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 6 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "78%" }}>
            <div style={{
              background: m.role === "user" ? agent.color : C.card,
              color: m.role === "user" ? "#fff" : C.ink,
              padding: "12px 15px", borderRadius: 14,
              borderTopRightRadius: m.role === "user" ? 4 : 14,
              borderTopLeftRadius: m.role === "user" ? 14 : 4,
              fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap",
              border: m.role === "user" ? "none" : `1px solid ${C.line}` }}>
              {m.text}
            </div>
            {m.svg && (
              <div style={{ marginTop: 8, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.line}`,
                width: 280, height: 280, background: "#fff" }}
                dangerouslySetInnerHTML={{ __html: m.svg.replace(/<svg/, '<svg width="280" height="280"') }} />
            )}
          </div>
        ))}
        {busy && <div style={{ color: C.soft, fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          <Mic2 size={15} color={agent.color} /> {agent.name} is {agent.id === "image" ? "creating" : "thinking"}…</div>}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder={agent.id === "image" ? "Describe cover art or a promo graphic…" : `Message ${agent.name}…`}
          style={{ flex: 1, background: C.card, border: `1px solid ${C.line}`, color: C.ink,
            padding: "13px 16px", borderRadius: 12, fontSize: 14, outline: "none", fontFamily: FONT_BODY }} />
        <button onClick={send} disabled={busy} style={{ ...btn(agent.color), opacity: busy ? .5 : 1 }}>
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}

function ReferralPanel() {
  const [copied, setCopied] = useState(false);
  const link = "https://anthem.fm/r/your-artist-9F2K";
  const rows = [
    ["The Hold Tights", "Artist", "Active", "$23.70/mo"],
    ["Velour Records", "Label", "Active", "$74.70/mo"],
    ["mae.wav", "Indie", "Trial", "—"],
  ];
  return (
    <div className="rise">
      <PageTitle title="Referrals" sub="Put other artists on — earn 30% recurring." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 22 }}>
        {[["Total earned", "$1,284", C.rust], ["Active referrals", "8", C.teal], ["Pending", "2", C.gold], ["Rewards pts", "1,600", C.plum]]
          .map(([l, v, c]) => (
            <div key={l} style={card}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, color: c, fontWeight: 600 }}>{v}</div>
              <div style={{ color: C.soft, fontSize: 13 }}>{l}</div>
            </div>
          ))}
      </div>
      <div style={{ ...card, marginBottom: 22 }}>
        <div style={{ color: C.soft, fontSize: 13, marginBottom: 8 }}>Your artist referral link</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <code style={{ flex: 1, minWidth: 240, background: C.paper, border: `1px solid ${C.line}`,
            padding: "12px 14px", borderRadius: 10, color: C.rust, fontSize: 13 }}>{link}</code>
          <button onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            style={btn(C.rust)}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy"}</button>
        </div>
      </div>
      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Your referrals</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ color: C.soft, textAlign: "left" }}>
              {["Artist / Label", "Plan", "Status", "Your commission"].map(h => <th key={h} style={{ padding: "8px 10px", fontWeight: 600 }}>{h}</th>)}
            </tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r[0]} style={{ borderTop: `1px solid ${C.line}` }}>
                {r.map((c, i) => <td key={i} style={{ padding: "12px 10px", color: i === 2 && c === "Active" ? C.sage : C.ink }}>{c}</td>)}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================ BITS ============================ */
const wrap = { maxWidth: 1120, margin: "0 auto", padding: "0 22px" };
const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 22 };
const pill = { display: "inline-flex", gap: 8, alignItems: "center", background: C.cream,
  border: `1px solid ${C.line}`, padding: "7px 14px", borderRadius: 30, fontSize: 13, color: C.soft };
const inp = { background: C.card, border: `1px solid ${C.line}`, color: C.ink,
  padding: "12px 14px", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: FONT_BODY, width: "100%" };

function btn(bg, big) {
  const solid = bg !== "transparent";
  return { display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
    background: solid ? bg : "transparent", color: solid ? "#fff" : C.ink,
    border: solid ? "none" : `1px solid ${C.line}`, fontWeight: 600, fontFamily: FONT_BODY,
    padding: big ? "15px 24px" : "11px 18px", borderRadius: 12, fontSize: big ? 16 : 14, textDecoration: "none" };
}
function Logo() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20 }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg,${C.rust},${C.clay})`,
        display: "grid", placeItems: "center" }}><Disc3 size={18} color="#fff" /></div>
      Anthem
    </div>
  );
}
function Stat({ n, l }) {
  return <div><span style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.ink, fontWeight: 600 }}>{n}</span> <span>{l}</span></div>;
}
function SectionHead({ kicker, title }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ color: C.rust, fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>{kicker}</div>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(28px,4vw,40px)", margin: "6px 0 0", fontWeight: 600 }}>{title}</h2>
    </div>
  );
}
function PageTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, margin: 0, fontWeight: 600 }}>{title}</h2>
      <p style={{ color: C.soft, margin: "4px 0 0" }}>{sub}</p>
    </div>
  );
}
