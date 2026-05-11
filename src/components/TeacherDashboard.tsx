import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, Subject, HashtagToken } from '../types';
import { 
  Plus, BookOpen, Hash, Users, Trash2, CheckCircle2, 
  ExternalLink, Download, PieChart, MoreVertical, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function TeacherDashboard({ user, profile }: { user: User, profile: UserProfile }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [hashtags, setHashtags] = useState<HashtagToken[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showAddHashtag, setShowAddHashtag] = useState(false);
  
  // Hashtag form state
  const [hashtagSubjectId, setHashtagSubjectId] = useState('');
  const [activityName, setActivityName] = useState('');
  const [points, setPoints] = useState(1);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchSubjects();
    fetchHashtags();

    // Set up real-time subscriptions
    const subjectsSubscription = supabase
      .channel('subjects_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, () => fetchSubjects())
      .subscribe();

    const hashtagsSubscription = supabase
      .channel('hashtags_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hashtags' }, () => fetchHashtags())
      .subscribe();

    return () => {
      subjectsSubscription.unsubscribe();
      hashtagsSubscription.unsubscribe();
    };
  }, [user.id]);

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('teacher_id', user.id);
    if (!error && data) setSubjects(data as Subject[]);
  };

  const fetchHashtags = async () => {
    const { data, error } = await supabase
      .from('hashtags')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setHashtags(data as any[]); // Cast to HashtagToken if needed, field names are identical
  };

  const handleAddSubject = async () => {
    if (!newSubjectName) return;
    try {
      const { error } = await supabase
        .from('subjects')
        .insert({
          name: newSubjectName,
          teacher_id: user.id
        });
      if (error) throw error;
      setNewSubjectName('');
      setShowAddSubject(false);
      toast.success("Matéria adicionada!");
    } catch (error) {
      toast.error("Erro ao adicionar matéria.");
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing O, 0, I, 1
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleAddHashtags = async () => {
    if (!hashtagSubjectId || !activityName) {
      toast.error("Preencha todos os campos");
      return;
    }
    
    try {
      const inserts = [];
      for (let i = 0; i < quantity; i++) {
        inserts.push({
          code: generateCode(),
          teacher_id: user.id,
          subject_id: hashtagSubjectId,
          activity_name: activityName,
          points,
          is_redeemed: false,
        });
      }
      
      const { error } = await supabase
        .from('hashtags')
        .insert(inserts);

      if (error) throw error;
      
      setShowAddHashtag(false);
      toast.success(`${quantity} hashtag(s) gerada(s)!`);
    } catch (error) {
      console.error("Error adding hashtags:", error);
      toast.error("Erro ao gerar hashtags.");
    }
  };

  const handleDeleteHashtag = async (id: string, is_redeemed: boolean) => {
    if (is_redeemed) {
      toast.error("Não é possível deletar uma hashtag já utilizada.");
      return;
    }
    if (confirm("Tem certeza que deseja remover esta hashtag?")) {
      try {
        const { error } = await supabase
          .from('hashtags')
          .delete()
          .eq('id', id);
        if (error) throw error;
        toast.success("Removida com sucesso.");
      } catch (error) {
        toast.error("Erro ao remover.");
      }
    }
  };

  const filteredHashtags = selectedSubject === 'all' 
    ? hashtags 
    : hashtags.filter(h => h.subject_id === selectedSubject);

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<BookOpen size={24} />} 
          label="Matérias" 
          value={subjects.length.toString()} 
          color="bg-blue-500" 
        />
        <StatCard 
          icon={<Hash size={24} />} 
          label="Hashtags Criadas" 
          value={hashtags.length.toString()} 
          color="bg-indigo-500" 
        />
        <StatCard 
          icon={<CheckCircle2 size={24} />} 
          label="Resgatadas" 
          value={hashtags.filter(h => h.is_redeemed).length.toString()} 
          color="bg-emerald-500" 
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar/Subjects */}
        <div className="w-full lg:w-72 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <BookOpen size={16} /> Suas Matérias
            </h3>
            <button 
              onClick={() => setShowAddSubject(true)}
              className="p-1 hover:bg-indigo-50 text-indigo-600 rounded-md transition-all"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setSelectedSubject('all')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedSubject === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-indigo-50'
              }`}
            >
              Todas as Hashtags
            </button>
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.id)}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedSubject === s.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-indigo-50'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* content Area */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Gerenciar Hashtags</h2>
              <p className="text-slate-500 text-sm">Crie e acompanhe o uso dos tokens de avaliação.</p>
            </div>
            <button
              onClick={() => setShowAddHashtag(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              <Plus size={20} /> Gerar Novo
            </button>
          </div>

          {/* Hashtag List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Código</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Atividade</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nota/Peso</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHashtags.map(h => (
                    <tr key={h.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          #{h.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{h.activity_name}</div>
                        <div className="text-xs text-slate-500">
                          {subjects.find(s => s.id === h.subject_id)?.name || 'Sem Matéria'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-700">{h.points} pts</span>
                      </td>
                      <td className="px-6 py-4">
                        {h.is_redeemed ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full w-fit">
                            <CheckCircle2 size={12} /> RESGATADA
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded-full w-fit">
                            <Plus size={12} /> DISPONÍVEL
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteHashtag(h.id, h.is_redeemed)}
                          disabled={h.is_redeemed}
                          className="p-2 text-slate-300 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredHashtags.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                        Nenhuma hashtag encontrada para este filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddSubject && (
          <Modal onClose={() => setShowAddSubject(false)} title="Nova Matéria">
            <div className="space-y-4">
              <input
                autoFocus
                type="text"
                placeholder="Ex: Física II, Matemática B"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <button
                onClick={handleAddSubject}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
              >
                Salvar Matéria
              </button>
            </div>
          </Modal>
        )}

        {showAddHashtag && (
          <Modal onClose={() => setShowAddHashtag(false)} title="Gerar Hashtags">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Matéria</label>
                <select
                  value={hashtagSubjectId}
                  onChange={(e) => setHashtagSubjectId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all"
                >
                  <option value="">Selecione a matéria</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nome da Atividade</label>
                <input
                  type="text"
                  placeholder="Ex: Exercícios de Gravitação"
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Pontos</label>
                  <input
                    type="number"
                    min="1"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
              <button
                onClick={handleAddHashtags}
                className="w-full mt-4 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                Gerar Tokens
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
      <div className={`p-4 rounded-xl text-white ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode, onClose: () => void, title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden"
      >
        <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-all p-1">
            <X size={24} />
          </button>
        </div>
        <div className="p-8">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
