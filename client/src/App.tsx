import { NavLink, Route, Routes } from 'react-router-dom';
import { useState } from 'react';
import DashboardPage from './pages/Dashboard';
import ConversasPage from './pages/Conversas';
import FinancasPage from './pages/Financas';
import RelatoriosPage from './pages/Relatorios';
import AnalyticsPage from './pages/Analytics';
import CalendarioPage from './pages/Calendario';
import ConfiguracoesPage from './pages/Configuracoes';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: '🏠', end: true },
  { path: '/financas', label: 'Finanças', icon: '💰' },
  { path: '/conversas', label: 'Conversas', icon: '💬' },
  { path: '/relatorios', label: 'Relatórios', icon: '📊' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/calendario', label: 'Calendário', icon: '📅' },
  { path: '/configuracoes', label: 'Configurações', icon: '⚙️' },
];

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-neutral-950 flex">
      {/* Sidebar */}
      <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-whatsapp-500 flex items-center justify-center">
              <span className="text-black font-bold text-sm">W</span>
            </div>
            <span className="font-semibold text-whatsapp-500">Dashboard Pro</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-whatsapp-500 text-black font-medium'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-neutral-900 border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-neutral-400">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-whatsapp-500 focus:border-whatsapp-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-neutral-400 hover:text-white relative">
                <span className="text-lg">🔔</span>
              </button>
              <button className="p-2 text-neutral-400 hover:text-white">
                <span className="text-lg">👤</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/financas" element={<FinancasPage />} />
            <Route path="/conversas" element={<ConversasPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/calendario" element={<CalendarioPage />} />
            <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}