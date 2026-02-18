import React, { useState, useEffect } from 'react';
import { getSupabase } from '../services/cloud';
import { Loader2, LogIn, Lock, Mail, ShieldCheck, UserPlus, Ticket, AlertCircle, CheckSquare, Square } from 'lucide-react';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    
    // Remember Me State (defaults to true)
    const [rememberMe, setRememberMe] = useState(true);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
    const [msg, setMsg] = useState('');

    // Load preference on mount
    useEffect(() => {
        const pref = localStorage.getItem('remember_me');
        if (pref !== null) {
            setRememberMe(pref !== 'false');
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        const supabase = getSupabase();
        if (!supabase) {
            setError('Errore configurazione: Variabili d\'ambiente mancanti o client non inizializzato.');
            setLoading(false);
            return;
        }

        try {
            // 1. SAVE PREFERENCE
            // We save this so that next time the app loads (refresh/reopen), 
            // initSupabase picks the correct storage strategy.
            localStorage.setItem('remember_me', rememberMe ? 'true' : 'false');

            // 2. ATTEMPT LOGIN
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            
            if (error) {
                console.error("Login Error:", error);
                if (error.message.includes("Invalid login credentials")) {
                    setError("Email o password non corretti.");
                } else if (error.message.includes("Email not confirmed")) {
                    setError("Email non confermata. Controlla la tua casella di posta.");
                } else {
                    setError(error.message);
                }
            } else {
                // If success, user is redirected by AuthProvider detecting session change
            }
        } catch (err: any) {
            setError("Errore imprevisto: " + err.message);
        }
        setLoading(false);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        if (!inviteCode) {
            setError('Il codice invito è obbligatorio.');
            setLoading(false);
            return;
        }

        const supabase = getSupabase();
        if (!supabase) {
            setError('Errore di connessione al database.');
            setLoading(false);
            return;
        }

        // Pass invite_code in metadata. The DB Trigger will validate it.
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { 
                    full_name: fullName,
                    invite_code: inviteCode 
                }
            }
        });

        if (error) {
            setError(error.message);
        } else if (data.user) {
            if (data.session) {
                 setMsg('Registrazione completata! Benvenuto.');
                 window.location.reload();
            } else {
                 setMsg('Registrazione completata! Controlla la tua email per confermare.');
                 setMode('login');
            }
        }
        setLoading(false);
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        const supabase = getSupabase();
        if (!supabase) return;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
             redirectTo: window.location.origin,
        });

        if (error) setError(error.message);
        else setMsg('Controlla la tua email per il link di reset.');
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden px-4">
             <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
             
             <div className="w-full max-w-md p-8 glass-panel rounded-3xl z-10 border border-white/10 shadow-2xl">
                 <div className="text-center mb-8">
                     <h2 className="text-2xl font-bold text-white mb-2">Sales Performance OS</h2>
                     <p className="text-slate-400 text-sm">Accesso Team</p>
                 </div>

                 {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6 flex gap-3 items-start text-left">
                        <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                        <span className="text-red-200 text-xs font-medium leading-relaxed">{error}</span>
                    </div>
                 )}
                 
                 {msg && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl mb-6 text-emerald-400 text-xs font-bold text-center">
                        {msg}
                    </div>
                 )}

                 {mode === 'login' && (
                     <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-slate-500" size={18}/>
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="glass-input w-full pl-10 p-3 rounded-xl text-sm" placeholder="nome@azienda.com" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-slate-500" size={18}/>
                                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="glass-input w-full pl-10 p-3 rounded-xl text-sm" placeholder="••••••••" />
                            </div>
                        </div>

                        {/* REMEMBER ME CHECKBOX */}
                        <div className="py-2">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="relative mt-0.5">
                                    <input 
                                        type="checkbox" 
                                        className="peer sr-only" 
                                        checked={rememberMe}
                                        onChange={e => setRememberMe(e.target.checked)}
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center ${rememberMe ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-600 text-transparent group-hover:border-slate-500'}`}>
                                        <CheckSquare size={14} className={rememberMe ? 'block' : 'hidden'} />
                                    </div>
                                </div>
                                <div>
                                    <span className={`text-sm font-medium transition-colors ${rememberMe ? 'text-white' : 'text-slate-400'}`}>
                                        Ricordami su questo dispositivo
                                    </span>
                                    {!rememberMe && (
                                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5 animate-in fade-in">
                                            Se disattivato, al riavvio del browser dovrai accedere di nuovo.
                                        </p>
                                    )}
                                </div>
                            </label>
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20">
                            {loading ? <Loader2 className="animate-spin" size={18}/> : <LogIn size={18}/>} Accedi
                        </button>
                        <div className="flex justify-between items-center mt-4">
                            <button type="button" onClick={() => setMode('reset')} className="text-xs text-slate-500 hover:text-white transition-colors">Password dimenticata?</button>
                            <button type="button" onClick={() => setMode('register')} className="text-xs text-blue-400 hover:text-white font-bold transition-colors">Crea Account (Con Invito)</button>
                        </div>
                     </form>
                 )}

                 {mode === 'register' && (
                     <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in">
                        <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 mb-4">
                            <label className="text-[10px] font-bold text-blue-300 uppercase ml-1 mb-1 block">Codice Invito (Obbligatorio)</label>
                            <div className="relative">
                                <Ticket className="absolute left-3 top-3 text-blue-400" size={18}/>
                                <input 
                                    type="text" required value={inviteCode} onChange={e => setInviteCode(e.target.value)} 
                                    className="w-full bg-slate-900/50 border border-blue-500/30 rounded-lg pl-10 p-2.5 text-white focus:border-blue-400 outline-none font-mono tracking-wider" 
                                    placeholder="INV-XXXX-YYYY"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="glass-input w-full p-3 rounded-xl text-sm" placeholder="Mario Rossi" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email</label>
                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="glass-input w-full p-3 rounded-xl text-sm" placeholder="nome@azienda.com" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Password</label>
                            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="glass-input w-full p-3 rounded-xl text-sm" placeholder="••••••••" />
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all active:scale-95 shadow-lg shadow-emerald-900/20">
                            {loading ? <Loader2 className="animate-spin" size={18}/> : <UserPlus size={18}/>} Registrati
                        </button>
                        <div className="text-center mt-4">
                            <button type="button" onClick={() => setMode('login')} className="text-xs text-slate-500 hover:text-white transition-colors">Torna al Login</button>
                        </div>
                     </form>
                 )}

                 {mode === 'reset' && (
                     <form onSubmit={handleReset} className="space-y-4 animate-in fade-in">
                        <p className="text-xs text-slate-400 text-center mb-4">Inserisci email per reset password.</p>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="glass-input w-full p-3 rounded-xl text-sm" placeholder="nome@azienda.com" />
                        <button type="submit" disabled={loading} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" size={18}/> : <ShieldCheck size={18}/>} Invia Link
                        </button>
                        <button type="button" onClick={() => setMode('login')} className="w-full text-xs text-slate-500 hover:text-white mt-2">Annulla</button>
                     </form>
                 )}
             </div>
        </div>
    );
};