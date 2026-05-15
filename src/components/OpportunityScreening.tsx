import React, { useState, useEffect, useContext } from 'react';
import { X, CheckCircle2, AlertCircle, Info, Calculator, Save, ShieldCheck, Zap, Target, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { CompanyContext } from '../App';
import { calculateBiddingScore } from '../lib/scoring';
import { Opportunity, AnalysisDecision, Document, OperationType } from '../types';

interface ScreeningProps {
  opportunity: Opportunity;
  onClose: () => void;
  onSave: (screeningData: any) => void;
}

export function OpportunityScreening({ opportunity, onClose, onSave }: ScreeningProps) {
  const { company } = useContext(CompanyContext);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [formData, setFormData] = useState({
    technicalCapacity: 5,
    estimatedMargin: 5,
    riskLevel: 5,
    deadlineFeasibility: 5,
    hasStrategicInterest: true
  });

  useEffect(() => {
    if (!company) return;

    const q = query(
      collection(db, 'documents'),
      where('companyId', '==', company.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document));
      setDocuments(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'documents');
    });

    return unsubscribe;
  }, [company]);

  const scoringResult = calculateBiddingScore({
    ...formData,
    documents
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      inputs: formData,
      scoring: scoringResult,
      opportunityId: opportunity.id
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <Calculator size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Motor de Viabilidade</h3>
              <p className="text-[10px] text-slate-400 uppercase font-medium">Análise Técnica & Habilitação</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/80 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <ScoreSlider 
                icon={<ShieldCheck size={14} className="text-emerald-500" />}
                label="Capacidade Técnica" 
                value={formData.technicalCapacity} 
                onChange={(v) => setFormData({...formData, technicalCapacity: v})}
                description="Equipe, atestados e experiência no objeto."
              />

              <ScoreSlider 
                icon={<Zap size={14} className="text-amber-500" />}
                label="Margem de Lucro" 
                value={formData.estimatedMargin} 
                onChange={(v) => setFormData({...formData, estimatedMargin: v})}
                description="Potencial retorno financeiro da operação."
              />

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Interesse Estratégico</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={formData.hasStrategicInterest}
                    onChange={(e) => setFormData({...formData, hasStrategicInterest: e.target.checked})}
                    className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-6">
              <ScoreSlider 
                icon={<AlertCircle size={14} className="text-rose-500" />}
                label="Risco de Entrega" 
                value={formData.riskLevel} 
                onChange={(v) => setFormData({...formData, riskLevel: v})}
                description="Complexidade e multa contratual."
                inverted
              />

              <ScoreSlider 
                icon={<FileText size={14} className="text-blue-500" />}
                label="Folga de Cronograma" 
                value={formData.deadlineFeasibility} 
                onChange={(v) => setFormData({...formData, deadlineFeasibility: v})}
                description="Prazo para mobilização e execução."
              />
              
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Compulsórios (Cofre)</span>
                    <span className={`text-[10px] font-black ${scoringResult.dimensions.documentation >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {scoringResult.dimensions.documentation}% Pronto
                    </span>
                 </div>
                 <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${scoringResult.dimensions.documentation >= 80 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                      style={{ width: `${scoringResult.dimensions.documentation}%` }}
                    />
                 </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-900 rounded-xl border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
            
            <div className="relative flex flex-col md:flex-row items-center gap-8">
              <div className="text-center md:px-8 md:border-r md:border-white/10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Score LicitaSemper</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-5xl font-black ${
                    scoringResult.finalScore >= 80 ? 'text-emerald-400' : 
                    scoringResult.finalScore >= 50 ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {scoringResult.finalScore}
                  </span>
                  <span className="text-slate-500 text-xs font-bold">/100</span>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                  <span className={`px-4 py-1 rounded flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border ${
                    scoringResult.recommendation === AnalysisDecision.GO ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 
                    scoringResult.recommendation === AnalysisDecision.UNDECIDED ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 
                    'border-slate-500/50 bg-slate-500/10 text-slate-400'
                  }`}>
                    {scoringResult.recommendation === AnalysisDecision.GO && <CheckCircle2 size={12} />}
                    {scoringResult.recommendation === AnalysisDecision.GO ? 'RECOMENDADO (GO)' : 
                     scoringResult.recommendation === AnalysisDecision.UNDECIDED ? 'ESTUDAR (MAYBE)' : 'NÃO RECOMENDADO'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed max-w-md">
                  {scoringResult.justification}
                </p>
              </div>

              <button 
                type="submit"
                className="w-full md:w-auto px-8 py-4 bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group"
              >
                <Save size={18} className="group-hover:scale-110 transition-transform" />
                Finalizar Parecer
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ScoreSlider({ label, value, onChange, description, icon, inverted = false }: { 
  label: string, 
  value: number, 
  onChange: (v: number) => void,
  description: string,
  icon: React.ReactNode,
  inverted?: boolean
}) {
  const getColor = (v: number) => {
    if (inverted) {
      if (v <= 3) return 'accent-emerald-500';
      if (v <= 7) return 'accent-amber-500';
      return 'accent-red-500';
    }
    if (v >= 7) return 'accent-emerald-500';
    if (v >= 4) return 'accent-amber-500';
    return 'accent-red-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
        </div>
        <span className="text-xs font-black text-slate-800">{value}/10</span>
      </div>
      <input 
        type="range" 
        min="0" 
        max="10" 
        step="1"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={`w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer ${getColor(value)}`}
      />
      <p className="text-[10px] text-slate-400 mt-2 italic leading-tight">{description}</p>
    </div>
  );
}
