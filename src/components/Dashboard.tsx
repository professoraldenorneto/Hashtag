import { User } from '@supabase/supabase-js';
import { UserProfile } from '../types';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import { LogOut, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Dashboard({ user, profile }: { user: User, profile: UserProfile }) {
  const handleLogout = () => supabase.auth.signOut();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 text-white rounded-lg">
                <Hash size={20} />
              </div>
              <span className="font-black text-xl tracking-tight text-slate-900 hidden sm:block">
                Hashtag<span className="text-indigo-600">Secure</span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{profile.name}</p>
                <p className="text-xs font-medium text-slate-500 capitalize">{profile.role === 'teacher' ? 'Professor' : 'Estudante'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {profile.role === 'teacher' ? (
          <TeacherDashboard user={user} profile={profile} />
        ) : (
          <StudentDashboard user={user} profile={profile} />
        )}
      </main>
    </div>
  );
}
