import { useEffect, useMemo, useState } from 'react';
import { supabase, Conversa, Mensagem } from '../lib/supabase';
import { format } from 'date-fns';
import { useRealtimeMessages } from '../hooks/useRealtimeMessages';

export default function ConversasPage() {
  const { mensagens, conversas, novasMensagens, marcarMensagemComoLida, requestNotificationPermission } = useRealtimeMessages();
  const [filtro, setFiltro] = useState('');
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [statusRealtime, setStatusRealtime] = useState<'connecting' | 'connected' | 'disconnected'>('connected');

  // Configurar permissões e seleção inicial
  useEffect(() => {
    // Solicitar permissão para notificações
    requestNotificationPermission();
    
    // Selecionar primeira conversa se existir
    if (conversas.length > 0 && !selecionada) {
      setSelecionada(conversas[0].id_conversa);
    }
    
    setCarregando(false);
  }, [conversas, selecionada, requestNotificationPermission]);

  // Filtrar conversas
  const conversasFiltradas = useMemo(() => {
    if (!filtro) return conversas;
    const f = filtro.toLowerCase();
    return conversas.filter(c => c.nome_contato.toLowerCase().includes(f));
  }, [filtro, conversas]);

  // Mensagens da conversa selecionada
  const mensagensConversa = useMemo(() => {
    if (!selecionada) return [];
    
    // Encontrar a conversa selecionada
    const conversaSelecionada = conversas.find(c => c.id_conversa === selecionada);
    if (!conversaSelecionada) return [];
    
    // Retornar as mensagens da conversa (já agrupadas pelo hook)
    return conversaSelecionada.mensagens || [];
  }, [conversas, selecionada]);

  // Conversa selecionada
  const conversaSelecionada = useMemo(() => {
    return conversas.find(c => c.id_conversa === selecionada);
  }, [conversas, selecionada]);

  // Scroll automático inteligente
  useEffect(() => {
    const scrollToBottom = () => {
      const chatContainer = document.getElementById('chat-container');
      if (chatContainer) {
        // Scroll suave para o final
        chatContainer.scrollTo({
          top: chatContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    };

    // Scroll automático quando há novas mensagens ou muda de conversa
    if (mensagensConversa.length > 0) {
      scrollToBottom();
    }
  }, [mensagensConversa.length, selecionada]);

  // Scroll automático quando uma nova mensagem chega
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer && mensagensConversa.length > 0) {
      // Verificar se o usuário está próximo do final (dentro de 100px)
      const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100;
      
      if (isNearBottom) {
        setTimeout(() => {
          chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
          });
        }, 50);
      }
    }
  }, [mensagensConversa]);

  // Enviar mensagem
  const enviarMensagem = async () => {
    if (!selecionada || !texto.trim() || enviando) return;
    
    setEnviando(true);
    
    try {
      // Preparar payload para enviar via nosso servidor
      const payload = {
        id_conversa: selecionada,
        conteudo: texto.trim(),
        remetente: 'operador',
        timestamp: new Date().toISOString()
      };
      
      console.log('Enviando mensagem via servidor:', payload);
      
      // Enviar através do nosso servidor que encaminha para o webhook
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('Mensagem enviada com sucesso');
        setTexto('');
        
        // A mensagem será adicionada automaticamente via realtime quando for salva no banco
        // Scroll para o final após enviar
        setTimeout(() => {
          const chatContainer = document.getElementById('chat-container');
          if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        }, 100);
        
      } else {
        const errorText = await response.text();
        console.error('Erro ao enviar mensagem:', response.status, response.statusText, errorText);
        
        let errorMessage = 'Erro desconhecido';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || `Erro ${response.status}`;
        }
        
        alert(`Erro ao enviar mensagem: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Verifique se o servidor está rodando.');
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-neutral-400">Carregando conversas...</div>
      </div>
    );
  }

  return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Conversas</h1>
            <p className="text-neutral-400 mt-1">Gerencie suas conversas do WhatsApp</p>
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              statusRealtime === 'connected' ? 'bg-green-500 animate-pulse' :
              statusRealtime === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`}></div>
            <span className="text-sm text-neutral-400">
              {statusRealtime === 'connected' ? 'Tempo real ativo' :
               statusRealtime === 'connecting' ? 'Conectando...' :
               'Desconectado'}
            </span>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[70vh]">
        {/* Lista de Conversas */}
        <div className="lg:col-span-4 xl:col-span-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col">
          {/* Header da Lista */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Conversas</h2>
              <div className="text-sm text-neutral-400">
                {conversasFiltradas.length} de {conversas.length}
              </div>
            </div>
            
            {/* Search Bar Melhorado */}
            <div className="relative">
              <input 
                value={filtro} 
                onChange={e => setFiltro(e.target.value)} 
                placeholder="Buscar conversa..." 
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-whatsapp-500 focus:border-transparent transition-all duration-200" 
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Lista de Conversas */}
          <div className="flex-1 overflow-y-auto chat-scroll">
            {conversasFiltradas.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-neutral-400">
                  <div className="text-4xl mb-3">💬</div>
                  <div className="text-lg font-medium mb-1">
                    {conversas.length === 0 ? 'Nenhuma conversa' : 'Nenhum resultado'}
                  </div>
                  <div className="text-sm">
                    {conversas.length === 0 ? 'As conversas aparecerão aqui' : 'Tente outro termo de busca'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {conversasFiltradas.map((c, index) => {
                  const mensagensCount = mensagens.filter(m => (m.id_conversa_fk || m.id_conversa) === c.id_conversa).length;
                  const isSelected = selecionada === c.id_conversa;
                  
                  return (
                    <button 
                      key={c.id_conversa} 
                      onClick={() => setSelecionada(c.id_conversa)} 
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 hover:shadow-md group ${
                        isSelected 
                          ? 'border-whatsapp-500 bg-gradient-to-r from-whatsapp-500/20 to-whatsapp-600/20 shadow-lg shadow-whatsapp-500/20' 
                          : 'border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                          isSelected 
                            ? 'bg-gradient-to-r from-whatsapp-500 to-whatsapp-600' 
                            : 'bg-gradient-to-r from-neutral-600 to-neutral-700'
                        }`}>
                          {c.nome_contato.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className={`font-semibold truncate ${
                              isSelected ? 'text-white' : 'text-white'
                            }`}>
                              {c.nome_contato}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                              isSelected 
                                ? 'bg-whatsapp-500/30 text-whatsapp-200' 
                                : 'bg-neutral-700 text-neutral-400'
                            }`}>
                              {mensagensCount}
                            </div>
                          </div>
                          
                          <div className={`text-sm truncate mb-2 ${
                            isSelected ? 'text-whatsapp-100' : 'text-neutral-400'
                          }`}>
                            {c.ultima_mensagem || 'Nenhuma mensagem'}
                          </div>
                          
                          <div className={`text-xs ${
                            isSelected ? 'text-whatsapp-200' : 'text-neutral-500'
                          }`}>
                            {format(new Date(c.timestamp), 'dd/MM HH:mm')}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-8 xl:col-span-9 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col">
          {conversaSelecionada ? (
            <>
              {/* Header do Chat */}
              <div className="border-b border-neutral-800 pb-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-whatsapp-500 to-whatsapp-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {conversaSelecionada.nome_contato.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-lg truncate">{conversaSelecionada.nome_contato}</div>
                    <div className="text-sm text-neutral-400 flex items-center gap-2">
                      <span>{mensagensConversa.length} mensagem(s)</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                        Online
                      </span>
                    </div>
                  </div>
                  
                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
                      <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                      </svg>
                    </button>
                    <button className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
                      <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <div 
                className="flex-1 overflow-y-auto mb-6 min-h-96 max-h-[600px] px-2 chat-scroll"
                id="chat-container"
              >
                {mensagensConversa.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-neutral-400">
                      <div className="text-4xl mb-2">💬</div>
                      <div className="text-lg font-medium">Nenhuma mensagem ainda</div>
                      <div className="text-sm">Inicie uma conversa enviando uma mensagem</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    {mensagensConversa.map((m, index) => {
                      const isNewMessage = index === mensagensConversa.length - 1 && 
                                          m.remetente !== 'operador' && 
                                          new Date(m.timestamp).getTime() > Date.now() - 5000; // Últimos 5 segundos
                      
                      const isOperador = m.remetente === 'operador';
                      const isContato = m.remetente === 'contato';
                      
                      return (
                        <div 
                          key={m.id || `${m.timestamp}-${m.conteudo.slice(0, 10)}`} 
                          className={`flex ${isOperador ? 'justify-end' : 'justify-start'} transition-all duration-300 ${
                            isNewMessage ? (isOperador ? 'animate-slide-in-right' : 'animate-slide-in-left') : 'animate-fade-in'
                          }`}
                        >
                          <div className={`max-w-[75%] ${isOperador ? 'order-2' : 'order-1'}`}>
                            {/* Timestamp */}
                            <div className={`text-xs text-neutral-500 mb-1 ${isOperador ? 'text-right' : 'text-left'}`}>
                              {format(new Date(m.timestamp), 'HH:mm')}
                            </div>
                            
                            {/* Mensagem */}
                            <div 
                              className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${
                                isOperador 
                                  ? 'bg-gradient-to-r from-whatsapp-500 to-whatsapp-600 text-white rounded-br-md' 
                                  : isContato
                                    ? 'bg-neutral-700 text-white rounded-bl-md'
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-bl-md'
                              } ${isNewMessage ? 'animate-pulse-glow' : ''}`}
                            >
                              <div className="whitespace-pre-wrap break-words leading-relaxed">
                                {m.conteudo}
                              </div>
                            </div>
                            
                            {/* Status da mensagem */}
                            <div className={`text-xs text-neutral-500 mt-1 ${isOperador ? 'text-right' : 'text-left'}`}>
                              {isOperador ? 'Você' : m.remetente}
                              {isNewMessage && (
                                <span className="ml-2 text-whatsapp-400 font-medium">• Nova</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    rows={1}
                    disabled={enviando}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl px-4 py-3 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-whatsapp-500 focus:border-transparent resize-none transition-all duration-200 min-h-[48px] max-h-32"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#374151 #1f2937'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                    }}
                  />
                  {/* Indicador de digitação */}
                  {texto.length > 0 && (
                    <div className="absolute bottom-2 right-3 text-xs text-neutral-500">
                      {texto.length}
                    </div>
                  )}
                </div>
                <button 
                  onClick={enviarMensagem}
                  disabled={!texto.trim() || enviando}
                  className="h-12 w-12 bg-gradient-to-r from-whatsapp-500 to-whatsapp-600 hover:from-whatsapp-600 hover:to-whatsapp-700 disabled:from-neutral-700 disabled:to-neutral-700 disabled:cursor-not-allowed text-white rounded-full transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  {enviando ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-neutral-400">
                <div className="text-6xl mb-4">💬</div>
                <div className="text-xl font-medium mb-2">Selecione uma conversa</div>
                <div className="text-sm">Escolha uma conversa da lista para começar a conversar</div>
              </div>
            </div>
          )}
        </div>

        {/* Detalhes - Oculto em telas menores */}
        <div className="hidden xl:block xl:col-span-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          {conversaSelecionada ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Detalhes</h3>
                <button className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Avatar e Nome */}
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-whatsapp-500 to-whatsapp-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
                    {conversaSelecionada.nome_contato.charAt(0).toUpperCase()}
                  </div>
                  <div className="font-semibold text-white text-lg">{conversaSelecionada.nome_contato}</div>
                  <div className="text-sm text-neutral-400 mt-1">Contato WhatsApp</div>
                </div>
                
                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-whatsapp-500">{mensagensConversa.length}</div>
                    <div className="text-sm text-neutral-400">Mensagens</div>
                  </div>
                  <div className="bg-neutral-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      {format(new Date(conversaSelecionada.timestamp), 'dd')}
                    </div>
                    <div className="text-sm text-neutral-400">Última atividade</div>
                  </div>
                </div>
                
                {/* Informações */}
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-neutral-400 mb-1">Última mensagem</div>
                    <div className="text-sm text-white bg-neutral-800 rounded-lg p-3">
                      {conversaSelecionada.ultima_mensagem || 'Nenhuma mensagem'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-neutral-400 mb-1">Status</div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-white">Ativa</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-neutral-400 mb-1">Criada em</div>
                    <div className="text-sm text-white">
                      {format(new Date(conversaSelecionada.timestamp), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-neutral-400">
                <div className="text-4xl mb-3">📊</div>
                <div className="text-lg font-medium mb-1">Detalhes da conversa</div>
                <div className="text-sm">Selecione uma conversa para ver informações detalhadas</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <h3 className="font-semibold text-white mb-2">Status</h3>
        <div className="text-sm text-neutral-400 space-y-1">
          <div>Total de conversas: {conversas.length}</div>
          <div>Total de mensagens: {mensagens.length}</div>
          <div>Novas mensagens: {novasMensagens.length}</div>
          <div>Conversa selecionada: {conversaSelecionada?.nome_contato || 'Nenhuma'}</div>
          <div>Mensagens na conversa: {mensagensConversa.length}</div>
          <div>Status realtime: {statusRealtime}</div>
        </div>
      </div>
    </div>
  );
}