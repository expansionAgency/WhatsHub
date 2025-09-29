import { useState } from 'react';

interface ConfigSection {
  id: string;
  titulo: string;
  descricao: string;
  icon: string;
}

const secoes: ConfigSection[] = [
  { id: 'geral', titulo: 'Geral', descricao: 'Configurações gerais do sistema', icon: '⚙️' },
  { id: 'whatsapp', titulo: 'WhatsApp', descricao: 'Integração e configurações do WhatsApp', icon: '💬' },
  { id: 'notificacoes', titulo: 'Notificações', descricao: 'Preferências de notificações', icon: '🔔' },
  { id: 'usuarios', titulo: 'Usuários', descricao: 'Gerenciamento de usuários e permissões', icon: '👥' },
  { id: 'integracao', titulo: 'Integrações', descricao: 'APIs e webhooks externos', icon: '🔗' },
  { id: 'seguranca', titulo: 'Segurança', descricao: 'Configurações de segurança', icon: '🔒' },
];

export default function ConfiguracoesPage() {
  const [secaoAtiva, setSecaoAtiva] = useState('geral');
  const [configuracoes, setConfiguracoes] = useState({
    // Geral
    nomeEmpresa: 'WhatsHub',
    timezone: 'America/Sao_Paulo',
    idioma: 'pt-BR',
    tema: 'dark',
    
    // WhatsApp
    numeroWhatsApp: '+55 11 99999-9999',
    mensagemBoasVindas: 'Olá! Como posso ajudá-lo?',
    mensagemAusencia: 'No momento não estamos disponíveis. Retornaremos em breve!',
    horarioFuncionamento: '09:00-18:00',
    
    // Notificações
    emailNotificacoes: true,
    pushNotificacoes: true,
    notificarNovasMensagens: true,
    notificarOportunidades: true,
    
    // Integrações
    webhookUrl: 'https://n8n-n8n.we3qg7.easypanel.host/webhook-test/d6d5efa4-4179-406f-9439-25142f1de595',
    apiKey: '****-****-****-****',
    supabaseUrl: 'https://zaupvohmnaiilistuxtl.supabase.co',
  });

  const atualizarConfig = (chave: string, valor: any) => {
    setConfiguracoes(prev => ({ ...prev, [chave]: valor }));
  };

  const salvarConfiguracoes = () => {
    // Aqui você salvaria as configurações
    console.log('Configurações salvas:', configuracoes);
  };

  const renderSecaoGeral = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">Nome da Empresa</label>
        <input
          type="text"
          value={configuracoes.nomeEmpresa}
          onChange={(e) => atualizarConfig('nomeEmpresa', e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white mb-2">Fuso Horário</label>
        <select
          value={configuracoes.timezone}
          onChange={(e) => atualizarConfig('timezone', e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
        >
          <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
          <option value="America/New_York">Nova York (UTC-5)</option>
          <option value="Europe/London">Londres (UTC+0)</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white mb-2">Idioma</label>
        <select
          value={configuracoes.idioma}
          onChange={(e) => atualizarConfig('idioma', e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
        >
          <option value="pt-BR">Português (Brasil)</option>
          <option value="en-US">English (US)</option>
          <option value="es-ES">Español</option>
        </select>
      </div>
    </div>
  );

  const renderSecaoWhatsApp = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">Número do WhatsApp</label>
        <input
          type="text"
          value={configuracoes.numeroWhatsApp}
          onChange={(e) => atualizarConfig('numeroWhatsApp', e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white mb-2">Mensagem de Boas-vindas</label>
        <textarea
          value={configuracoes.mensagemBoasVindas}
          onChange={(e) => atualizarConfig('mensagemBoasVindas', e.target.value)}
          rows={3}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white mb-2">Mensagem de Ausência</label>
        <textarea
          value={configuracoes.mensagemAusencia}
          onChange={(e) => atualizarConfig('mensagemAusencia', e.target.value)}
          rows={3}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white mb-2">Horário de Funcionamento</label>
        <input
          type="text"
          value={configuracoes.horarioFuncionamento}
          onChange={(e) => atualizarConfig('horarioFuncionamento', e.target.value)}
          placeholder="09:00-18:00"
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
        />
      </div>
    </div>
  );

  const renderSecaoNotificacoes = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white font-medium">Notificações por Email</div>
          <div className="text-sm text-neutral-400">Receber notificações por email</div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={configuracoes.emailNotificacoes}
            onChange={(e) => atualizarConfig('emailNotificacoes', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-whatsapp-500"></div>
        </label>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white font-medium">Notificações Push</div>
          <div className="text-sm text-neutral-400">Notificações no navegador</div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={configuracoes.pushNotificacoes}
            onChange={(e) => atualizarConfig('pushNotificacoes', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-whatsapp-500"></div>
        </label>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white font-medium">Novas Mensagens</div>
          <div className="text-sm text-neutral-400">Notificar sobre novas mensagens recebidas</div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={configuracoes.notificarNovasMensagens}
            onChange={(e) => atualizarConfig('notificarNovasMensagens', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-whatsapp-500"></div>
        </label>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white font-medium">Oportunidades</div>
          <div className="text-sm text-neutral-400">Notificar sobre novas oportunidades</div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={configuracoes.notificarOportunidades}
            onChange={(e) => atualizarConfig('notificarOportunidades', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-whatsapp-500"></div>
        </label>
      </div>
    </div>
  );

  const renderSecaoIntegracao = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">Webhook URL (n8n)</label>
        <input
          type="text"
          value={configuracoes.webhookUrl}
          onChange={(e) => atualizarConfig('webhookUrl', e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
        />
        <p className="text-xs text-neutral-400 mt-1">URL para onde as mensagens enviadas serão encaminhadas</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white mb-2">Supabase URL</label>
        <input
          type="text"
          value={configuracoes.supabaseUrl}
          onChange={(e) => atualizarConfig('supabaseUrl', e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white mb-2">API Key</label>
        <input
          type="password"
          value={configuracoes.apiKey}
          onChange={(e) => atualizarConfig('apiKey', e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
        />
      </div>
      
      <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
        <h4 className="text-white font-medium mb-2">Status da Conexão</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-neutral-300">Supabase: Conectado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-neutral-300">Webhook: Ativo</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConteudo = () => {
    switch (secaoAtiva) {
      case 'geral': return renderSecaoGeral();
      case 'whatsapp': return renderSecaoWhatsApp();
      case 'notificacoes': return renderSecaoNotificacoes();
      case 'integracao': return renderSecaoIntegracao();
      default: return <div className="text-neutral-400">Seção em desenvolvimento...</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-neutral-400 mt-1">Gerencie as configurações do sistema</p>
        </div>
        <button onClick={salvarConfiguracoes} className="btn-primary">
          💾 Salvar Alterações
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Menu Lateral */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <nav className="space-y-2">
            {secoes.map(secao => (
              <button
                key={secao.id}
                onClick={() => setSecaoAtiva(secao.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  secaoAtiva === secao.id
                    ? 'bg-whatsapp-500/20 text-whatsapp-400 border border-whatsapp-500/30'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{secao.icon}</span>
                  <div>
                    <div className="font-medium">{secao.titulo}</div>
                    <div className="text-xs opacity-75">{secao.descricao}</div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Conteúdo */}
        <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">
              {secoes.find(s => s.id === secaoAtiva)?.titulo}
            </h2>
            <p className="text-neutral-400 text-sm mt-1">
              {secoes.find(s => s.id === secaoAtiva)?.descricao}
            </p>
          </div>

          {renderConteudo()}
        </div>
      </div>
    </div>
  );
}
