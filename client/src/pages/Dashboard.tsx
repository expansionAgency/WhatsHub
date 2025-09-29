import { useEffect, useMemo, useState } from 'react';
import { format, startOfDay, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { supabase, Conversa, Mensagem } from '../lib/supabase';

type Periodo = 'Diário' | 'Semanal' | 'Mensal' | 'Anual';

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState<Periodo>('Mensal');
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { start } = getRange(periodo);
        const { data: conv } = await supabase
          .from('conversas')
          .select('*')
          .gte('timestamp', start.toISOString());
        const { data: msgs } = await supabase
          .from('mensagens')
          .select('*')
          .gte('timestamp', start.toISOString());
        setConversas(conv || []);
        setMensagens(msgs || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Dados de fallback
        setConversas([]);
        setMensagens([]);
      }
    };
    fetchData();
  }, [periodo]);

  const kpis = useMemo(() => {
    const recebidas = mensagens.filter(m => m.remetente !== 'operador').length;
    const respondidas = mensagens.filter(m => m.remetente === 'operador').length;
    const oportunidades = conversas.filter(c => c.status === 'ativa').length;
    const taxa = recebidas ? Math.round((respondidas / recebidas) * 100) : 0;
    return { recebidas, respondidas, oportunidades, taxa };
  }, [mensagens, conversas]);

  const lineData = useMemo(() => {
    const { start } = getRange(periodo);
    const buckets = new Map<string, { r: number; s: number }>();
    const bucketKey = (d: Date) => {
      if (periodo === 'Diário') return format(d, 'HH:mm');
      if (periodo === 'Semanal') return format(d, 'EEE dd');
      if (periodo === 'Mensal') return format(d, 'dd/MM');
      return format(d, 'MMM/yyyy');
    };
    for (const m of mensagens) {
      const ts = new Date(m.timestamp);
      if (ts < start) continue;
      const key = bucketKey(ts);
      const b = buckets.get(key) || { r: 0, s: 0 };
      if (m.remetente === 'operador') b.s += 1; else b.r += 1;
      buckets.set(key, b);
    }
    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, v]) => ({ name, Recebidas: v.r, Respondidas: v.s }));
  }, [mensagens, periodo]);

  const pieData = useMemo(() => {
    const byHour = new Array(24).fill(0);
    for (const m of mensagens) {
      if (m.remetente === 'operador') continue;
      const h = new Date(m.timestamp).getHours();
      byHour[h]++;
    }
    return byHour.map((v, i) => ({ name: `${i.toString().padStart(2, '0')}:00`, value: v }))
      .filter(d => d.value > 0);
  }, [mensagens]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-neutral-400 mt-1">Visão geral dos seus dados</p>
        </div>
        <PeriodoSelector value={periodo} onChange={setPeriodo} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Mensagens Recebidas" 
          value={kpis.recebidas} 
          icon="💬"
          color="text-blue-400"
          bgColor="bg-blue-500/10"
        />
        <KpiCard 
          title="Mensagens Enviadas" 
          value={kpis.respondidas} 
          icon="✈️"
          color="text-whatsapp-400"
          bgColor="bg-whatsapp-500/10"
        />
        <KpiCard 
          title="Oportunidades" 
          value={kpis.oportunidades} 
          icon="📈"
          color="text-orange-400"
          bgColor="bg-orange-500/10"
        />
        <KpiCard 
          title="Taxa de Resposta" 
          value={`${kpis.taxa}%`} 
          icon="👥"
          color="text-purple-400"
          bgColor="bg-purple-500/10"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Mensagens ao Longo do Tempo</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-neutral-400">Recebidas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-whatsapp-500"></div>
                <span className="text-neutral-400">Enviadas</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <XAxis dataKey="name" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Line type="monotone" dataKey="Recebidas" stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Respondidas" stroke="#25D366" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Distribuição por Horário</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  dataKey="value" 
                  nameKey="name" 
                  innerRadius={60} 
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={idx % 2 === 0 ? '#25D366' : '#1ebe57'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Real-time Widget */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-whatsapp-500/20 flex items-center justify-center">
              <span className="text-whatsapp-500">⚡</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">WhatsHub - Dashboard</h3>
              <p className="text-neutral-400 text-sm">Monitoramento de conversas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-whatsapp-500"></div>
            <span className="text-sm text-neutral-400">Online</span>
          </div>
        </div>
        
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-neutral-800">
                <th className="py-3 pr-4 text-neutral-400 font-medium">Contato</th>
                <th className="py-3 pr-4 text-neutral-400 font-medium">Última Mensagem</th>
                <th className="py-3 pr-4 text-neutral-400 font-medium">Status</th>
                <th className="py-3 pr-4 text-neutral-400 font-medium">Horário</th>
              </tr>
            </thead>
            <tbody>
              {conversas.slice(0, 5).map(c => (
                <tr key={c.id_conversa} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-whatsapp-500 to-whatsapp-600 flex items-center justify-center text-black font-medium text-sm">
                        {c.nome_contato.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{c.nome_contato}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-neutral-300 max-w-xs truncate">
                    {c.ultima_mensagem || 'Sem mensagens'}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      c.status === 'ativa' 
                        ? 'bg-whatsapp-500/20 text-whatsapp-400' 
                        : 'bg-neutral-700 text-neutral-400'
                    }`}>
                      {c.status === 'ativa' ? 'Ativa' : 'Arquivada'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-neutral-400">
                    {format(new Date(c.timestamp), 'dd/MM HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PeriodoSelector({ value, onChange }: { value: Periodo; onChange: (p: Periodo) => void }) {
  const options: Periodo[] = ['Diário', 'Semanal', 'Mensal', 'Anual'];
  return (
    <div className="flex items-center gap-2">
      {options.map(opt => (
        <button key={opt} className={`px-3 py-1 rounded-md border ${value === opt ? 'bg-whatsapp-600 border-whatsapp-600 text-black' : 'border-neutral-700 text-neutral-400 hover:text-white'}`} onClick={() => onChange(opt)}>
          {opt}
        </button>
      ))}
    </div>
  );
}

function KpiCard({ title, value, icon, color, bgColor }: { 
  title: string; 
  value: number | string; 
  icon: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} border border-neutral-800 rounded-xl p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-neutral-400 text-sm font-medium">{title}</div>
          <div className={`text-3xl font-bold mt-2 ${color}`}>{value}</div>
        </div>
        <div className="text-3xl opacity-50">{icon}</div>
      </div>
    </div>
  );
}

function getRange(periodo: Periodo) {
  const now = new Date();
  switch (periodo) {
    case 'Diário':
      return { start: startOfDay(now) };
    case 'Semanal':
      return { start: startOfWeek(now, { weekStartsOn: 1 }) };
    case 'Mensal':
      return { start: startOfMonth(now) };
    case 'Anual':
      return { start: startOfYear(now) };
  }
}