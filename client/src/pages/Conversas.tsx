import { useEffect, useMemo, useState } from 'react';
import { supabase, Conversa, Mensagem } from '../lib/supabase';
import { format } from 'date-fns';

export default function ConversasPage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [filtro, setFiltro] = useState('');
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [statusRealtime, setStatusRealtime] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Carregar todas as mensagens e configurar realtime
  useEffect(() => {
    const carregarMensagens = async () => {
      try {
        console.log('Carregando mensagens...');
        
        const { data: mensagensData, error } = await supabase
          .from('mensagens')
          .select('*')
          .order('timestamp', { ascending: true });
        
        if (error) {
          console.error('Erro ao carregar mensagens:', error);
        } else {
          console.log('Mensagens carregadas:', mensagensData);
          setMensagens(mensagensData || []);
          
          // Selecionar primeira conversa se existir
          if (mensagensData && mensagensData.length > 0 && !selecionada) {
            const primeiraConversa = mensagensData[0].id_conversa || mensagensData[0].id_conversa_fk;
            if (primeiraConversa) {
              setSelecionada(primeiraConversa);
            }
          }
        }
      } catch (error) {
        console.error('Erro geral:', error);
      } finally {
        setCarregando(false);
      }
    };

    carregarMensagens();

    // Configurar subscription para novas mensagens
    console.log('Configurando subscription para mensagens...');
    
    const subscription = supabase
      .channel('mensagens_realtime')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'mensagens' },
        (payload) => {
          console.log('Nova mensagem recebida via realtime:', payload);
          
          const novaMensagem = payload.new as Mensagem;
          
          // Adicionar a nova mensagem ao estado
          setMensagens(prev => {
            // Verificar se a mensagem já existe para evitar duplicatas
            const jaExiste = prev.some(m => m.id === novaMensagem.id);
            if (jaExiste) {
              return prev;
            }
            
            console.log('Adicionando nova mensagem ao estado:', novaMensagem);
            return [...prev, novaMensagem];
          });

          // Mostrar notificação se a mensagem não for do operador
          if (novaMensagem.remetente !== 'operador') {
            // Notificação do navegador
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Nova mensagem WhatsHub!', {
                body: `${novaMensagem.remetente}: ${novaMensagem.conteudo.slice(0, 50)}...`,
                icon: '/favicon.ico'
              });
            }
            
            // Scroll para o final se a conversa estiver selecionada
            const conversaId = novaMensagem.id_conversa || novaMensagem.id_conversa_fk;
            if (conversaId === selecionada) {
              setTimeout(() => {
                const chatContainer = document.getElementById('chat-container');
                if (chatContainer) {
                  chatContainer.scrollTop = chatContainer.scrollHeight;
                }
              }, 200);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Status da subscription:', status);
        
        if (status === 'SUBSCRIBED') {
          setStatusRealtime('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setStatusRealtime('disconnected');
        } else {
          setStatusRealtime('connecting');
        }
      });

    // Solicitar permissão para notificações
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Permissão de notificação:', permission);
      });
    }

    // Cleanup da subscription
    return () => {
      console.log('Removendo subscription...');
      supabase.removeChannel(subscription);
    };
  }, [selecionada]);

  // Agrupar mensagens por conversa
  const conversas = useMemo(() => {
    const conversasMap = new Map();
    
    for (const msg of mensagens) {
      const conversaId = msg.id_conversa || msg.id_conversa_fk;
      if (!conversaId) continue;
      
      if (!conversasMap.has(conversaId)) {
        conversasMap.set(conversaId, {
          id_conversa: conversaId,
          nome_contato: msg.remetente === 'operador' ? 'Operador' : (msg.remetente || 'Contato'),
          ultima_mensagem: msg.conteudo,
          timestamp: msg.timestamp,
          mensagens: []
        });
      }
      
      const conversa = conversasMap.get(conversaId);
      conversa.mensagens.push(msg);
      
      // Atualizar com a mensagem mais recente
      if (new Date(msg.timestamp) > new Date(conversa.timestamp)) {
        conversa.ultima_mensagem = msg.conteudo;
        conversa.timestamp = msg.timestamp;
        
        // Usar nome do remetente se não for operador
        if (msg.remetente !== 'operador' && msg.remetente !== 'contato') {
          conversa.nome_contato = msg.remetente;
        }
      }
    }
    
    return Array.from(conversasMap.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [mensagens]);

  // Filtrar conversas
  const conversasFiltradas = useMemo(() => {
    if (!filtro) return conversas;
    const f = filtro.toLowerCase();
    return conversas.filter(c => c.nome_contato.toLowerCase().includes(f));
  }, [filtro, conversas]);

  // Mensagens da conversa selecionada
  const mensagensConversa = useMemo(() => {
    if (!selecionada) return [];
    const conversa = conversas.find(c => c.id_conversa === selecionada);
    return conversa ? conversa.mensagens.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ) : [];
  }, [conversas, selecionada]);

  // Conversa selecionada
  const conversaSelecionada = useMemo(() => {
    return conversas.find(c => c.id_conversa === selecionada);
  }, [conversas, selecionada]);

  // Scroll automático quando a conversa muda ou há novas mensagens
  useEffect(() => {
    const scrollToBottom = () => {
      const chatContainer = document.getElementById('chat-container');
      if (chatContainer) {
        setTimeout(() => {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
      }
    };

    if (mensagensConversa.length > 0) {
      scrollToBottom();
    }
  }, [mensagensConversa.length, selecionada]);

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
        // Mas vamos adicionar localmente para feedback imediato
        const novaMensagem = {
          id: crypto.randomUUID(),
          id_conversa: selecionada,
          id_conversa_fk: selecionada,
          remetente: 'operador',
          conteudo: texto.trim(),
          timestamp: new Date().toISOString()
        } as Mensagem;

        setMensagens(prev => [...prev, novaMensagem]);
        
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[70vh]">
        {/* Lista de Conversas */}
        <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="mb-4">
            <input 
              value={filtro} 
              onChange={e => setFiltro(e.target.value)} 
              placeholder="Buscar conversa..." 
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-whatsapp-500" 
            />
          </div>
          
          <div className="space-y-2 max-h-96 overflow-auto">
            {conversasFiltradas.length === 0 ? (
              <div className="text-center text-neutral-400 py-8">
                {conversas.length === 0 ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa corresponde ao filtro'}
              </div>
            ) : (
              conversasFiltradas.map(c => (
                <button 
                  key={c.id_conversa} 
                  onClick={() => setSelecionada(c.id_conversa)} 
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selecionada === c.id_conversa 
                      ? 'border-whatsapp-500 bg-whatsapp-500/10' 
                      : 'border-neutral-700 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-white">{c.nome_contato}</div>
                    <div className="text-xs text-neutral-500">
                      {c.mensagens.length} msg
                    </div>
                  </div>
                  <div className="text-sm text-neutral-400 truncate">
                    {c.ultima_mensagem}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {format(new Date(c.timestamp), 'dd/MM HH:mm')}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-6 bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col">
          {conversaSelecionada ? (
            <>
              {/* Header do Chat */}
              <div className="border-b border-neutral-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-whatsapp-500 to-whatsapp-600 flex items-center justify-center text-black font-bold">
                    {conversaSelecionada.nome_contato.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{conversaSelecionada.nome_contato}</div>
                    <div className="text-sm text-neutral-400">
                      {mensagensConversa.length} mensagem(s)
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <div 
                className="flex-1 overflow-auto space-y-3 mb-4 min-h-96"
                id="chat-container"
                ref={(el) => {
                  if (el) {
                    // Auto scroll para o final quando há novas mensagens
                    const isScrolledToBottom = el.scrollHeight - el.clientHeight <= el.scrollTop + 1;
                    if (isScrolledToBottom) {
                      setTimeout(() => {
                        el.scrollTop = el.scrollHeight;
                      }, 100);
                    }
                  }
                }}
              >
                {mensagensConversa.length === 0 ? (
                  <div className="text-center text-neutral-400 py-8">
                    Nenhuma mensagem nesta conversa
                  </div>
                ) : (
                  mensagensConversa.map((m, index) => {
                    const isNewMessage = index === mensagensConversa.length - 1 && 
                                        m.remetente !== 'operador' && 
                                        new Date(m.timestamp).getTime() > Date.now() - 5000; // Últimos 5 segundos
                    
                    return (
                      <div 
                        key={m.id || `${m.timestamp}-${m.conteudo.slice(0, 10)}`} 
                        className={`max-w-[80%] rounded-lg px-4 py-2 transition-all duration-300 ${
                          m.remetente === 'operador' 
                            ? 'ml-auto bg-whatsapp-600 text-black' 
                            : `bg-neutral-800 text-white ${isNewMessage ? 'ring-2 ring-whatsapp-500 animate-pulse' : ''}`
                        }`}
                      >
                        <div className="text-xs opacity-70 mb-1 flex items-center justify-between">
                          <span>{format(new Date(m.timestamp), 'dd/MM HH:mm')} - {m.remetente}</span>
                          {isNewMessage && (
                            <span className="text-whatsapp-400 text-xs">Nova!</span>
                          )}
                        </div>
                        <div className="whitespace-pre-wrap">{m.conteudo}</div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <textarea
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  rows={2}
                  disabled={enviando}
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-whatsapp-500 resize-none"
                />
                <button 
                  onClick={enviarMensagem}
                  disabled={!texto.trim() || enviando}
                  className="px-4 py-2 bg-whatsapp-600 hover:bg-whatsapp-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {enviando ? '⏳' : '📤'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-400">
              Selecione uma conversa para começar
            </div>
          )}
        </div>

        {/* Detalhes */}
        <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          {conversaSelecionada ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Detalhes da Conversa</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-neutral-400">Contato</div>
                  <div className="font-medium text-white">{conversaSelecionada.nome_contato}</div>
                </div>
                
                <div>
                  <div className="text-sm text-neutral-400">ID da Conversa</div>
                  <div className="text-xs text-neutral-300 font-mono bg-neutral-800 p-2 rounded">
                    {conversaSelecionada.id_conversa}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-neutral-400">Total de Mensagens</div>
                  <div className="text-white">{conversaSelecionada.mensagens.length}</div>
                </div>
                
                <div>
                  <div className="text-sm text-neutral-400">Última Atividade</div>
                  <div className="text-white">{format(new Date(conversaSelecionada.timestamp), 'dd/MM/yyyy HH:mm')}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-neutral-400 text-center py-8">
              Selecione uma conversa para ver detalhes
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
          <div>Conversa selecionada: {conversaSelecionada?.nome_contato || 'Nenhuma'}</div>
          <div>Mensagens na conversa: {mensagensConversa.length}</div>
        </div>
      </div>
    </div>
  );
}