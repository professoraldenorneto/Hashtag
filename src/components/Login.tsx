import { useState } from 'react';
import { Hash, ShieldCheck, LogIn, AlertTriangle, UserPlus, Mail, Lock } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      toast.error("Configuração do Supabase ausente!");
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Erro ao fazer login com Google.");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Configuração do Supabase ausente!");
      return;
    }
    
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Cadastro realizado! Verifique seu e-mail se necessário.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Erro na autenticação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60" />

      <div className="w-full max-w-lg z-10">
        {!isSupabaseConfigured && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700 animate-pulse">
            <AlertTriangle size={24} />
            <p className="text-sm font-bold">Atenção: Configure as chaves do Supabase no painel de Segredos para ativar o sistema.</p>
          </div>
        )}
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-600 text-white rounded-3xl shadow-2xl mb-6 transform -rotate-3">
            <Hash size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">
            Hashtag<span className="text-indigo-600">Secure</span>
          </h1>
          <p className="text-slate-500 font-medium">
            {isSignUp ? 'Crie sua conta gratuita agora' : 'Acesse seu painel de avaliações'}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? 'Processando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-slate-500">
              {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
            </span>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 text-indigo-600 font-bold hover:underline"
            >
              {isSignUp ? 'Faça Login' : 'Cadastre-se'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
