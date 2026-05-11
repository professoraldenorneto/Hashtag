/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, UserRole } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Loader from './components/ui/Loader';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('uid', uid)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        throw error;
      }

      if (data) {
        setProfile(data as UserProfile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Erro ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Toaster position="top-right" />
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Login />
          </motion.div>
        ) : !profile ? (
          <motion.div
            key="role-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <RoleSelection user={user} onProfileCreated={setProfile} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Dashboard user={user} profile={profile} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoleSelection({ user, onProfileCreated }: { user: User, onProfileCreated: (p: UserProfile) => void }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState(user.user_metadata?.full_name || '');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateProfile = async () => {
    if (!role) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          uid: user.id,
          name: name,
          email: user.email || '',
          role: role,
        })
        .select()
        .single();

      if (error) throw error;

      onProfileCreated(data as UserProfile);
      toast.success(`Bem-vindo, ${name}!`);
    } catch (error) {
      console.error("Error creating profile:", error);
      toast.error("Erro ao criar perfil. Verifique as configurações do Supabase.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-indigo-100">
        <h2 className="text-3xl font-bold text-indigo-900 mb-2">Finalize seu Perfil</h2>
        <p className="text-slate-600 mb-8">Como você irá utilizar o Hashtag Secure?</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Seu nome"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setRole('teacher')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                role === 'teacher' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-100 hover:border-indigo-200 text-slate-600'
              }`}
            >
              <span className="text-2xl">👨‍🏫</span>
              <span className="font-semibold">Professor</span>
            </button>
            <button
              onClick={() => setRole('student')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                role === 'student' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-100 hover:border-indigo-200 text-slate-600'
              }`}
            >
              <span className="text-2xl">🎓</span>
              <span className="font-semibold">Estudante</span>
            </button>
          </div>

          <button
            onClick={handleCreateProfile}
            disabled={!role || !name || submitting}
            className="w-full mt-6 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? 'Salvando...' : 'Começar Agora'}
          </button>
        </div>
      </div>
    </div>
  );
}
