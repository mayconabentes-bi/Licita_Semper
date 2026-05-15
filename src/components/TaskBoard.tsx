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
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Trash2, 
  User, 
  AlertCircle, 
  Calendar,
  ChevronRight,
  MessageSquare,
  Flag,
  X,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError } from '../lib/firebase';
import { Task, TaskPriority, TaskStatus, OperationType, Opportunity } from '../types';
import { CompanyContext } from '../App';

interface TaskBoardProps {
  opportunity: Opportunity;
  onClose: () => void;
}

export function TaskBoard({ opportunity, onClose }: TaskBoardProps) {
  const { company } = React.useContext(CompanyContext);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const isGlobal = opportunity?.id === 'global';

  useEffect(() => {
    if (!company) return;

    const path = 'tasks';
    let q;
    
    if (isGlobal) {
      q = query(
        collection(db, path),
        where('companyId', '==', company.id),
        orderBy('dueDate', 'asc')
      );
    } else {
      q = query(
        collection(db, path),
        where('opportunityId', '==', opportunity.id),
        orderBy('dueDate', 'asc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(taskData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return unsubscribe;
  }, [opportunity.id, company]);

  const toggleTaskStatus = async (task: Task) => {
    try {
      const newStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
      await setDoc(doc(db, 'tasks', task.id), { status: newStatus }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Deseja excluir esta tarefa?')) return;
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && tasks.find(t => t.dueDate === dueDate)?.status !== TaskStatus.DONE;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-0 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-500 rounded-lg">
                <Calendar size={20} className="text-white" />
             </div>
             <div>
                <h3 className="text-lg font-bold tracking-tight">
                  {isGlobal ? 'Cronograma Operacional' : 'Operação de Licitação'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {isGlobal ? 'Visão consolidada de todas as tarefas' : `${opportunity.agency} • ${opportunity.number}`}
                </p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plano de Ação</h4>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
            >
              <Plus size={14} />
              Adicionar Tarefa
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse" />)
            ) : tasks.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                 <Clock size={40} className="mx-auto mb-4 text-slate-200" />
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Nenhuma tarefa para este edital</p>
              </div>
            ) : (
              tasks.map(task => (
                <TaskListItem 
                  key={task.id} 
                  task={task} 
                  onToggle={() => toggleTaskStatus(task)} 
                  onDelete={() => deleteTask(task.id)}
                  overdue={isOverdue(task.dueDate)}
                />
              ))
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="text-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Concluído</p>
                 <p className="text-xl font-black text-slate-800">{tasks.filter(t => t.status === TaskStatus.DONE).length}/{tasks.length}</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atrasadas</p>
                 <p className={`text-xl font-black ${tasks.filter(t => isOverdue(t.dueDate)).length > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                    {tasks.filter(t => isOverdue(t.dueDate)).length}
                 </p>
              </div>
           </div>
        </div>

        <AnimatePresence>
          {showAddModal && (
            <AddTaskModal 
              opportunityId={opportunity.id} 
              onClose={() => setShowAddModal(false)} 
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function TaskListItem({ task, onToggle, onDelete, overdue }: { 
  task: Task, 
  onToggle: () => void, 
  onDelete: () => void,
  overdue: boolean,
  key?: any
}) {
  const isDone = task.status === TaskStatus.DONE;

  return (
    <motion.div 
      layout
      className={`p-4 rounded-xl border transition-all group ${
        isDone ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm hover:border-emerald-200'
      } ${overdue ? 'border-red-200 bg-red-50/30' : ''}`}
    >
      <div className="flex gap-4">
        <button 
          onClick={onToggle}
          className={`shrink-0 mt-1 transition-colors ${isDone ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-500'}`}
        >
          {isDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <h5 className={`font-bold text-sm tracking-tight ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
              {task.title}
            </h5>
            <div className="flex items-center gap-2 shrink-0">
               <PriorityBadge priority={task.priority} />
               <button 
                onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-all"
               >
                 <Trash2 size={14} />
               </button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="mt-4 flex items-center gap-4">
             <div className={`flex items-center gap-1.5 py-1 px-2 rounded bg-slate-100 text-[10px] font-bold ${overdue ? 'text-red-600 bg-red-100' : 'text-slate-500'}`}>
                <Clock size={12} />
                <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo'}</span>
                {overdue && <AlertCircle size={10} />}
             </div>

             {task.assignedToName && (
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <User size={12} />
                  <span>{task.assignedToName}</span>
               </div>
             )}

             {task.comments && (
               <div className="flex items-center gap-1 text-[10px] font-bold text-slate-300">
                  <MessageSquare size={12} />
               </div>
             )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const styles = {
    [TaskPriority.LOW]: 'text-slate-400 bg-slate-100',
    [TaskPriority.MEDIUM]: 'text-sky-600 bg-sky-50',
    [TaskPriority.HIGH]: 'text-amber-600 bg-amber-50',
    [TaskPriority.URGENT]: 'text-red-600 bg-red-50',
  };

  const labels = {
    [TaskPriority.LOW]: 'Baixa',
    [TaskPriority.MEDIUM]: 'Média',
    [TaskPriority.HIGH]: 'Alta',
    [TaskPriority.URGENT]: 'Urgente',
  };

  return (
    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${styles[priority]}`}>
      {labels[priority]}
    </span>
  );
}

function AddTaskModal({ opportunityId, onClose }: { opportunityId: string, onClose: () => void }) {
  const { company } = React.useContext(CompanyContext);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    dueDate: '',
    assignedToName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !auth.currentUser) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'tasks'), {
        ...formData,
        status: TaskStatus.TODO,
        opportunityId,
        companyId: company.id,
        creatorId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-10 p-6 bg-white flex flex-col">
       <div className="flex items-center justify-between mb-8">
          <h4 className="text-xl font-bold tracking-tight text-slate-800 underline decoration-emerald-500 decoration-4">Nova Tarefa Operacional</h4>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
       </div>

       <form onSubmit={handleSubmit} className="space-y-6 flex-1">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Título da Tarefa</label>
            <input 
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              type="text" 
              placeholder="Ex: Baixar atestados técnicos"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50/50 font-bold"
            />
          </div>

          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Descrição / Escopo</label>
             <textarea 
               value={formData.description}
               onChange={(e) => setFormData({...formData, description: e.target.value})}
               rows={3}
               className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50/50 resize-none text-sm"
               placeholder="Detalhe o que precisa ser feito..."
             />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Prioridade</label>
              <select 
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as TaskPriority})}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50/50 font-bold text-xs"
              >
                <option value={TaskPriority.LOW}>Baixa</option>
                <option value={TaskPriority.MEDIUM}>Média</option>
                <option value={TaskPriority.HIGH}>Alta</option>
                <option value={TaskPriority.URGENT}>Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Prazo Final</label>
              <input 
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                type="date" 
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50/50 font-bold"
              />
            </div>
          </div>

          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Responsável</label>
             <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  value={formData.assignedToName}
                  onChange={(e) => setFormData({...formData, assignedToName: e.target.value})}
                  type="text" 
                  placeholder="Nome do membro da equipe"
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50/50"
                />
             </div>
          </div>

          <div className="mt-auto pt-6 flex gap-3 border-t border-slate-100">
             <button 
               type="button"
               onClick={onClose}
               className="flex-1 py-3 border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-colors"
             >
               Cancelar
             </button>
             <button 
               type="submit"
               disabled={isSubmitting}
               className="flex-[2] py-3 bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 flex items-center justify-center gap-2"
             >
               <Save size={18} />
               Salvar Tarefa
             </button>
          </div>
       </form>
    </div>
  );
}
