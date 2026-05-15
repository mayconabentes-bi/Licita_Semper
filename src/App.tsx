/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  User,
  signOut
} from 'firebase/auth';
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  Archive, 
  LogOut, 
  Plus, 
  Gavel,
  AlertCircle,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, testConnection, handleFirestoreError } from './lib/firebase';
import { Dashboard } from './components/Dashboard';
import { OpportunityList } from './components/OpportunityList';
import { DocumentVault } from './components/DocumentVault';
import { TaskBoard } from './components/TaskBoard';
import { LandingPage } from './components/LandingPage';
import { UserProfile, Company, UserRole, OperationType } from './types';

// Global context for company
export const CompanyContext = React.createContext<{
  profile: UserProfile | null,
  company: Company | null,
  loading: boolean
}>({
  profile: null,
  company: null,
  loading: true
});


export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializingProfile, setInitializingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        setInitializingProfile(true);
        try {
          const profilePath = `users/${firebaseUser.uid}`;
          let profileDoc;
          try {
            profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, profilePath);
            return;
          }
          
          if (profileDoc && profileDoc.exists()) {
            const profileData = profileDoc.data() as UserProfile;
            setProfile(profileData);
            
            const companyPath = `companies/${profileData.companyId}`;
            try {
              const companyDoc = await getDoc(doc(db, 'companies', profileData.companyId));
              if (companyDoc.exists()) {
                setCompany({ id: companyDoc.id, ...companyDoc.data() } as Company);
              }
            } catch (error) {
              handleFirestoreError(error, OperationType.GET, companyPath);
            }
          } else {
            // Auto-onboarding for MVP: Create a company and profile
            const newCompanyId = `comp_${firebaseUser.uid.substring(0, 5)}`;
            const newCompany: any = {
              name: `${firebaseUser.displayName?.split(' ')[0]}'s Company`,
              ownerId: firebaseUser.uid,
              createdAt: serverTimestamp()
            };
            
            try {
              await setDoc(doc(db, 'companies', newCompanyId), newCompany);
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `companies/${newCompanyId}`);
            }
            
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              companyId: newCompanyId,
              role: UserRole.ADMIN,
              createdAt: serverTimestamp()
            };
            
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
            }
            
            setProfile(newProfile);
            setCompany({ id: newCompanyId, ...newCompany } as Company);
          }
        } catch (error) {
          console.error("Profile Fetch Error:", error);
        } finally {
          setInitializingProfile(false);
        }
      } else {
        setProfile(null);
        setCompany(null);
      }
      
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setLoginError('O login foi cancelado porque a janela foi fechada.');
      } else if (error.code === 'auth/popup-blocked') {
        setLoginError('O popup de login foi bloqueado pelo navegador.');
      } else {
        setLoginError('Ocorreu um erro ao tentar fazer login. Tente novamente.');
      }
    }
  };

  if (loading || (user && initializingProfile)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="text-emerald-600"
          >
            <Gavel size={48} />
          </motion.div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">Sincronizando Cofre...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={handleLogin} loginError={loginError} />;
  }

  return (
    <CompanyContext.Provider value={{ profile, company, loading: initializingProfile }}>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
        {/* Sidebar */}
        <aside className="w-20 lg:w-64 bg-slate-900 flex flex-col shadow-2xl relative z-10 transition-all duration-300">
          <div className="p-4 lg:p-6 flex-1">
            <div className="flex items-center gap-3 mb-10 justify-center lg:justify-start">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <Gavel className="text-white" size={20} />
              </div>
              <span className="hidden lg:block font-black text-xl tracking-tighter text-white uppercase italic">Licita<span className="text-emerald-500">Semper</span></span>
            </div>

            <nav className="space-y-2">
              <SidebarLink 
                icon={<LayoutDashboard size={20} />} 
                label="Painel" 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')} 
              />
              <SidebarLink 
                icon={<FileText size={20} />} 
                label="Editais" 
                active={activeTab === 'opportunities'} 
                onClick={() => setActiveTab('opportunities')} 
              />
              <SidebarLink 
                icon={<Archive size={20} />} 
                label="Cofre" 
                active={activeTab === 'vault'} 
                onClick={() => setActiveTab('vault')} 
              />
              <SidebarLink 
                icon={<CheckSquare size={20} />} 
                label="Tarefas" 
                active={activeTab === 'tasks'} 
                onClick={() => setActiveTab('tasks')} 
              />
            </nav>
          </div>

          <div className="mt-auto p-4 lg:p-6 border-t border-white/5 bg-black/20">
            <div className="flex flex-col gap-4">
               {company && (
                 <div className="hidden lg:flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center shrink-0">
                       <Building className="text-emerald-500" size={14} />
                    </div>
                    <div className="truncate">
                       <p className="text-[10px] font-black text-white truncate">{company.name}</p>
                       <p className="text-emerald-500 text-[8px] font-black uppercase tracking-widest">Ativo</p>
                    </div>
                 </div>
               )}

               <div className="flex items-center justify-center lg:justify-start gap-3">
                  <img src={user.photoURL || ''} className="w-10 h-10 lg:w-8 lg:h-8 rounded-full border-2 border-slate-700 shadow-sm shrink-0" alt="" />
                  <div className="hidden lg:block text-sm truncate">
                    <p className="font-bold text-white truncate text-xs">{user.displayName}</p>
                  </div>
               </div>

               <button 
                 onClick={() => signOut(auth)}
                 title="Sair"
                 className="flex items-center justify-center lg:justify-start gap-3 text-slate-500 hover:text-white transition-colors py-2"
               >
                 <LogOut size={18} />
                 <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">Sair</span>
               </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative p-8">
          <div className="max-w-6xl mx-auto">
            <header className="mb-10 flex items-center justify-between">
               <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase underline decoration-emerald-500 decoration-4 underline-offset-4 mb-1">
                    {activeTab === 'dashboard' && 'Visão Geral'}
                    {activeTab === 'opportunities' && 'Oportunidades'}
                    {activeTab === 'vault' && 'Cofre de Documentos'}
                    {activeTab === 'tasks' && 'Operação'}
                  </h1>
                  <p className="text-slate-400 text-sm font-medium">
                    {activeTab === 'dashboard' && 'Acompanhe seus KPIs e cronogramas.'}
                    {activeTab === 'opportunities' && 'Triagem estratégica de editais públicos.'}
                    {activeTab === 'vault' && 'Suas certidões e habilitações sempre prontas.'}
                    {activeTab === 'tasks' && 'Gestão de tarefas e prazos operacionais.'}
                  </p>
               </div>
            </header>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'opportunities' && <OpportunityList />}
                {activeTab === 'vault' && <DocumentVault />}
                {activeTab === 'tasks' && <TaskBoard opportunity={{ id: 'global' } as any} onClose={() => setActiveTab('dashboard')} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </CompanyContext.Provider>
  );
}

function SidebarLink({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl text-sm font-black transition-all group ${
        active 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
          : 'text-slate-500 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white' : 'text-slate-500'}`}>
        {icon}
      </div>
      <span className="hidden lg:block uppercase tracking-widest text-[10px]">{label}</span>
    </button>
  );
}

