import React, { useState } from 'react';
import { Sparkles, X, BrainCircuit, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeOpportunity } from '../services/geminiService';
import { AnalysisDecision } from '../types';

export function AIAnalysisModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    agency: '',
    object: '',
    value: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const analysis = await analyzeOpportunity({
        ...formData,
        value: formData.value ? parseFloat(formData.value) : undefined
      });
      setResult(analysis);
    } catch (error) {
      console.error(error);
      alert("Erro ao realizar análise. Tente novamente.");
    } finally {
      setLoading(false);
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
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">Análise de IA</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/80 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {!result ? (
            <form onSubmit={handleAnalyze} className="space-y-6">
              <div className="text-xs font-bold text-emerald-600 bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex items-start gap-2">
                <BrainCircuit size={16} className="shrink-0 mt-0.5" />
                <span>Nossa IA avalia editais do PNCP e Comprasnet para determinar probabilidade de êxito comercial.</span>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Órgão Público</label>
                <input 
                  required
                  value={formData.agency}
                  onChange={(e) => setFormData({...formData, agency: e.target.value})}
                  type="text" 
                  placeholder="Ex: Marinha do Brasil"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Objeto / Descrição</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.object}
                  onChange={(e) => setFormData({...formData, object: e.target.value})}
                  placeholder="Cole aqui a descrição completa do Termo de Referência..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none resize-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Valor de Referência (R$)</label>
                <input 
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  type="number" 
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50/50"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit size={20} />}
                {loading ? 'ANALISANDO EDITAL...' : 'OBTER PARECER TÉCNICO'}
              </button>
            </form>
          ) : (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-6"
            >
              <div className="flex items-center gap-5 p-5 rounded-xl bg-slate-50 border border-slate-200">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                  result.finalDecision === AnalysisDecision.GO ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 
                  result.finalDecision === AnalysisDecision.NO_GO ? 'bg-amber-600 text-white shadow-lg shadow-amber-200' : 'bg-slate-500 text-white'
                }`}>
                  {result.finalDecision === AnalysisDecision.GO ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Parecer de Engenharia Comercial</p>
                  <p className={`text-2xl font-black italic tracking-tighter ${
                    result.finalDecision === AnalysisDecision.GO ? 'text-emerald-600' : 
                    result.finalDecision === AnalysisDecision.NO_GO ? 'text-amber-600' : 'text-slate-600'
                  }`}>
                    {result.finalDecision === AnalysisDecision.GO ? 'GO (PARTICIPAR)' : 
                     result.finalDecision === AnalysisDecision.NO_GO ? 'NO-GO' : 'REVISAR'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                 <ScoreCard label="Técnico" score={result.technicalScore} />
                 <ScoreCard label="Mercado" score={result.competitiveScore} />
                 <ScoreCard label="Margem" score={result.marginScore} />
              </div>

              <div className="bg-white p-5 rounded-xl text-sm leading-relaxed text-slate-700 border border-slate-200 shadow-sm">
                <p className="font-bold mb-2 text-slate-900 flex items-center gap-2 underline decoration-emerald-500/50">
                  Resumo Estratégico
                </p>
                <div className="italic text-slate-600">
                  {result.reason}
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setResult(null)}
                  className="px-6 py-3 rounded-lg border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
                >
                  Reiniciar
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 rounded-lg bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ScoreCard({ label, score }: { label: string, score: number }) {
  const getColors = (s: number) => {
    if (s >= 7) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (s >= 4) return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  return (
    <div className={`p-4 rounded-lg border text-center ${getColors(score)}`}>
       <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{label}</p>
       <p className="text-xl font-black">{score}/10</p>
    </div>
  );
}
