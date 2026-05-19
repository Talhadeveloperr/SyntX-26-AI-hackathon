import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  motion, useMotionValue, useTransform, useSpring,
  AnimatePresence, useInView
} from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Brain, Zap, BookOpen, Target, FileText, TrendingUp, Sparkles,
  Clock, LogOut, User, ArrowRight, Star, Shield,
  BarChart3, GraduationCap, MessageSquare, Layers, Calendar,
  CheckCircle, Play, Menu, X, ChevronRight
} from 'lucide-react';

/* ── 3D Tilt Card ── */
function TiltCard({ children, style }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-6, 6]);
  const springCfg = { stiffness: 280, damping: 28 };
  const srX = useSpring(rotateX, springCfg);
  const srY = useSpring(rotateY, springCfg);

  function onMove(e) {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top)  / r.height - 0.5);
  }
  function onLeave() { x.set(0); y.set(0); }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: srX, rotateY: srY, transformPerspective: 1200, ...style }}
    >
      {children}
    </motion.div>
  );
}

/* ── Animated Number Counter ── */
function Counter({ target, suffix = '', decimals = 0 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  useEffect(() => {
    if (!inView) return;
    const steps = 60, dur = 1800;
    const inc = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setVal(target); clearInterval(t); }
      else setVal(decimals ? parseFloat(cur.toFixed(decimals)) : Math.floor(cur));
    }, dur / steps);
    return () => clearInterval(t);
  }, [inView, target, decimals]);

  return <span ref={ref}>{decimals ? val.toFixed(decimals) : val.toLocaleString()}{suffix}</span>;
}

/* ── Data ── */
const FEATURES = [
  { icon: MessageSquare, title: 'AI Smart Chat',     desc: 'Ask anything about your materials. Contextual answers with source citations from your own documents.', color: '#7c3aed', glow: 'rgba(124,58,237,0.25)',  tag: 'Smart',    route: '/smart-chat'     },
  { icon: Zap,           title: 'Quiz Generator',    desc: 'Adaptive quizzes auto-generated from your uploads. Instantly identify weak areas and fill knowledge gaps.', color: '#f59e0b', glow: 'rgba(245,158,11,0.25)', tag: 'Adaptive', route: '/quiz-generator' },
  { icon: Layers,        title: 'AI Flashcards',     desc: 'Spaced repetition flashcards built from your notes. Science-backed retention for long-term memory.',  color: '#22d3ee', glow: 'rgba(34,211,238,0.25)', tag: 'Retention', route: '/flashcards'     },
  { icon: Calendar,      title: 'Study Planner',     desc: 'AI-powered scheduling that adapts to deadlines, habits and performance trends over time.', color: '#34d399', glow: 'rgba(52,211,153,0.25)',  tag: 'Organized', route: '/study-planner'  },
  { icon: FileText,      title: 'Past Papers AI',    desc: 'Upload past papers and get predicted topics, question patterns and frequency heatmaps.', color: '#e879f9', glow: 'rgba(232,121,249,0.25)', tag: 'Predict',   route: '/past-papers'    },
  { icon: BarChart3,     title: 'Progress Analytics',desc: 'Track every session with heatmaps, streaks, and performance dashboards powered by AI insights.', color: '#fb923c', glow: 'rgba(251,146,60,0.25)',  tag: 'Track',     route: '/dashboard'      },
];

const STATS = [
  { target: 10,  suffix: 'K+',  label: 'Active Students',    icon: User,   color: '#7c3aed' },
  { target: 50,  suffix: 'K+',  label: 'Flashcards Created', icon: Layers, color: '#22d3ee' },
  { target: 99,  suffix: '%',   label: 'Uptime',             icon: Shield, color: '#34d399' },
  { target: 4.9, suffix: '',    label: 'Rating',             icon: Star,   color: '#f59e0b', decimals: 1 },
];

const STEPS = [
  { num: '01', title: 'Upload Your Materials', desc: 'PDFs, notes, past papers — just drag and drop into the platform.' },
  { num: '02', title: 'AI Processes Everything', desc: 'Our AI reads, indexes and understands your content in seconds.' },
  { num: '03', title: 'Study Smarter', desc: 'Get quizzes, flashcards, plans and chat answers — all from your materials.' },
];

