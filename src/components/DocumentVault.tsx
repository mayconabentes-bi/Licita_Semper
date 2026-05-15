import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { 
  Plus, 
  Search, 
  FileCheck, 
  AlertTriangle, 
  Calendar,
  Trash2,
  X,
  ShieldCheck,
  Clock,
  Info,
  CalendarCheck,
  Upload,
  File,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError } from '../lib/firebase';
import { Document, DocumentStatus, OperationType } from '../types';
import { CompanyContext } from '../App';

export function DocumentVault() {
  const { company } = React.useContext(CompanyContext);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'expired' | 'alerts'>('all');

  useEffect(() => {
    if (!auth.currentUser || !company) return;

    const path = 'documents';
    const q = query(
      collection(db, path),
      where('companyId', '==', company.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document));
      setDocuments(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return unsubscribe;
  }, [company]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este documento?')) return;
    try {
      await deleteDoc(doc(db, 'documents', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'documents');
    }
  };

  const getRiskLevel = (doc: Document) => {
    if (!doc.expiryDate) return 'neutral';
    const today = new Date();
    const expDate = new Date(doc.expiryDate);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'critical'; // Red
    if (diffDays <= 7) return 'critical'; // Red (very close)
    if (diffDays <= 20) return 'warning'; // Yellow
    return 'safe'; // Green
  };

  const criticalDocs = documents.filter(d => getRiskLevel(d) === 'critical');
  const warningDocs = documents.filter(d => getRiskLevel(d) === 'warning');

  const filteredDocs = documents.filter(doc => {
    if (filter === 'all') return true;
    const risk = getRiskLevel(doc);
    if (filter === 'expired') return risk === 'critical' && new Date(doc.expiryDate!) < new Date();
    if (filter === 'alerts') return risk === 'critical' || risk === 'warning';
    return true;
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Risk Summary Alerts */}
      {(criticalDocs.length > 0 || warningDocs.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criticalDocs.length > 0 && (
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-4"
            >
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-red-900 font-bold text-sm">Alerta Crítico: Documentos Vencidos</p>
                <p className="text-red-600 text-xs mt-0.5">Você possui {criticalDocs.length} documento(s) que precisam de renovação imediata para não ser desclassificado.</p>
              </div>
            </motion.div>
          )}
          {warningDocs.length > 0 && (
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-4"
            >
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-amber-900 font-bold text-sm">Aviso: Expiração Próxima</p>
                <p className="text-amber-600 text-xs mt-0.5">{warningDocs.length} documento(s) vencem nos próximos 20 dias.</p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 bg-white p-1 rounded-lg border border-slate-200">
           <button 
             onClick={() => setFilter('all')}
             className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-md shadow-sm transition-all ${filter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
           >
            Todos
           </button>
           <button 
             onClick={() => setFilter('expired')}
             className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${filter === 'expired' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
           >
            Vencidos
           </button>
           <button 
             onClick={() => setFilter('alerts')}
             className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${filter === 'alerts' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-slate-600'}`}
           >
            Alertas
           </button>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200/50 flex items-center gap-2"
        >
          <Plus size={18} />
          Novo Documento
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Risco</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Emissão</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Validade</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-full" /></td>
                </tr>
              ))
            ) : filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-24 text-center">
                   <ShieldCheck size={48} className="mx-auto mb-4 text-slate-200" />
                   <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum resultado encontrado</p>
                </td>
              </tr>
            ) : (
              filteredDocs.map(doc => {
                const risk = getRiskLevel(doc);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${risk === 'critical' ? 'bg-red-50 text-red-600' : risk === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          <FileCheck size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{doc.type}</p>
                          <p className="text-[10px] text-slate-400 font-mono italic opacity-60 line-clamp-1">{doc.fileName || 'arquivo_sem_ref.pdf'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="flex justify-center">
                          <RiskIndicator level={risk} />
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center text-xs font-mono text-slate-500">
                      {doc.issueDate ? new Date(doc.issueDate).toLocaleDateString('pt-BR') : '--/--/----'}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-xs font-mono font-bold ${risk === 'critical' ? 'text-red-600 underline decoration-red-300' : risk === 'warning' ? 'text-amber-600' : 'text-slate-600'}`}>
                          {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('pt-BR') : 'Indeterminado'}
                        </span>
                        {doc.notes && (
                          <div className="group/note relative">
                            <Info size={12} className="text-slate-300 mt-1 cursor-help hover:text-slate-400 transition-colors" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl opacity-0 invisible group-hover/note:opacity-100 group-hover/note:visible transition-all">
                              {doc.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showModal && <NewDocumentModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

function NewDocumentModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    type: '',
    issueDate: '',
    expiryDate: '',
    fileName: '',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, fileName: file.name }));
      
      // Simulate AI Parsing
      triggerParsing(file);
    }
  };

  const triggerParsing = async (file: File) => {
    setIsParsing(true);
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simple heuristic for "parsing" based on filename
    const name = file.name.toLowerCase();
    let type = 'Documento';
    let expiry = '';

    if (name.includes('cnpj')) type = 'Cartão CNPJ';
    else if (name.includes('social')) type = 'Contrato Social';
    else if (name.includes('fgts')) type = 'Certidão FGTS';
    else if (name.includes('trabalhista')) type = 'Certidão Trabalhista';
    else if (name.includes('federal') || name.includes('rfb')) type = 'Certidão RFB';
    
    setFormData(prev => ({
      ...prev,
      type: prev.type || type,
      expiryDate: prev.expiryDate || expiry
    }));
    setIsParsing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { company } = React.useContext(CompanyContext);
    if (!auth.currentUser || !company) return;
    setIsSubmitting(true);

    try {
      const today = new Date();
      const expDate = formData.expiryDate ? new Date(formData.expiryDate) : null;
      const status = expDate && expDate < today ? DocumentStatus.EXPIRED : DocumentStatus.VALID;

      const path = 'documents';
      await addDoc(collection(db, path), {
        ...formData,
        status,
        fileSize: selectedFile?.size || 0,
        fileType: selectedFile?.type || 'application/pdf',
        companyId: company.id,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'documents');
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
          <div>
            <h3 className="text-xl font-bold text-slate-900 underline decoration-emerald-500/30 decoration-4 underline-offset-4">Gestão de Documentos</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Acervo Digital Seguro</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload Zone */}
          <div className="relative">
            {!selectedFile ? (
              <label 
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 cursor-pointer hover:bg-slate-100 hover:border-emerald-300 transition-all group"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="p-3 bg-white rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="text-emerald-500" size={24} />
                  </div>
                  <p className="text-xs font-bold text-slate-600 mb-1 uppercase tracking-tight">PDF, DOCX ou Imagens</p>
                  <p className="text-[10px] text-slate-400">Arraste ou clique para selecionar</p>
                </div>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-2xl border border-slate-800 text-white relative overflow-hidden">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <File size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type.split('/')[1].toUpperCase()}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
                
                {isParsing && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-800">
                    <motion.div 
                      className="h-full bg-emerald-500" 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2 }}
                    />
                  </div>
                )}
              </div>
            )}
            
            {isParsing && (
              <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest px-2">
                <Sparkles size={12} className="animate-spin" />
                Extraindo metadados com IA...
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo de Documento</label>
              <div className="relative">
                <input 
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  type="text" 
                  placeholder="Ex: Certidão Negativa Fazenda"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50/50 text-sm font-medium"
                />
                {formData.type && !isParsing && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Data de Emissão</label>
              <input 
                value={formData.issueDate}
                onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                type="date" 
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Data de Validade</label>
              <input 
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                type="date" 
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50/50 text-sm"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 rounded-lg border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !selectedFile}
              className="flex-1 px-6 py-3 rounded-lg bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200/50 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Arquivar Agora
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function DocStatusBadge({ status }: { status: DocumentStatus }) {
  const styles = {
    [DocumentStatus.VALID]: 'bg-emerald-100 text-emerald-700',
    [DocumentStatus.EXPIRED]: 'bg-red-100 text-red-700',
    [DocumentStatus.MISSING]: 'bg-amber-100 text-amber-700',
  };

  const labels = {
    [DocumentStatus.VALID]: 'Válido',
    [DocumentStatus.EXPIRED]: 'Expirado',
    [DocumentStatus.MISSING]: 'Pendente',
  };

  return (
    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function RiskIndicator({ level }: { level: 'safe' | 'warning' | 'critical' | 'neutral' }) {
  const colors = {
    safe: 'bg-emerald-500 shadow-emerald-200',
    warning: 'bg-amber-500 shadow-amber-200',
    critical: 'bg-red-500 shadow-red-200',
    neutral: 'bg-slate-200 shadow-transparent'
  };

  return (
    <div className={`w-3 h-3 rounded-full shadow-lg ${colors[level]}`} />
  );
}
