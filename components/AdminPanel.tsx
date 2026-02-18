import React, { useState, useEffect } from 'react';
import { getSupabase } from '../services/cloud';
import { registerUser } from '../services/admin';
import { Users, Trash2, Plus, Loader2, UserPlus, Shield, Key } from 'lucide-react';

export const AdminPanel: React.FC = () => {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    
    // New User Form
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'member'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const supabase = getSupabase();
        if (supabase) {
            const { data: prof } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
            if (prof) setProfiles(prof);
        }
        setLoading(false);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newUser.password.length < 6) {
            alert("La password deve essere di almeno 6 caratteri");
            return;
        }

        setActionLoading(true);
        try {
            await registerUser(newUser.email, newUser.password, newUser.fullName, newUser.role);
            alert(`Utente ${newUser.fullName} creato con successo!`);
            
            // Reset form
            setNewUser({ email: '', password: '', fullName: '', role: 'member' });
            // Refresh list
            loadData();
        } catch (err: any) {
            alert("Errore creazione: " + err.message);
        }
        setActionLoading(false);
    };

    return (
        <div className="max-w-6xl mx-auto pb-24 space-y-8 animate-in fade-in">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Shield className="text-red-500"/> Pannello Amministrazione
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* USER CREATION FORM */}
                <div className="glass-panel p-6 rounded-2xl border-t-4 border-blue-600">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <UserPlus size={18} className="text-blue-400"/> Registra Nuovo Utente
                    </h3>
                    
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-bold">Nome Completo</label>
                            <input 
                                required
                                type="text" 
                                className="glass-input w-full p-2 rounded-lg text-sm"
                                placeholder="Mario Rossi"
                                value={newUser.fullName}
                                onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-bold">Email</label>
                                <input 
                                    required
                                    type="email" 
                                    className="glass-input w-full p-2 rounded-lg text-sm"
                                    placeholder="email@azienda.com"
                                    value={newUser.email}
                                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-bold">Ruolo</label>
                                <select 
                                    className="glass-input w-full p-2 rounded-lg text-sm"
                                    value={newUser.role}
                                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                                >
                                    <option value="member">Collaboratore</option>
                                    <option value="leader">Leader / Coach</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                                <Key size={10}/> Password Provvisoria
                            </label>
                            <input 
                                required
                                type="text" 
                                className="glass-input w-full p-2 rounded-lg text-sm font-mono text-yellow-400"
                                placeholder="Minimo 6 caratteri"
                                value={newUser.password}
                                onChange={e => setNewUser({...newUser, password: e.target.value})}
                            />
                            <p className="text-[9px] text-slate-500 mt-1">L'utente potrà cambiarla successivamente (non ancora implementato) o usare questa.</p>
                        </div>

                        <button 
                            type="submit" 
                            disabled={actionLoading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                        >
                            {actionLoading ? <Loader2 className="animate-spin" size={18}/> : <Plus size={18}/>}
                            Crea Utente
                        </button>
                    </form>
                </div>

                {/* USER LIST */}
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Users size={18} className="text-emerald-400"/> Lista Utenti ({profiles.length})</h3>
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] text-slate-500 uppercase bg-slate-900/50 sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th className="p-2 rounded-l-lg">Nome</th>
                                    <th className="p-2">Ruolo</th>
                                    <th className="p-2 rounded-r-lg text-right">Stato</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {profiles.map(p => (
                                    <tr key={p.user_id} className="hover:bg-white/5">
                                        <td className="p-2 font-medium text-white">
                                            {p.full_name}
                                            <div className="text-[10px] text-slate-500">{p.email}</div>
                                        </td>
                                        <td className="p-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                p.role === 'admin' ? 'bg-red-500/10 text-red-400' : 
                                                p.role === 'leader' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'
                                            }`}>
                                                {p.role}
                                            </span>
                                        </td>
                                        <td className="p-2 text-right">
                                            <span className={p.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}>
                                                {p.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};