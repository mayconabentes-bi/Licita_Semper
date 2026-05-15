import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  addDoc,
  setDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Building2,
  Calendar,
  DollarSign,
  X,
  Calculator,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError } from '../lib/firebase';
import { Opportunity, OpportunityStatus, OperationType, AnalysisDecision } from '../types';
import { OpportunityScreening } from './OpportunityScreening';
import { TaskBoard } from './TaskBoard';
import { OpportunityDetail } from './OpportunityDetail';
import { CompanyContext } from '../App';

export function OpportunityList() {
  const { company } = React.useContext(CompanyContext);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [screeningOpp, setScreeningOpp] = useState<Opportunity | null>(null);
  const [taskOpp, setTaskOpp] = useState<Opportunity | null>(null);
  const [detailOpp, setDetailOpp] = useState<Opportunity | null>(null);
  const [filter, setFilter] = useState<OpportunityStatus | 'all'>('all');

  useEffect(() => {
    if (!auth.currentUser || !company) return;

    const path = 'opportunities';
    let q = query(
      collection(db, path),
      where('companyId', '==', company.id),
      orderBy('createdAt', 'desc')
    );

    if (filter !== 'all') {
      q = query(q, where('status', '==', filter));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Opportunity));
      setOpportunities(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return unsubscribe;
  }, [filter, company]);

  const handleSaveScreening = async (data: any) => {
    if (!company || !auth.currentUser || !screeningOpp) return;
    try {
      const analysisPath = 'analysis';
      await addDoc(collection(db, analysisPath), {
        ...data,
        companyId: company.id,
        authorId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });

      const oppDoc = doc(db, 'opportunities', screeningOpp.id);
      await setDoc(oppDoc, { 
        status: OpportunityStatus.ANALYSIS,
        score: data.scoring.finalScore,
        recommendation: data.scoring.recommendation,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      setScreeningOpp(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'analysis');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="hidden sm:block">
          {/* Header moved to App.tsx but child content can stay if needed */}
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm shadow-emerald-200/50"
        >
          <Plus size={18} />
          Nova Licitação
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex-1 flex items-center gap-2 px-3">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por agência ou objeto (PNCP)..." 
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-400 text-slate-700"
          />
        </div>
        <div className="h-6 w-px bg-slate-200 mx-2" />
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-500 uppercase tracking-tighter px-4 cursor-pointer"
        >
          <option value="all">Filtro: Todos</option>
          <option value={OpportunityStatus.MONITORING}>Monitorando</option>
          <option value={OpportunityStatus.ANALYSIS}>Em Análise</option>
          <option value={OpportunityStatus.PREPARATION}>Preparação</option>
          <option value={OpportunityStatus.WON}>Ganhas</option>
          <option value={OpportunityStatus.LOST}>Perdidas</option>
          <option value={OpportunityStatus.DISQUALIFIED}>Desclassificadas</option>
          <option value={OpportunityStatus.CANCELED}>Canceladas</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-3 font-black text-slate-400 uppercase text-[9px] tracking-widest">Órgão / Objeto</th>
              <th className="px-6 py-3 font-black text-slate-400 uppercase text-[9px] tracking-widest text-center">Status</th>
              <th className="px-6 py-3 font-black text-slate-400 uppercase text-[9px] tracking-widest text-center">Score / Parecer</th>
              <th className="px-6 py-3 font-black text-slate-400 uppercase text-[9px] tracking-widest text-right">Valor Est.</th>
              <th className="px-6 py-3 font-black text-slate-400 uppercase text-[9px] tracking-widest text-center">Abertura</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-6 py-4 h-12 bg-slate-50/20"></td>
                </tr>
              ))
            ) : opportunities.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-24 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                  <Building2 size={48} className="mx-auto mb-4 opacity-5" />
                  Pronto para iniciar a triagem operacional?
                </td>
              </tr>
            ) : (
              opportunities.map(opp => (
                <tr key={opp.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-800 text-xs uppercase italic tracking-tight">{opp.agency}</div>
                    <div className="text-slate-400 text-[10px] line-clamp-1 mt-0.5">{opp.object}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={opp.status} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    {opp.score !== undefined ? (
                      <div className="flex flex-col items-center">
                        <span className={`font-black text-xs ${opp.score >= 80 ? 'text-emerald-600' : opp.score >= 50 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {opp.score}/100
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                          {opp.recommendation === AnalysisDecision.GO ? 'GO' : opp.recommendation === AnalysisDecision.NO_GO ? 'NO-GO' : 'TBD'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-bold uppercase italic tracking-tighter">Pendente</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap font-black text-slate-700 text-xs">
                     {opp.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opp.value) : '---'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-slate-500 font-mono text-[10px]">
                    {opp.openingDate ? new Date(opp.openingDate).toLocaleDateString('pt-BR') : 'A definir'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200">
                      <button 
                        onClick={() => setDetailOpp(opp)}
                        title="Documentos e Detalhes"
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-sm"
                      >
                        <FileCheck size={14} />
                      </button>
                      <button 
                        onClick={() => setTaskOpp(opp)}
                        title="Tarefas"
                        className="p-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                      >
                        <Calendar size={14} />
                      </button>
                      <button 
                        onClick={() => setScreeningOpp(opp)}
                        title="Triagem Inteligente"
                        className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                      >
                        <Calculator size={14} />
                      </button>
                      <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 group-hover:text-slate-600">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showModal && <NewOpportunityModal onClose={() => setShowModal(false)} />}
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
        {detailOpp && (
          <OpportunityDetail 
            opportunity={detailOpp}
            onClose={() => setDetailOpp(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NewOpportunityModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    agency: '',
    number: '',
    object: '',
    value: '',
    openingDate: '',
    portal: 'Comprasnet'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { company } = React.useContext(CompanyContext);
    if (!auth.currentUser || !company) return;
    setIsSubmitting(true);

    try {
      const path = 'opportunities';
      await addDoc(collection(db, path), {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : null,
        status: OpportunityStatus.MONITORING,
        companyId: company.id,
        creatorId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'opportunities');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 underline decoration-emerald-500 decoration-4">Novo Edital</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Órgão / Agência</label>
              <input 
                required
                value={formData.agency}
                onChange={(e) => setFormData({...formData, agency: e.target.value})}
                type="text" 
                placeholder="Ex: Ministério da Defesa"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Número Edital</label>
              <input 
                required
                value={formData.number}
                onChange={(e) => setFormData({...formData, number: e.target.value})}
                type="text" 
                placeholder="Ex: 05/2026"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Portal Origem</label>
              <select 
                value={formData.portal}
                onChange={(e) => setFormData({...formData, portal: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50/50 cursor-pointer"
              >
                <option>Comprasnet (SIASG)</option>
                <option>Licitações-e (BB)</option>
                <option>PNCP (Federal)</option>
                <option>Petrobras (Petronect)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Objeto da Licitação</label>
            <textarea 
              required
              rows={3}
              value={formData.object}
              onChange={(e) => setFormData({...formData, object: e.target.value})}
              placeholder="Descreva detalhadamente o objeto conforme edital..."
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none resize-none bg-slate-50/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Valor Estimado</label>
              <input 
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
                type="number" 
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Data Abertura</label>
              <input 
                value={formData.openingDate}
                onChange={(e) => setFormData({...formData, openingDate: e.target.value})}
                type="date" 
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50/50"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 rounded-lg border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
            >
              Voltar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 rounded-lg bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Confirmar Cadastro'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: OpportunityStatus }) {
  const styles = {
    [OpportunityStatus.MONITORING]: 'bg-slate-100 text-slate-500',
    [OpportunityStatus.ANALYSIS]: 'bg-amber-100 text-amber-600 border border-amber-200',
    [OpportunityStatus.PREPARATION]: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    [OpportunityStatus.WON]: 'bg-emerald-600 text-white shadow-sm',
    [OpportunityStatus.LOST]: 'bg-slate-200 text-slate-400',
    [OpportunityStatus.DISQUALIFIED]: 'bg-red-100 text-red-600 border border-red-200',
    [OpportunityStatus.CANCELED]: 'bg-slate-900 text-slate-400',
  };

  const labels = {
    [OpportunityStatus.MONITORING]: 'Monitoramento',
    [OpportunityStatus.ANALYSIS]: 'Em Análise',
    [OpportunityStatus.PREPARATION]: 'Em Preparação',
    [OpportunityStatus.WON]: 'Vencido!',
    [OpportunityStatus.LOST]: 'Perdido',
    [OpportunityStatus.DISQUALIFIED]: 'Desclassif.',
    [OpportunityStatus.CANCELED]: 'Cancelado',
  };

  return (
    <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-md tracking-tighter ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
