import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, HashtagToken, Subject } from '../types';
import { Hash, Search, CheckCircle2, History, Award, BookOpen, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function StudentDashboard({ user, profile }: { user: User, profile: UserProfile }) {
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [myHashtags, setMyHashtags] = useState<HashtagToken[]>([]);
  const [subjects, setSubjects] = useState<Record<string, string>>({}); // id -> name

  useEffect(() => {
    fetchSubjects();
    fetchMyHashtags();

    const subscription = supabase
      .channel('my_hashtags_channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'hashtags',
        filter: `redeemed_by=eq.${user.id}`
      }, () => fetchMyHashtags())
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user.id]);

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name');
    
    if (!error && data) {
      const subMap: Record<string, string> = {};
      data.forEach(s => subMap[s.id] = s.name);
      setSubjects(subMap);
    }
  };

  const fetchMyHashtags = async () => {
    const { data, error } = await supabase
      .from('hashtags')
      .select('*')
      .eq('redeemed_by', user.id)
      .order('redeemed_at', { ascending: false });
    
    if (!error && data) {
      setMyHashtags(data as any[]);
    }
  };

  const handleRedeem = async () => {
    // Remove all whitespace and the '#' character
    const cleanCode = code.replace(/[#\s]/g, '').toUpperCase();
    if (!cleanCode) return;
    setRedeeming(true);
    
    try {
      console.log('Tentando resgatar código:', cleanCode);
      
      // First, try to find the hashtag by code regardless of redemption status to give better feedback
      const { data: hashtag, error: findError } = await supabase
        .from('hashtags')
        .select('*')
        .eq('code', cleanCode)
        .maybeSingle(); // Use maybeSingle to avoid 406/PGRST116 errors if possible
      
      if (findError) {
        console.error('Erro na busca:', findError);
        toast.error("Erro ao validar código no servidor.");
        setRedeeming(false);
        return;
      }

      if (!hashtag) {
        toast.error(`Hashtag "${cleanCode}" não encontrada.`);
        setRedeeming(false);
        return;
      }

      if (hashtag.is_redeemed) {
        if (hashtag.redeemed_by === user.id) {
          toast.error("Você já resgatou esta hashtag!");
        } else {
          toast.error("Este código já foi utilizado por outro aluno.");
        }
        setRedeeming(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('hashtags')
        .update({
          is_redeemed: true,
          redeemed_by: user.id,
          redeemed_at: new Date().toISOString()
        })
        .eq('id', hashtag.id);

      if (updateError) throw updateError;

      toast.success("Hashtag resgatada! Parabéns!");
      setCode('');
      fetchMyHashtags();
    } catch (error) {
      console.error("Redeem error:", error);
      toast.error("Erro ao resgatar. Tente novamente.");
    } finally {
      setRedeeming(false);
    }
  };

  const totalPoints = myHashtags.reduce((acc, h) => acc + (h.points || 0), 0);

  return (
    <div className="space-y-12">
      {/* Search / Redeem Section */}
      <section className="relative py-12 px-8 rounded-[3rem] bg-indigo-600 text-white overflow-hidden shadow-2xl shadow-indigo-200">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Hash size={240} />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-4xl font-black mb-4 tracking-tight">Resgate seu Token</h2>
          <p className="text-indigo-100 text-lg mb-8 font-medium">
            Digite o código secreto presente no verso da sua hashtag física para validar sua nota.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-300 group-focus-within:text-white transition-colors">
                <Hash size={24} />
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="EX: A1B2C3"
                className="w-full pl-12 pr-4 py-5 bg-white/10 backdrop-blur-md rounded-2xl border-2 border-white/20 focus:border-white focus:bg-white/20 outline-none text-2xl font-black placeholder:text-white/40 tracking-widest transition-all"
              />
            </div>
            <button
              onClick={handleRedeem}
              disabled={!code || redeeming}
              className="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-black text-xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 shadow-xl"
            >
              {redeeming ? 'Validando...' : 'Resgatar'}
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile / Stats */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-100">
                {profile.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{profile.name}</h3>
                <p className="text-sm font-medium text-slate-500">Estudante Dedicado</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                    <Star size={20} fill="currentColor" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Total de Pontos</span>
                </div>
                <span className="text-2xl font-black text-slate-900">{totalPoints}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Tokens Validados</span>
                </div>
                <span className="text-2xl font-black text-slate-900">{myHashtags.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <History className="text-indigo-600" /> Seu Histórico
            </h3>
          </div>

          <div className="space-y-4">
            {myHashtags.map((h, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={h.id}
                className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-all hover:border-indigo-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                    #{h.code}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight">{h.activity_name}</h4>
                    <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mt-1">
                      <BookOpen size={12} /> {subjects[h.subject_id] || 'Matéria Desconhecida'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-slate-900">+{h.points} pts</div>
                  <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Validado</div>
                </div>
              </motion.div>
            ))}

            {myHashtags.length === 0 && (
              <div className="py-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <Award size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold">Nenhum token resgatado ainda.</p>
                <p className="text-slate-300 text-sm">Comece a praticar e ganhe suas primeiras hashtags!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
