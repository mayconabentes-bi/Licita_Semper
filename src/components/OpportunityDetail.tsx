import React, { useState, useEffect, useContext } from 'react';
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
  X, 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  AlertCircle,
  File,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError } from '../lib/firebase';
import { Opportunity, Document, DocumentStatus, OperationType } from '../types';
import { CompanyContext } from '../App';

interface DetailProps {
  opportunity: Opportunity;
  onClose: () => void;
}

export function OpportunityDetail({ opportunity, onClose }: DetailProps) {
  const { company } = useContext(CompanyContext);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (!company) return;

    const q = query(
      collection(db, 'documents'),
      where('opportunityId', '==', opportunity.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document));
      setDocuments(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'documents');
    });

    return unsubscribe;
  }, [opportunity.id, company]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este documento da licitação?')) return;
    try {
      await deleteDoc(doc(db, 'documents', id));
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, 'documents');
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
      <header className="p-6 bg-slate-900 border-b border-white/10 flex items-center justify-between text-white">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{opportunity.agency}</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Edital {opportunity.number}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <X size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8 space-y-10">
        {/* Info Grid */}
        <section className="grid grid-cols-2 gap-8">
           <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Objeto</label>
              <p className="text-xs text-slate-600 leading-relaxed">{opportunity.object}</p>
           </div>
           <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Estimado</label>
              <p className="text-sm font-black text-slate-900">
                {opportunity.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opportunity.value) : '---'}
              </p>
           </div>
           <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Portal</label>
              <p className="text-xs font-bold text-slate-700">{opportunity.portal}</p>
           </div>
           <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Abertura</label>
              <p className="text-xs font-bold text-slate-700">{opportunity.openingDate ? new Date(opportunity.openingDate).toLocaleDateString('pt-BR') : 'A definir'}</p>
           </div>
        </section>

        {/* Documents Section */}
        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 tracking-tighter uppercase italic">Documentação da Proposta</h3>
              <button 
                onClick={() => setShowUpload(true)}
                className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
              >
                <Plus size={14} /> Adicionar
              </button>
           </div>

           <div className="grid grid-cols-1 gap-3">
              {loading ? (
                <div className="h-20 bg-slate-50 animate-pulse rounded-xl" />
              ) : documents.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                   <FileText size={32} className="mx-auto text-slate-200 mb-3" />
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum documento anexado ao edital</p>
                </div>
              ) : (
                documents.map(doc => (
                  <div key={doc.id} className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between group hover:border-emerald-200 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                           <File size={20} />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-800">{doc.type}</p>
                           <p className="text-[10px] text-slate-400 font-mono italic">{doc.fileName}</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => handleDelete(doc.id)}
                       className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
                ))
              )}
           </div>
        </section>
      </main>

      <AnimatePresence>
        {showUpload && (
          <UploadModal 
            opportunityId={opportunity.id} 
            onClose={() => setShowUpload(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function UploadModal({ opportunityId, onClose }: { opportunityId: string, onClose: () => void }) {
  const { company } = useContext(CompanyContext);
  const [formData, setFormData] = useState({
    type: '',
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
      
      setIsParsing(true);
      setTimeout(() => {
        setIsParsing(false);
        // Simple mock parsing
        if (file.name.toLowerCase().includes('tecnica')) {
           setFormData(f => ({ ...f, type: 'Atestado de Capacidade Técnica' }));
        } else if (file.name.toLowerCase().includes('proposta')) {
           setFormData(f => ({ ...f, type: 'Proposta Comercial' }));
        }
      }, 1500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !company) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'documents'), {
        ...formData,
        opportunityId,
        companyId: company.id,
        ownerId: auth.currentUser.uid,
        status: DocumentStatus.VALID,
        fileSize: selectedFile?.size || 0,
        fileType: selectedFile?.type || 'application/pdf',
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
           <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tighter italic">Anexar ao Edital</h3>
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
             <X size={20} />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="relative">
            {!selectedFile ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                 <Upload size={24} className="text-slate-400 mb-2" />
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selecionar Documento</p>
                 <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3 relative overflow-hidden">
                 <File size={20} className="text-emerald-500" />
                 <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-900 truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                 </div>
                 <button type="button" onClick={() => setSelectedFile(null)} className="text-emerald-400 hover:text-emerald-600">
                    <X size={16} />
                 </button>
                 {isParsing && (
                    <motion.div 
                      className="absolute bottom-0 left-0 h-1 bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.5 }}
                    />
                 )}
              </div>
            )}
            {isParsing && (
              <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                <Sparkles size={12} className="animate-spin" /> Identificando documento...
              </div>
            )}
          </div>

          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Classificação</label>
             <input 
               required
               value={formData.type}
               onChange={(e) => setFormData({...formData, type: e.target.value})}
               className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
               placeholder="Ex: Atestado de Capacidade"
             />
          </div>

          <div className="flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-100">
                Cancelar
             </button>
             <button 
               type="submit" 
               disabled={isSubmitting || !selectedFile}
               className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50"
             >
                {isSubmitting ? 'Salvando...' : 'Anexar'}
             </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
