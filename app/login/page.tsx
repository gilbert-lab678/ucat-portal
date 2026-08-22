'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles, Check, X, Eye, EyeOff, Loader2, Clock } from 'lucide-react';
import ConstellationGrid from "@/components/ui/constellation-grid";

import * as SupabaseLib from "@/lib/supabase";

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showApprovalPending, setShowApprovalPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const requestedMode = searchParams.get('mode');
    if (requestedMode === 'signup' || requestedMode === 'login') {
      setMode(requestedMode as AuthMode);
    }
  }, [searchParams]);

  const getSupabaseClient = () => {
    const rawExport = (SupabaseLib as any).supabase || (SupabaseLib as any).default || (SupabaseLib as any).supabaseClient || (SupabaseLib as any).createClient || SupabaseLib;
    if (typeof rawExport === 'function') return rawExport();
    return rawExport;
  };

  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 220, mass: 0.6 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage(null);
  };

  const passwordRules = {
    hasMinLength: formData.password.length >= 9,
    hasNumber: formData.password.split('').some(c => c >= '0' && c <= '9'),
    hasUppercase: formData.password.split('').some(c => c >= 'A' && c <= 'Z'),
    matchesConfirm: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const supabaseInstance = getSupabaseClient();
      if (mode === 'signup') {
        if (!Object.values(passwordRules).every(Boolean)) throw new Error('Password criteria unmet.');
        const { error } = await supabaseInstance.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { full_name: formData.name, role: 'student' } }
        });
        if (error) throw error;
        setShowApprovalPending(true);
      } else {
        const { error: signInError } = await supabaseInstance.auth.signInWithPassword({ email: formData.email, password: formData.password });
        if (signInError) throw signInError;
        const { data: { user } } = await supabaseInstance.auth.getUser();
        const role = user?.user_metadata?.role || 'student';
        const email = user?.email || '';
        if (role === 'admin' || email.includes('admin') || email === 'gilbert.yu8888@gmail.com') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) { setErrorMessage(err.message || 'Authentication error.'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { setShowPassword(false); setShowConfirmPassword(false); setErrorMessage(null); }, [mode]);
  useEffect(() => {
    let id: number;
    const run = () => { setRotationAngle(p => (p + 0.8) % 360); id = requestAnimationFrame(run); };
    id = requestAnimationFrame(run); return () => cancelAnimationFrame(id);
  }, []);

  const wrapClass = "relative flex items-center w-full bg-white/[0.02] border border-white/[0.08] focus-within:border-[#00eeff]/50 rounded-xl px-4 py-3 transition-all backdrop-blur-md";
  const inputClass = "w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none pl-3 pr-10";
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#030407] text-white font-sans px-4 perspective-[1000px]">
      <div className="absolute inset-0 z-0 w-full h-full"><ConstellationGrid /></div>
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#030407]/30 via-transparent to-[#030407]/75 pointer-events-none" />

      <motion.div
        ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative z-20 w-full max-w-md rounded-3xl p-[1.5px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.9)] hover:shadow-[0_32px_70px_rgba(0,238,255,0.12)] transition-shadow duration-500"
      >
        <div className="absolute inset-0 z-0 scale-[1.4]" style={{ background: `conic-gradient(from ${rotationAngle}deg, transparent 40%, #00eeff 50%, #0066ff 60%, transparent 70%)` }} />

        <div style={{ transform: "translateZ(20px)" }} className="relative z-10 w-full h-full bg-[#030407]/95 border border-white/[0.04] rounded-3xl p-8 backdrop-blur-3xl overflow-hidden min-h-[520px] flex flex-col justify-center">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-sky-500/10 rounded-full blur-[60px] pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {!showApprovalPending ? (
              <motion.div key="form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full">
                <div className="flex flex-col items-center mb-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400/20 to-blue-600/10 border border-sky-400/30 shadow-[0_0_15px_rgba(0,238,255,0.2)] mb-3">
                    <ShieldCheck className="w-5 h-5 text-[#00eeff]" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent mb-1">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                  <p className="text-xs text-zinc-400 text-center tracking-wide px-2">{mode === 'login' ? 'Access your premium adaptive practice workflow interface.' : 'Unlock full access to timed mock query sets.'}</p>
                </div>

                <div className="relative flex p-1 bg-black/40 border border-white/[0.04] rounded-full mb-5">
                  <div className="absolute inset-y-1 grid grid-cols-2 w-[calc(100%-8px)] pointer-events-none">
                    <motion.div className="w-full h-full bg-white/[0.06] border border-white/[0.08] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-2xl" animate={{ x: mode === 'login' ? '0%' : '100%' }} />
                  </div>
                  <button type="button" disabled={isLoading} onClick={() => setMode('login')} className={`relative z-10 w-full py-1.5 text-xs font-semibold tracking-wider rounded-full transition-colors ${mode === 'login' ? 'text-white' : 'text-zinc-500'}`}>LOG IN</button>
                  <button type="button" disabled={isLoading} onClick={() => setMode('signup')} className={`relative z-10 w-full py-1.5 text-xs font-semibold tracking-wider rounded-full transition-colors ${mode === 'signup' ? 'text-white' : 'text-zinc-500'}`}>SIGN UP</button>
                </div>

                {errorMessage && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-2.5 text-xs font-medium mb-4 text-center shadow-md">{errorMessage}</div>}
                <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                  {mode === 'signup' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 tracking-widest pl-1 uppercase">Full Name</label>
                      <div className={wrapClass}>
                        <User className="w-4 h-4 text-zinc-500" />
                        <input type="text" name="name" required disabled={isLoading} placeholder="Alex Mercer" value={formData.name} onChange={handleInputChange} className={inputClass} />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 tracking-widest pl-1 uppercase">Email Address</label>
                    <div className={wrapClass}>
                      <Mail className="w-4 h-4 text-zinc-500" />
                      <input type="email" name="email" required disabled={isLoading} placeholder="alex@portal.edu" value={formData.email} onChange={handleInputChange} className={inputClass} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">Password</label>
                      {mode === 'login' && <a href="#forgot" className="text-[11px] font-medium text-sky-400 hover:underline">Forgot?</a>}
                    </div>
                    <div className={wrapClass}>
                      <Lock className="w-4 h-4 text-zinc-500" />
                      <input type={showPassword ? "text" : "password"} name="password" required disabled={isLoading} placeholder="••••••••••••" value={formData.password} onChange={handleInputChange} className={inputClass} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-zinc-500 hover:text-zinc-300 p-1">
                        {showPassword ? <EyeOff className="w-4 h-4 text-[#00eeff]" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'signup' && formData.password.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 tracking-widest pl-1 uppercase">Confirm Password</label>
                      <div className={wrapClass}>
                        <Lock className="w-4 h-4 text-zinc-500" />
                        <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" required disabled={isLoading} placeholder="••••••••••••" value={formData.confirmPassword} onChange={handleInputChange} className={inputClass} />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 text-zinc-500 hover:text-zinc-300 p-1">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4 text-[#00eeff]" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {mode === 'signup' && formData.password.length > 0 && (
                    <div className="bg-black/30 border border-white/[0.03] rounded-xl p-3 space-y-1.5 mt-2 text-[11px]">
                      <p className="font-semibold text-zinc-400 mb-1">Security Criteria Compliance:</p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <div className={`flex items-center gap-1.5 ${passwordRules.hasMinLength ? 'text-[#00eeff]' : 'text-zinc-500'}`}>{passwordRules.hasMinLength ? <Check className="w-3 h-3 text-[#00eeff]" /> : <X className="w-3 h-3 text-zinc-600" />}<span>Min 9 chars</span></div>
                        <div className={`flex items-center gap-1.5 ${passwordRules.hasUppercase ? 'text-[#00eeff]' : 'text-zinc-500'}`}>{passwordRules.hasUppercase ? <Check className="w-3 h-3 text-[#00eeff]" /> : <X className="w-3 h-3 text-zinc-600" />}<span>Capital letter</span></div>
                        <div className={`flex items-center gap-1.5 ${passwordRules.hasNumber ? 'text-[#00eeff]' : 'text-zinc-500'}`}>{passwordRules.hasNumber ? <Check className="w-3 h-3 text-[#00eeff]" /> : <X className="w-3 h-3 text-zinc-600" />}<span>Numerical value</span></div>
                        <div className={`flex items-center gap-1.5 ${passwordRules.matchesConfirm ? 'text-[#00eeff]' : 'text-zinc-500'}`}>{passwordRules.matchesConfirm ? <Check className="w-3 h-3 text-[#00eeff]" /> : <X className="w-3 h-3 text-zinc-600" />}<span>Passwords match</span></div>
                      </div>
                    </div>
                  )}
                  <button type="submit" disabled={isLoading} className="w-full relative group flex items-center justify-center gap-2 mt-6 px-5 py-3 rounded-xl font-semibold text-sm bg-white text-black hover:bg-zinc-100 disabled:opacity-50 transition-all duration-300 shadow-[0_12px_30px_rgba(0,0,0,0.5)] overflow-hidden">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <><span>{mode === 'login' ? 'Authenticate Account' : 'Register Subscription'}</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="approval" initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 border border-[#00eeff]/30 shadow-[0_0_20px_rgba(0,238,255,0.2)] text-[#00eeff] mb-5 animate-pulse"><Clock className="w-7 h-7" /></div>
                <h3 className="text-xl font-bold text-white mb-2">Application Under Review</h3>
                <div className="space-y-3 max-w-xs mx-auto mb-6 text-xs">
                  <p className="text-zinc-300 leading-relaxed">Your institutional registration payload has been logged successfully.</p>
                  <p className="text-zinc-400 bg-white/[0.01] border border-white/[0.04] rounded-xl p-3 backdrop-blur-md">🔒 To preserve interface integrity, **your assigned portal tutor will review and approve access privileges shortly**.</p>
                </div>
                <button type="button" onClick={() => { setShowApprovalPending(false); setMode('login'); }} className="px-5 py-2 rounded-xl font-medium text-xs bg-white/[0.03] border border-white/[0.06] text-zinc-300 hover:text-white transition-all">Return to Sign In</button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center">
            <p className="text-[11px] text-zinc-500 inline-flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-sky-400" /> Secure high-fidelity institutional UCAT practice interface environment.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
