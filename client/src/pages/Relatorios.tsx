import { useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from 'recharts';

const performanceData = [
  { name: 'Segunda', vendas: 12, conversoes: 8, leads: 24 },
  { name: 'Terça', vendas: 19, conversoes: 15, leads: 32 },
  { name: 'Quarta', vendas: 8, conversoes: 6, leads: 18 },
  { name: 'Quinta', vendas: 15, conversoes: 12, leads: 28 },
  { name: 'Sexta', vendas: 22, conversoes: 18, leads: 35 },
  { name: 'Sábado', vendas: 28, conversoes: 22, leads: 42 },
  { name: 'Domingo', vendas: 16, conversoes: 12, leads: 26 },
];

export default function RelatoriosPage() {
  const [tipoRelatorio, setTipoRelatorio] = useState('Performance');
  const [periodo, setPeriodo] = useState('Semanal');

  const relatorios = [
    { nome: 'Performance', icon: '📊', descricao: 'Análise de performance de vendas' },
    { nome: 'Conversas', icon: '💬', descricao: 'Relatório de conversas e engajamento' },
    { nome: 'Financeiro', icon: '💰', descricao: 'Relatório financeiro detalhado' },
    { nome: 'Clientes', icon: '👥', descricao: 'Análise de comportamento dos clientes' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Relatórios</h1>
          <p className="text-neutral-400 mt-1">Análises detalhadas e insights do negócio</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={periodo} 
            onChange={(e) => setPeriodo(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="Diário">Diário</option>
            <option value="Semanal">Semanal</option>
            <option value="Mensal">Mensal</option>
            <option value="Anual">Anual</option>
          </select>
          <button className="btn-primary">
            📥 Exportar
          </button>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {relatorios.map((rel) => (
          <button
            key={rel.nome}
            onClick={() => setTipoRelatorio(rel.nome)}
            className={`p-4 rounded-xl border text-left transition-all ${
              tipoRelatorio === rel.nome
                ? 'bg-whatsapp-500/20 border-whatsapp-500 text-white'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <div className="text-2xl mb-2">{rel.icon}</div>
            <div className="font-medium">{rel.nome}</div>
            <div className="text-sm opacity-75">{rel.descricao}</div>
          </button>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-500/10 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-neutral-400 text-sm font-medium">Total de Vendas</div>
              <div className="text-3xl font-bold mt-2 text-blue-400">120</div>
              <div className="text-sm text-green-400 mt-1">+12% vs período anterior</div>
            </div>
            <div className="text-3xl opacity-50">🎯</div>
          </div>
        </div>
        
        <div className="bg-whatsapp-500/10 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-neutral-400 text-sm font-medium">Taxa de Conversão</div>
              <div className="text-3xl font-bold mt-2 text-whatsapp-400">68%</div>
              <div className="text-sm text-green-400 mt-1">+5% vs período anterior</div>
            </div>
            <div className="text-3xl opacity-50">📈</div>
          </div>
        </div>
        
        <div className="bg-orange-500/10 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-neutral-400 text-sm font-medium">Leads Gerados</div>
              <div className="text-3xl font-bold mt-2 text-orange-400">205</div>
              <div className="text-sm text-green-400 mt-1">+8% vs período anterior</div>
            </div>
            <div className="text-3xl opacity-50">🚀</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Performance Semanal</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Bar dataKey="vendas" fill="#25D366" />
                <Bar dataKey="conversoes" fill="#3b82f6" />
                <Bar dataKey="leads" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Tendência de Conversões</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Line type="monotone" dataKey="conversoes" stroke="#25D366" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Report Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Relatório Detalhado - {tipoRelatorio}</h3>
          <button className="text-sm text-whatsapp-500 hover:text-whatsapp-400">
            Ver todos →
          </button>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-neutral-800">
                <th className="py-3 pr-4 text-neutral-400 font-medium">Período</th>
                <th className="py-3 pr-4 text-neutral-400 font-medium">Vendas</th>
                <th className="py-3 pr-4 text-neutral-400 font-medium">Conversões</th>
                <th className="py-3 pr-4 text-neutral-400 font-medium">Taxa</th>
                <th className="py-3 pr-4 text-neutral-400 font-medium">Receita</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((item, index) => (
                <tr key={index} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                  <td className="py-3 pr-4 text-white font-medium">{item.name}</td>
                  <td className="py-3 pr-4 text-neutral-300">{item.vendas}</td>
                  <td className="py-3 pr-4 text-neutral-300">{item.conversoes}</td>
                  <td className="py-3 pr-4">
                    <span className="text-whatsapp-400">
                      {Math.round((item.conversoes / item.leads) * 100)}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-green-400">
                    R$ {(item.vendas * 125).toLocaleString()}
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
