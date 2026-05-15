import React from 'react';
import { 
  Gavel, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Clock, 
  BarChart3,
  ChevronRight,
  ArrowRight,
  Star,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onLogin: () => void;
  loginError: string | null;
}

export function LandingPage({ onLogin, loginError }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <Gavel className="text-white" size={18} />
              </div>
              <span className="font-black text-xl tracking-tighter uppercase italic">
                Licita<span className="text-emerald-600">Semper</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors uppercase tracking-widest text-[10px]">Funcionalidades</a>
              <a href="#plans" className="text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors uppercase tracking-widest text-[10px]">Planos</a>
              <button 
                onClick={onLogin}
                className="bg-emerald-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10 active:scale-95"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6">
                O Futuro das Licitações
              </span>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tightest leading-tight mb-8">
                Ganhe mais <span className="text-emerald-600 italic">editais</span> com inteligência de dados.
              </h1>
              <p className="text-lg text-slate-500 mb-10 leading-relaxed font-medium">
                O LicitaSemper é o Micro-SaaS definitivo para empresas que buscam 
                escala em licitações públicas, unindo automação, análise de riscos por IA 
                e gestão estratégica em um só lugar.
              </p>
              
              {loginError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-left max-w-md mx-auto">
                  <ShieldCheck className="text-red-500 shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-red-600 font-medium">{loginError}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={onLogin}
                  className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-slate-800 transition-all group active:scale-95 shadow-xl shadow-slate-900/10"
                >
                  Começar Agora Grátis
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <a 
                  href="#features"
                  className="w-full sm:w-auto bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                >
                  Ver Funcionalidades
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Abstract Background Decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-emerald-400 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-blue-400 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </section>

      {/* Stats/Proof */}
      <section className="py-12 border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem label="Taxa de Vitória" value="+32%" icon={<TrendingUp size={20} />} />
            <StatItem label="Tempo de Triagem" value="-70%" icon={<Clock size={20} />} />
            <StatItem label="Conformidade" value="100%" icon={<ShieldCheck size={20} />} />
            <StatItem label="Usuários Ativos" value="500+" icon={<Users size={20} />} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 block">Estratégia Pura</span>
            <h2 className="text-4xl font-black text-slate-900 tracking-tightest">
              Por que sua empresa <br />
              <span className="text-emerald-600 italic underline decoration-slate-200 underline-offset-8">precisa do LicitaSemper?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="text-amber-500" />}
              title="Triagem com IA"
              description="Nosso algoritmo analisa o edital e cruza com suas capacidades técnicas em segundos, dando um score de viabilidade real."
            />
            <FeatureCard 
              icon={<ShieldCheck className="text-emerald-500" />}
              title="Cofre de Documentos"
              description="Gerencie certidões, balanços e atestados em um repositório centralizado com avisos automáticos de vencimento."
            />
            <FeatureCard 
              icon={<BarChart3 className="text-blue-500" />}
              title="Dashboards de Gestão"
              description="Visualize seu pipeline de vendas públicas, VGV (Valor Geral de Vendas) e taxas de conversão por órgão ou modalidade."
            />
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 tracking-tightest mb-4">Escolha seu plano</h2>
            <p className="text-slate-500 font-medium tracking-tight">Escalabilidade para empresas de todos os tamanhos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-slate-50 p-10 rounded-3xl border border-slate-200 hover:border-emerald-500/50 transition-all group">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-black tracking-tight mb-2">Startup</h3>
                  <p className="text-slate-500 text-sm font-medium">Ideal para quem está começando.</p>
                </div>
                <Zap className="text-slate-400 group-hover:text-emerald-500 transition-colors" size={24} />
              </div>
              <div className="mb-8">
                <span className="text-4xl font-black tracking-tighter">R$ 0</span>
                <span className="text-slate-400 text-sm font-medium ml-2">/sempre</span>
              </div>
              <ul className="space-y-4 mb-10">
                <PlanFeature label="Até 5 Monitoramentos" />
                <PlanFeature label="Triagem Manual" />
                <PlanFeature label="Cofre Básico (3 docs)" />
                <PlanFeature label="Suporte via Comunidade" />
              </ul>
              <button 
                onClick={onLogin}
                className="w-full py-4 bg-white border border-slate-200 text-slate-900 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
              >
                Começar Agora
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl shadow-slate-900/50 relative overflow-hidden ring-4 ring-emerald-500/20">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-bl-xl">
                Mais Popular
              </div>
              <div className="flex justify-between items-start mb-8 text-white">
                <div>
                  <h3 className="text-xl font-black tracking-tight mb-2">Enterprise</h3>
                  <p className="text-slate-400 text-sm font-medium">Para operação profissional de larga escala.</p>
                </div>
                <Star className="text-emerald-500 fill-emerald-500" size={24} />
              </div>
              <div className="mb-8 text-white">
                <span className="text-4xl font-black tracking-tighter">R$ 297</span>
                <span className="text-slate-400 text-sm font-medium ml-2">/mês</span>
              </div>
              <ul className="space-y-4 mb-10 text-slate-300">
                <PlanFeature label="Monitoramentos Ilimitados" isLight />
                <PlanFeature label="Scoring Motor por IA" isLight />
                <PlanFeature label="Cofre Ilimitado + Alertas" isLight />
                <PlanFeature label="Dashboard Gerencial Avançado" isLight />
                <PlanFeature label="Suporte Prioritário 24/7" isLight />
              </ul>
              <button 
                onClick={onLogin}
                className="w-full py-4 bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
              >
                Assinar Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 pt-20 pb-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-20">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-6">
                <Gavel className="text-emerald-500" size={24} />
                <span className="font-black text-xl tracking-tighter uppercase italic text-white">
                  Licita<span className="text-emerald-500">Semper</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                A plataforma definitiva para empresas que querem dominar o mercado 
                de licitações públicas com tecnologia e estratégia.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
              <div>
                <h4 className="text-white text-[10px] font-black uppercase tracking-[0.2em] mb-6">Produto</h4>
                <ul className="space-y-4">
                  <li><a href="#features" className="text-slate-400 text-xs hover:text-white transition-colors">Funcionalidades</a></li>
                  <li><a href="#plans" className="text-slate-400 text-xs hover:text-white transition-colors">Preços</a></li>
                  <li><a href="#" className="text-slate-400 text-xs hover:text-white transition-colors">API Docs</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white text-[10px] font-black uppercase tracking-[0.2em] mb-6">Empresa</h4>
                <ul className="space-y-4">
                  <li><a href="#" className="text-slate-400 text-xs hover:text-white transition-colors">Sobre Nós</a></li>
                  <li><a href="#" className="text-slate-400 text-xs hover:text-white transition-colors">Carreiras</a></li>
                  <li><a href="#" className="text-slate-400 text-xs hover:text-white transition-colors">Blog</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white text-[10px] font-black uppercase tracking-[0.2em] mb-6">Legal</h4>
                <ul className="space-y-4">
                  <li><a href="#" className="text-slate-400 text-xs hover:text-white transition-colors">Privacidade</a></li>
                  <li><a href="#" className="text-slate-400 text-xs hover:text-white transition-colors">Termos de Uso</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">© 2024 LicitaSemper. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500/20 transition-colors cursor-pointer group">
                <ChevronRight size={14} className="text-slate-500 group-hover:text-emerald-500" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500/20 transition-colors cursor-pointer group">
                <ChevronRight size={14} className="text-slate-500 group-hover:text-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatItem({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-emerald-600 mb-3">{icon}</div>
      <div className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{value}</div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
        {icon}
      </div>
      <h3 className="text-lg font-black text-slate-900 tracking-tight mb-3">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed font-medium">
        {description}
      </p>
    </div>
  );
}

function PlanFeature({ label, isLight = false }: { label: string, isLight?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <CheckCircle2 className={isLight ? 'text-emerald-500' : 'text-emerald-600'} size={18} />
      <span className="text-sm font-medium tracking-tight">{label}</span>
    </li>
  );
}
