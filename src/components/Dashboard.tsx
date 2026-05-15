import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  Building2,
  CheckSquare,
  Calculator,
  Plus
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { db, auth, handleFirestoreError } from '../lib/firebase';
import { Opportunity, OpportunityStatus, OperationType, Task, TaskStatus } from '../types';
import { AIAnalysisModal } from './AIAnalysisModal';
import { OpportunityScreening } from './OpportunityScreening';
import { TaskBoard } from './TaskBoard';
import { CompanyContext } from '../App';
import { setDoc, doc, serverTimestamp, addDoc } from 'firebase/firestore';

export function Dashboard() {
  const { profile, company } = React.useContext(CompanyContext);
  const [stats, setStats] = useState({
    total: 0,
    preparation: 0,
    analysis: 0,
    docAlerts: 0,
    wonCount: 0,
    wonValue: 0,
    participationRate: 0,
    winRate: 0,
    disqualifiedRate: 0,
    adherenceRate: 0
  });
  const [recentBids, setRecentBids] = useState<Opportunity[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [screeningOpp, setScreeningOpp] = useState<Opportunity | null>(null);
  const [taskOpp, setTaskOpp] = useState<Opportunity | null>(null);

  useEffect(() => {
    if (!auth.currentUser || !company) return;

    // Opportunities listener
    const path = 'opportunities';
    const q = query(
      collection(db, path),
      where('companyId', '==', company.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bids = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Opportunity));
      setRecentBids(bids.slice(0, 5));
      
      // KPI Calculations
      const total = bids.length;
      const analyzed = bids.filter(b => b.score !== undefined);
      const adherence = analyzed.filter(b => (b.score || 0) >= 80).length;
      const participated = bids.filter(b => [OpportunityStatus.PREPARATION, OpportunityStatus.WON, OpportunityStatus.LOST, OpportunityStatus.DISQUALIFIED].includes(b.status));
      const won = bids.filter(b => b.status === OpportunityStatus.WON);
      const disqualified = bids.filter(b => b.status === OpportunityStatus.DISQUALIFIED);
      
      setStats(prev => ({
        ...prev,
        total,
        preparation: bids.filter(b => b.status === OpportunityStatus.PREPARATION).length,
        analysis: bids.filter(b => b.status === OpportunityStatus.ANALYSIS).length,
        wonCount: won.length,
        wonValue: won.reduce((acc, b) => acc + (b.value || 0), 0),
        participationRate: total > 0 ? (participated.length / total) * 100 : 0,
        winRate: participated.length > 0 ? (won.length / participated.length) * 100 : 0,
        disqualifiedRate: participated.length > 0 ? (disqualified.length / participated.length) * 100 : 0,
        adherenceRate: analyzed.length > 0 ? (adherence / analyzed.length) * 100 : 0
      }));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    // Documents listener for stats
    const docsQ = query(
      collection(db, 'documents'),
      where('companyId', '==', company.id)
    );

    const unsubscribeDocs = onSnapshot(docsQ, (snapshot) => {
      const docs = snapshot.docs.map(d => d.data());
      const today = new Date();
      const alerts = docs.filter(d => {
        if (!d.expiryDate) return false;
        const expDate = new Date(d.expiryDate);
        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 20; // Critical or Warning
      }).length;
      
      setStats(prev => ({ ...prev, docAlerts: alerts }));
    });

    const tasksQ = query(
      collection(db, 'tasks'),
      where('companyId', '==', company.id),
      where('status', '!=', TaskStatus.DONE),
      orderBy('status'),
      orderBy('dueDate', 'asc'),
      limit(5)
    );

    const unsubscribeTasks = onSnapshot(tasksQ, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setUpcomingTasks(tasks);
    });

    return () => {
      unsubscribe();
      unsubscribeDocs();
      unsubscribeTasks();
    };
  }, [company]);

  const handleSaveScreening = async (data: any) => {
    if (!company || !auth.currentUser || !screeningOpp) return;
    try {
      await addDoc(collection(db, 'analysis'), {
        ...data,
        companyId: company.id,
        authorId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });

      const oppDoc = doc(db, 'opportunities', screeningOpp.id);
      await setDoc(oppDoc, { 
        status: OpportunityStatus.ANALYSIS,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      setScreeningOpp(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'analysis');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic underline decoration-emerald-500 decoration-4">Licita<span className="text-emerald-600">Semper</span></h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
            {company?.name} • {profile?.role === 'admin' ? 'Painel de Controle' : 'Área do Analista'}
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="hidden sm:flex -space-x-2 mr-4">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm">MB</div>
           </div>
           <button 
             onClick={() => setShowAIModal(true)}
             className="px-4 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 flex items-center gap-2"
           >
             <Plus size={14} />
             Novo Edital
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={<TrendingUp className="text-emerald-500" size={20} />}
          label="Vitórias (VGV)"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(stats.wonValue)}
          trend={`${stats.wonCount} contratos ganhos`}
        />
        <StatCard 
          icon={<CheckCircle2 className="text-emerald-500" size={20} />}
          label="Taxa de Vitória"
          value={`${stats.winRate.toFixed(1)}%`}
          trend="vs participações"
          percentage={stats.winRate}
        />
        <StatCard 
          icon={<Calculator className="text-emerald-600" size={20} />}
          label="Aderência AI"
          value={`${stats.adherenceRate.toFixed(1)}%`}
          trend="score > 80"
          percentage={stats.adherenceRate}
        />
        <StatCard 
          icon={<AlertCircle className={`text-amber-600 ${stats.docAlerts > 0 ? 'animate-pulse' : ''}`} size={20} />}
          label="Riscos de Certidão"
          value={stats.docAlerts.toString().padStart(2, '0')}
          trend={stats.docAlerts > 0 ? "Vencimento próximo!" : "Habilitação em dia"}
          urgent={stats.docAlerts > 0}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Eficiência do Funil</p>
           <div className="space-y-6">
              <div>
                 <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                    <span className="text-slate-500">Participação</span>
                    <span className="text-slate-900">{stats.participationRate.toFixed(1)}%</span>
                 </div>
                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-900 h-full" style={{ width: `${stats.participationRate}%` }} />
                 </div>
              </div>
              <div>
                 <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                    <span className="text-slate-500">Desclassificação</span>
                    <span className="text-red-500">{stats.disqualifiedRate.toFixed(1)}%</span>
                 </div>
                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full" style={{ width: `${stats.disqualifiedRate}%` }} />
                 </div>
              </div>
              <div className="pt-2">
                 <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ROI Proporcional</p>
                    <p className="text-lg font-black text-slate-800 tracking-tighter">12.4x</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="md:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fluxo de Monitoramento</p>
              <div className="flex gap-4">
                 <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Monitorados
                 </div>
                 <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-slate-900" /> Analisados
                 </div>
              </div>
           </div>
           <div className="flex-1 min-h-[160px] flex items-end gap-3 px-2">
              {[65, 45, 78, 52, 89, 44, 95].map((h, i) => (
                 <div key={i} className="flex-1 group relative">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1.5 bg-slate-900 text-white text-[8px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                       {h} Editais
                    </div>
                    <div className="flex flex-col gap-1 h-full justify-end">
                       <div className="w-full bg-emerald-500/20 rounded-t-sm group-hover:bg-emerald-500/30 transition-colors" style={{ height: `${h}%` }} />
                       <div className="w-full bg-slate-900/10 rounded-t-sm group-hover:bg-slate-900/20 transition-colors" style={{ height: `${h * 0.6}%` }} />
                    </div>
                 </div>
              ))}
           </div>
           <div className="mt-4 flex justify-between px-2">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map(d => (
                 <span key={d} className="text-[9px] font-bold text-slate-400 uppercase">{d}</span>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Opportunities */}
        <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              Oportunidades Prioritárias
            </h3>
            <button className="text-xs font-semibold text-emerald-600 hover:underline">Ver todas</button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-bold">Órgão / Objeto</th>
                  <th className="px-6 py-3 font-bold text-right">Valor Est.</th>
                  <th className="px-6 py-3 font-bold text-center">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentBids.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-20 text-slate-400">
                      <Building2 size={48} className="mx-auto mb-4 opacity-10" />
                      <p>Nenhuma oportunidade cadastrada.</p>
                    </td>
                  </tr>
                ) : (
                  recentBids.map(bid => (
                    <tr key={bid.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-sm line-clamp-1">{bid.agency}</div>
                        <div className="text-slate-500 text-xs mt-0.5 line-clamp-1">{bid.object}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">
                        {bid.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bid.value) : '---'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={bid.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setTaskOpp(bid)}
                            className="px-3 py-1 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 transition-colors uppercase tracking-widest"
                          >
                            Tarefas
                          </button>
                          <button 
                            onClick={() => setScreeningOpp(bid)}
                            className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-[10px] font-bold hover:bg-emerald-600 hover:text-white transition-colors uppercase tracking-widest"
                          >
                            Triagem
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Center */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-emerald-900 p-6 rounded-xl text-white shadow-lg relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">Análise de IA</h3>
                <p className="text-emerald-100/80 text-sm mb-6 leading-relaxed">Avalie automaticamente se vale a pena participar de um novo edital.</p>
                <button 
                  onClick={() => setShowAIModal(true)}
                  className="w-full bg-emerald-500 text-white font-bold py-3 rounded-lg text-sm shadow-sm hover:bg-emerald-600 transition-all"
                >
                  Iniciar Nova Análise
                </button>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full group-hover:scale-110 transition-transform duration-700" />
           </div>

           <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <CheckSquare size={18} className="text-slate-400" />
                Próximos Prazos
              </h3>
              <div className="space-y-5">
                {upcomingTasks.length === 0 ? (
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold text-center py-4">Sem prazos imediatos</p>
                ) : (
                  upcomingTasks.map(task => (
                    <DashboardTaskItem 
                      key={task.id} 
                      label={task.title} 
                      deadline={task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Sem data'} 
                      color={task.dueDate && new Date(task.dueDate) < new Date() ? "bg-red-500" : "bg-emerald-500"} 
                    />
                  ))
                )}
              </div>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showAIModal && <AIAnalysisModal onClose={() => setShowAIModal(false)} />}
        {screeningOpp && (
          <OpportunityScreening 
            opportunity={screeningOpp} 
            onClose={() => setScreeningOpp(null)}
            onSave={handleSaveScreening}
          />
        )}
        {taskOpp && (
          <TaskBoard 
            opportunity={taskOpp}
            onClose={() => setTaskOpp(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


function StatCard({ icon, label, value, trend, percentage, urgent = false }: { icon: any, label: string, value: string, trend: string, percentage?: number, urgent?: boolean }) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all hover:shadow-md`}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h4 className={`text-2xl font-bold ${urgent ? 'text-amber-600' : 'text-slate-800'}`}>{value}</h4>
      
      {percentage !== undefined ? (
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4">
          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
      ) : (
        <p className={`text-[10px] uppercase font-bold mt-3 ${urgent ? 'text-amber-600' : 'text-emerald-600'}`}>
          {trend}
        </p>
      )}
    </div>
  );
}

function DashboardTaskItem({ label, deadline, color }: { label: string, deadline: string, color: string, key?: any }) {
  return (
    <div className="flex items-start gap-4 group cursor-pointer">
      <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${color}`} />
      <div>
        <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{label}</p>
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{deadline}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OpportunityStatus }) {
  const styles = {
    [OpportunityStatus.MONITORING]: 'bg-slate-100 text-slate-600',
    [OpportunityStatus.ANALYSIS]: 'bg-amber-100 text-amber-600',
    [OpportunityStatus.PREPARATION]: 'bg-indigo-100 text-indigo-600',
    [OpportunityStatus.WON]: 'bg-emerald-100 text-emerald-600',
    [OpportunityStatus.LOST]: 'bg-slate-100 text-slate-500',
    [OpportunityStatus.DISQUALIFIED]: 'bg-red-100 text-red-600',
    [OpportunityStatus.CANCELED]: 'bg-slate-200 text-slate-300',
  };

  const labels = {
    [OpportunityStatus.MONITORING]: 'Monitoramento',
    [OpportunityStatus.ANALYSIS]: 'IA / Análise',
    [OpportunityStatus.PREPARATION]: 'No Funil',
    [OpportunityStatus.WON]: 'Vencida',
    [OpportunityStatus.LOST]: 'Perdida',
    [OpportunityStatus.DISQUALIFIED]: 'Desclassif.',
    [OpportunityStatus.CANCELED]: 'Cancelada',
  };

  return (
    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