/* ── Component ── */
export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } }
  };
  const item = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } }
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>

      {/* ── Fixed Background ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-pattern" />
      </div>

      {/* ── NAVBAR ── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'sticky', top: 0, zIndex: 100,
          padding: '0 clamp(16px, 4vw, 48px)', height: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(6, 6, 17, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(124, 58, 237, 0.12)',
        }}
      >
        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 18px rgba(124,58,237,0.45)',
              flexShrink: 0,
            }}
          >
            <Brain size={18} color="#fff" strokeWidth={2} />
          </motion.div>
          <span style={{
            fontSize: '16px', fontWeight: 800, color: 'var(--text-1)',
            letterSpacing: '-0.02em', fontFamily: 'Space Grotesk, sans-serif',
          }}>
            Brain<span style={{ background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Sync</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="d-none d-lg-flex">
          {['Features', 'How it Works', 'About'].map(link => (
            <button
              key={link}
              onClick={() => document.getElementById(link.toLowerCase().replace(/\s/g, '-'))?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'none', border: 'none', color: 'var(--text-2)',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                padding: '6px 14px', borderRadius: '8px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                transition: 'color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'none'; }}
            >
              {link}
            </button>
          ))}
        </div>

        {/* Auth Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user ? (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '8px 20px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              Dashboard <ChevronRight size={14} />
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login')}
                style={{
                  padding: '8px 16px', borderRadius: '10px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-2)', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  transition: 'all 0.2s',
                }}
                className="d-none d-sm-block"
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.color = 'var(--text-1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-2)'; }}
              >
                Sign In
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 8px 28px rgba(124,58,237,0.55)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/register')}
                style={{
                  padding: '8px 18px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                  border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  boxShadow: '0 4px 18px rgba(124,58,237,0.4)',
                }}
              >
                Get Started
              </motion.button>
            </>
          )}
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', zIndex: 1,
        minHeight: 'calc(100vh - 64px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(60px, 10vh, 100px) clamp(16px, 5vw, 48px) clamp(60px, 8vh, 80px)',
        textAlign: 'center',
      }}>
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          style={{ maxWidth: '820px', width: '100%' }}
        >
          {/* Badge */}
          <motion.div variants={item} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 16px', borderRadius: '999px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', marginBottom: '28px' }}>
            <Sparkles size={13} color="#a78bfa" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              AI-Powered Learning Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={item}
            style={{
              margin: '0 0 24px',
              fontSize: 'clamp(40px, 7.5vw, 84px)',
              fontWeight: 800,
              lineHeight: 1.06,
              letterSpacing: '-0.04em',
              fontFamily: 'Space Grotesk, sans-serif',
            }}
          >
            <span style={{ background: 'linear-gradient(135deg, #f0eeff 0%, #a78bfa 50%, #e879f9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Study Smarter
            </span>
            <br />
            <span style={{ color: 'var(--text-1)' }}>with Your AI</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, #22d3ee 0%, #7c3aed 70%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Study Partner
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={item}
            style={{ margin: '0 auto 44px', fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--text-2)', lineHeight: 1.75, maxWidth: '560px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Upload your materials. AI generates quizzes, flashcards and study plans.
            Get instant answers. Track your progress. All in one place.
          </motion.p>

          {/* CTA */}
          <motion.div variants={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 14px 44px rgba(124,58,237,0.65)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(user ? '/dashboard' : '/register')}
              style={{
                padding: '14px 34px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                border: 'none', color: '#fff',
                fontSize: '15px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 6px 28px rgba(124,58,237,0.45)',
              }}
            >
              {user ? 'Go to Dashboard' : 'Start Learning Free'} <ArrowRight size={16} />
            </motion.button>
            {!user && (
              <motion.button
                whileHover={{ scale: 1.03, background: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login')}
                style={{
                  padding: '14px 28px', borderRadius: '14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-1)', fontSize: '15px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Play size={15} fill="currentColor" /> Sign In
              </motion.button>
            )}
          </motion.div>

          {/* Trust */}
          <motion.p variants={item} style={{ margin: 0, fontSize: '13px', color: 'var(--text-3)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Trusted by <strong style={{ color: 'var(--text-2)' }}>10,000+</strong> students · Free forever · No credit card required
          </motion.p>
        </motion.div>

        {/* ── Dashboard Preview Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 70, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ marginTop: '72px', position: 'relative', width: '100%', maxWidth: '700px' }}
        >
          <TiltCard>
            <div className="hero-card">
              {/* Browser bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <div className="hero-dot" style={{ background: '#f87171' }} />
                <div className="hero-dot" style={{ background: '#f59e0b' }} />
                <div className="hero-dot" style={{ background: '#34d399' }} />
                <div style={{ flex: 1, height: '22px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', marginLeft: '8px', display: 'flex', alignItems: 'center', paddingLeft: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'JetBrains Mono, monospace' }}>app.aistudyos.com/dashboard</span>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {[
                  { label: 'Quiz Score',    value: '94%',    color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'  },
                  { label: 'Study Streak',  value: '14 days', color: '#a78bfa', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)'  },
                  { label: 'Cards Due',     value: '23',     color: '#22d3ee', bg: 'rgba(34,211,238,0.08)',  border: 'rgba(34,211,238,0.2)'  },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: '12px', padding: '14px', border: `1px solid ${s.border}` }}>
                    <div style={{ fontSize: 'clamp(16px, 2.5vw, 22px)', fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '3px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* AI insight row */}
              <div style={{ background: 'rgba(124,58,237,0.08)', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid rgba(124,58,237,0.18)', marginBottom: '14px' }}>
                <Brain size={16} color="#a78bfa" strokeWidth={2} />
                <span style={{ fontSize: '13px', color: 'var(--text-2)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  AI suggests focusing on <strong style={{ color: '#a78bfa' }}>Organic Chemistry</strong> today — 3 weak areas detected
                </span>
              </div>

              {/* Mini progress bars */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Mathematics', pct: 78, color: '#7c3aed' },
                  { label: 'Physics',     pct: 65, color: '#22d3ee' },
                ].map(p => (
                  <div key={p.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px 12px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{p.label}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: p.color }}>{p.pct}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p.pct}%` }}
                        transition={{ duration: 1.2, delay: 1.5, ease: 'easeOut' }}
                        style={{ height: '100%', background: p.color, borderRadius: '99px' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TiltCard>

          {/* Floating badges */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="float-badge float-badge-left"
          >
            <CheckCircle size={14} color="#34d399" />
            <span>Quiz Generated!</span>
          </motion.div>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
            className="float-badge float-badge-right"
          >
            <Sparkles size={14} color="#a78bfa" />
            <span>Flashcards Ready</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(40px, 6vw, 80px) clamp(16px, 5vw, 48px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
            {STATS.map(({ target, suffix, label, icon: Icon, color, decimals }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.03 }}
                style={{
                  background: 'rgba(12, 12, 30, 0.7)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '18px', padding: '28px 24px',
                  backdropFilter: 'blur(20px)',
                  textAlign: 'center',
                  cursor: 'default',
                  transition: 'border-color 0.3s',
                  position: 'relative', overflow: 'hidden',
                }}
                onHoverStart={e => {}}
              >
                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '80px', height: '80px', borderRadius: '50%', background: `${color}15`, filter: 'blur(20px)', pointerEvents: 'none' }} />
                <div style={{
                  width: '46px', height: '46px', borderRadius: '13px', margin: '0 auto 14px',
                  background: `${color}15`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color={color} strokeWidth={1.8} />
                </div>
                <div style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', fontFamily: 'Space Grotesk, sans-serif' }}>
                  <Counter target={target} suffix={suffix} decimals={decimals || 0} />
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '5px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: 'clamp(60px, 8vw, 100px) clamp(16px, 5vw, 48px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: '56px' }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '999px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Everything You Need</span>
            </div>
            <h2 style={{ margin: '0 0 16px', fontSize: 'clamp(26px, 4vw, 48px)', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', fontFamily: 'Space Grotesk, sans-serif' }}>
              Powerful tools for
              <span style={{ display: 'block', background: 'linear-gradient(135deg, #a78bfa, #e879f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>better learning</span>
            </h2>
            <p style={{ margin: 0, fontSize: 'clamp(14px, 1.8vw, 17px)', color: 'var(--text-2)', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
              Six integrated AI tools that work together to supercharge your study sessions
            </p>
          </motion.div>

          {/* Feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {FEATURES.map(({ icon: Icon, title, desc, color, glow, tag, route }, i) => (
              <TiltCard key={title}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  whileHover={{ y: -6 }}
                  onClick={() => user && navigate(route)}
                  style={{
                    background: 'rgba(12, 12, 30, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '22px', padding: '28px',
                    backdropFilter: 'blur(20px)',
                    cursor: user ? 'pointer' : 'default',
                    position: 'relative', overflow: 'hidden',
                    transition: 'border-color 0.3s, box-shadow 0.3s',
                    height: '100%',
                  }}
                  onHoverStart={e => {
                    const el = e.currentTarget;
                    if (el?.style) {
                      el.style.borderColor = `${color}35`;
                      el.style.boxShadow = `0 20px 60px ${glow}`;
                    }
                  }}
                  onHoverEnd={e => {
                    const el = e.currentTarget;
                    if (el?.style) {
                      el.style.borderColor = 'rgba(255,255,255,0.07)';
                      el.style.boxShadow = 'none';
                    }
                  }}
                >
                  {/* Corner glow */}
                  <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: glow, filter: 'blur(40px)', opacity: 0.5, pointerEvents: 'none' }} />

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={22} color={color} strokeWidth={1.8} />
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', color, textTransform: 'uppercase', background: `${color}12`, border: `1px solid ${color}25`, padding: '3px 9px', borderRadius: '999px' }}>
                        {tag}
                      </span>
                    </div>
                    <h3 style={{ margin: '0 0 10px', fontSize: '17px', fontWeight: 700, color: 'var(--text-1)', fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
                    <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.65 }}>{desc}</p>
                    {user && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color }}>
                        <span>Open</span><ChevronRight size={14} />
                      </div>
                    )}
                  </div>
                </motion.div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ position: 'relative', zIndex: 1, padding: 'clamp(60px, 8vw, 100px) clamp(16px, 5vw, 48px)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '56px' }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '999px', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#22d3ee', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Simple Process</span>
            </div>
            <h2 style={{ margin: '0 0 16px', fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', fontFamily: 'Space Grotesk, sans-serif' }}>
              Get started in<br />
              <span style={{ background: 'linear-gradient(135deg, #22d3ee, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>3 simple steps</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {STEPS.map(({ num, title, desc }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -4 }}
                style={{
                  background: 'rgba(12, 12, 30, 0.7)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '20px', padding: '28px 24px',
                  backdropFilter: 'blur(16px)',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: 'clamp(40px, 5vw, 56px)', fontWeight: 900, color: 'rgba(124,58,237,0.15)', letterSpacing: '-0.04em', fontFamily: 'Space Grotesk, sans-serif', marginBottom: '16px', lineHeight: 1 }}>{num}</div>
                <h3 style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: 700, color: 'var(--text-1)', fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.65 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOGGED-IN QUICK ACTIONS ── */}
      {user && (
        <section style={{ position: 'relative', zIndex: 1, padding: '0 clamp(16px, 5vw, 48px) clamp(60px, 8vw, 100px)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(232,121,249,0.08))',
                border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: '24px', padding: 'clamp(24px, 4vw, 40px)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <h3 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: 800, color: 'var(--text-1)', fontFamily: 'Space Grotesk, sans-serif' }}>
                Welcome back, <span style={{ background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{user.full_name?.split(' ')[0] || 'Student'}</span> 👋
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {[
                  { label: 'Smart Chat',     icon: MessageSquare, route: '/smart-chat',     color: '#7c3aed' },
                  { label: 'Quiz Generator', icon: Zap,           route: '/quiz-generator', color: '#f59e0b' },
                  { label: 'Flashcards',     icon: Layers,        route: '/flashcards',     color: '#22d3ee' },
                  { label: 'Study Planner',  icon: Calendar,      route: '/study-planner',  color: '#34d399' },
                ].map(({ label, icon: Icon, route, color }) => (
                  <motion.button
                    key={label}
                    whileHover={{ scale: 1.03, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(route)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '14px 16px', borderRadius: '14px',
                      background: `${color}10`, border: `1px solid ${color}25`,
                      color: 'var(--text-1)', fontSize: '14px', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Icon size={18} color={color} strokeWidth={2} />
                    {label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      {!user && (
        <section style={{ position: 'relative', zIndex: 1, padding: '0 clamp(16px, 5vw, 48px) clamp(80px, 10vw, 120px)' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.14), rgba(232,121,249,0.09))',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: '28px', padding: 'clamp(40px, 6vw, 72px) clamp(24px, 5vw, 56px)',
                backdropFilter: 'blur(20px)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(124,58,237,0.2)', filter: 'blur(70px)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(232,121,249,0.15)', filter: 'blur(60px)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <motion.div
                  animate={{ rotate: [0, 15, -10, 15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  style={{ fontSize: '44px', marginBottom: '20px', display: 'inline-block' }}
                >🚀</motion.div>
                <h2 style={{ margin: '0 0 16px', fontSize: 'clamp(24px, 4vw, 44px)', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', fontFamily: 'Space Grotesk, sans-serif' }}>
                  Ready to ace your exams?
                </h2>
                <p style={{ margin: '0 0 36px', fontSize: 'clamp(14px, 1.8vw, 17px)', color: 'var(--text-2)', lineHeight: 1.7 }}>
                  Join 10,000+ students who study smarter with AI.
                  Free forever — no credit card needed.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 16px 48px rgba(124,58,237,0.65)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/register')}
                  style={{
                    padding: '16px 44px', borderRadius: '14px',
                    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                    border: 'none', color: '#fff',
                    fontSize: '16px', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                    boxShadow: '0 8px 32px rgba(124,58,237,0.5)',
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                  }}
                >
                  Get Started for Free <ArrowRight size={18} />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(124,58,237,0.12)',
        padding: 'clamp(24px, 4vw, 40px) clamp(16px, 5vw, 48px)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={13} color="#fff" />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-2)', fontFamily: 'Space Grotesk, sans-serif' }}>AI Study OS</span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-4)' }}>
            © 2025 AI Study OS · Built for learners, powered by AI
          </p>
        </div>
      </footer>
    </div>
  );
}
