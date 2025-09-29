import { useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, AreaChart, Area, BarChart, Bar } from 'recharts';

const analyticsData = [
  { name: 'Jan', usuarios: 1200, sessoes: 2400, pageviews: 4800, bounce: 0.35 },
  { name: 'Fev', usuarios: 1900, sessoes: 3200, pageviews: 6400, bounce: 0.32 },
  { name: 'Mar', usuarios: 2200, sessoes: 3800, pageviews: 7200, bounce: 0.28 },
  { name: 'Abr', usuarios: 2800, sessoes: 4200, pageviews: 8400, bounce: 0.25 },
  { name: 'Mai', usuarios: 3200, sessoes: 4800, pageviews: 9600, bounce: 0.22 },
  { name: 'Jun', usuarios: 3800, sessoes: 5400, pageviews: 10800, bounce: 0.20 },
];

const deviceData = [
  { name: 'Desktop', value: 45, color: '#25D366' },
  { name: 'Mobile', value: 40, color: '#1ebe57' },
  { name: 'Tablet', value: 15, color: '#18a34b' },
];

const channelData = [
  { name: 'Orgânico', usuarios: 1200, conversoes: 180 },
  { name: 'Direto', usuarios: 800, conversoes: 120 },
  { name: 'Social', usuarios: 600, conversoes: 90 },
  { name: 'Email', usuarios: 400, conversoes: 80 },
  { name: 'Pago', usuarios: 300, conversoes: 75 },
];

export default function AnalyticsPage() {
  const [metrica, setMetrica] = useState('Usuarios');
  const [periodo, setPeriodo] = useState('6M');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-neutral-400 mt-1">Análise avançada de dados e comportamento</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={metrica} 
            onChange={(e) => setMetrica(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="Usuarios">Usuários</option>
            <option value="Sessoes">Sessões</option>
            <option value="Pageviews">Page Views</option>
            <option value="Bounce">Taxa de Rejeição</option>
          </select>
          <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
            {['7D', '30D', '3M', '6M', '1A'].map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  periodo === p ? 'bg-whatsapp-500 text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-500/10 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-neutral-400 text-sm font-medium">Usuários Únicos</div>
              <div className="text-3xl font-bold mt-2 text-blue-400">18.2K</div>
              <div className="text-sm text-green-400 mt-1">+15.3% vs mês anterior</div>
            </div>
            <div className="text-3xl opacity-50">👥</div>
          </div>
        </div>
        
        <div className="bg-whatsapp-500/10 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-neutral-400 text-sm font-medium">Sessões</div>
              <div className="text-3xl font-bold mt-2 text-whatsapp-400">32.8K</div>
              <div className="text-sm text-green-400 mt-1">+12.7% vs mês anterior</div>
            </div>
            <div className="text-3xl opacity-50">📊</div>
          </div>
        </div>
        
        <div className="bg-purple-500/10 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-neutral-400 text-sm font-medium">Page Views</div>
              <div className="text-3xl font-bold mt-2 text-purple-400">64.2K</div>
              <div className="text-sm text-green-400 mt-1">+8.9% vs mês anterior</div>
            </div>
            <div className="text-3xl opacity-50">📄</div>
          </div>
        </div>
        
        <div className="bg-orange-500/10 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-neutral-400 text-sm font-medium">Taxa de Rejeição</div>
              <div className="text-3xl font-bold mt-2 text-orange-400">24.5%</div>
              <div className="text-sm text-green-400 mt-1">-3.2% vs mês anterior</div>
            </div>
            <div className="text-3xl opacity-50">⚡</div>
          </div>
        </div>
      </div>

      {/* Main Analytics Chart */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Tendência de {metrica}</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-whatsapp-500"></div>
              <span className="text-neutral-400">{metrica}</span>
            </div>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsData}>
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
              <Area 
                type="monotone" 
                dataKey={metrica.toLowerCase()} 
                stroke="#25D366" 
                fill="url(#colorGradient)" 
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#25D366" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#25D366" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Canais de Aquisição</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData}>
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
                <Bar dataKey="usuarios" fill="#25D366" />
                <Bar dataKey="conversoes" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Dispositivos</h3>
          <div className="space-y-4">
            {deviceData.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: device.color }}
                  ></div>
                  <span className="text-white">{device.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${device.value}%`, 
                        backgroundColor: device.color 
                      }}
                    ></div>
                  </div>
                  <span className="text-neutral-400 text-sm w-10 text-right">{device.value}%</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-neutral-800">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-whatsapp-400">2.4</div>
                <div className="text-sm text-neutral-400">Sessões/Usuário</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">3:42</div>
                <div className="text-sm text-neutral-400">Tempo Médio</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Analytics */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-whatsapp-500/20 flex items-center justify-center">
              <span className="text-whatsapp-500">📈</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Analytics em Tempo Real</h3>
              <p className="text-neutral-400 text-sm">Dados atualizados a cada 30 segundos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm text-neutral-400">Ao vivo</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
            <div className="text-2xl font-bold text-whatsapp-400">127</div>
            <div className="text-sm text-neutral-400">Usuários Online</div>
          </div>
          <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">43</div>
            <div className="text-sm text-neutral-400">Páginas Ativas</div>
          </div>
          <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">8</div>
            <div className="text-sm text-neutral-400">Conversões/Hora</div>
          </div>
          <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
            <div className="text-2xl font-bold text-orange-400">2:15</div>
            <div className="text-sm text-neutral-400">Tempo Médio</div>
          </div>
        </div>
      </div>
    </div>
  );
}
