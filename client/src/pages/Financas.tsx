import { useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const revenueData = [
  { name: 'Jan', receita: 4000, despesas: 2400 },
  { name: 'Fev', receita: 3000, despesas: 1398 },
  { name: 'Mar', receita: 2000, despesas: 9800 },
  { name: 'Abr', receita: 2780, despesas: 3908 },
  { name: 'Mai', receita: 1890, despesas: 4800 },
  { name: 'Jun', receita: 2390, despesas: 3800 },
];

const expenseCategories = [
  { name: 'Marketing', value: 4000, color: '#25D366' },
  { name: 'Operacional', value: 3000, color: '#1ebe57' },
  { name: 'Tecnologia', value: 2000, color: '#18a34b' },
  { name: 'Recursos Humanos', value: 1000, color: '#059669' },
];

export default function FinancasPage() {
  const [periodo, setPeriodo] = useState('Mensal');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Finanças</h1>
          <p className="text-neutral-400 mt-1">Controle financeiro e análise de receitas</p>
        </div>
        <div className="flex items-center gap-2">
          {['Diário', 'Semanal', 'Mensal', 'Anual'].map(opt => (
            <button 
              key={opt} 
              className={`px-3 py-1 rounded-md border ${periodo === opt ? 'bg-whatsapp-600 border-whatsapp-600 text-black' : 'border-neutral-700 text-neutral-400 hover:text-white'}`} 
              onClick={() => setPeriodo(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-green-500/10 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-neutral-400 text-sm font-medium">Receita Total</div>
              <div className="text-3xl font-bold mt-2 text-green-400">R$ 45.280</div>
            </div>
            <div className="text-3xl opacity-50">💰</div>
          </div>
        </div>
        
        <div className="bg-red-500/10 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-neutral-400 text-sm font-medium">Despesas</div>
              <div className="text-3xl font-bold mt-2 text-red-400">R$ 28.450</div>
            </div>
            <div className="text-3xl opacity-50">📉</div>
          </div>
        </div>
        
        <div className="bg-blue-500/10 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-neutral-400 text-sm font-medium">Lucro Líquido</div>
              <div className="text-3xl font-bold mt-2 text-blue-400">R$ 16.830</div>
            </div>
            <div className="text-3xl opacity-50">📊</div>
          </div>
        </div>
        
        <div className="bg-purple-500/10 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-neutral-400 text-sm font-medium">Margem</div>
              <div className="text-3xl font-bold mt-2 text-purple-400">37.2%</div>
            </div>
            <div className="text-3xl opacity-50">🎯</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Receita vs Despesas</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
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
                <Bar dataKey="receita" fill="#25D366" />
                <Bar dataKey="despesas" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Categorias de Despesa</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={expenseCategories} 
                  dataKey="value" 
                  nameKey="name" 
                  innerRadius={60} 
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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

      {/* Recent Transactions */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Transações Recentes</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-neutral-800">
                <th className="py-3 pr-4 text-neutral-400 font-medium">Data</th>
                <th className="py-3 pr-4 text-neutral-400 font-medium">Descrição</th>
                <th className="py-3 pr-4 text-neutral-400 font-medium">Categoria</th>
                <th className="py-3 pr-4 text-neutral-400 font-medium">Valor</th>
                <th className="py-3 pr-4 text-neutral-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                <td className="py-3 pr-4 text-neutral-300">22/09/2025</td>
                <td className="py-3 pr-4 text-white">Assinatura WhatsApp Business</td>
                <td className="py-3 pr-4 text-neutral-400">Tecnologia</td>
                <td className="py-3 pr-4 text-red-400">-R$ 149,00</td>
                <td className="py-3 pr-4">
                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                    Pago
                  </span>
                </td>
              </tr>
              <tr className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                <td className="py-3 pr-4 text-neutral-300">21/09/2025</td>
                <td className="py-3 pr-4 text-white">Receita de Vendas</td>
                <td className="py-3 pr-4 text-neutral-400">Vendas</td>
                <td className="py-3 pr-4 text-green-400">+R$ 2.500,00</td>
                <td className="py-3 pr-4">
                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                    Recebido
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
