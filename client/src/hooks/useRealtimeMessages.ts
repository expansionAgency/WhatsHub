import { useEffect, useState } from 'react';
import { supabase, Mensagem, Conversa } from '../lib/supabase';

export function useRealtimeMessages() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [novasMensagens, setNovasMensagens] = useState<Mensagem[]>([]);

  // Função para extrair número do telefone de uma mensagem
  const extrairNumeroTelefone = (msg: Mensagem): string | null => {
    // Primeiro, tentar extrair número do telefone do campo id_conversa
    if (msg.id_conversa && msg.id_conversa.includes('@')) {
      // Formato: 555197097894@s.whatsapp.net
      return msg.id_conversa.split('@')[0];
    }
    
    // Se não conseguir do id_conversa, tentar do campo numero
    if (msg.numero) {
      return msg.numero;
    }
    
    return null;
  };

  // Função para criar conversas dinamicamente a partir das mensagens
  const criarConversasDasMensagens = (msgs: Mensagem[]): Conversa[] => {
    const conversasMap = new Map();
    
    // Agrupar todas as mensagens por número de telefone
    for (const msg of msgs) {
      const numeroTelefone = extrairNumeroTelefone(msg);
      
      if (numeroTelefone) {
        const conversaId = `whatsapp_${numeroTelefone}`;
        
        if (!conversasMap.has(conversaId)) {
          // Determinar nome do contato baseado no remetente
          let nomeContato = `+${numeroTelefone}`;
          
          // Procurar por mensagens não-operador para definir o nome
          const mensagemNaoOperador = msgs.find(m => 
            extrairNumeroTelefone(m) === numeroTelefone && 
            m.remetente !== 'operador' && 
            m.remetente !== 'contato'
          );
          
          if (mensagemNaoOperador) {
            nomeContato = mensagemNaoOperador.remetente;
          }
          
          conversasMap.set(conversaId, {
            id_conversa: conversaId,
            nome_contato: nomeContato,
            ultima_mensagem: msg.conteudo,
            timestamp: msg.timestamp,
            status: 'ativa' as const,
            importante: false,
            mensagens: []
          });
        }
        
        const conversa = conversasMap.get(conversaId);
        conversa.mensagens.push(msg);
        
        // Ordenar mensagens por timestamp
        conversa.mensagens.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        // Atualizar com a mensagem mais recente
        if (new Date(msg.timestamp) > new Date(conversa.timestamp)) {
          conversa.ultima_mensagem = msg.conteudo;
          conversa.timestamp = msg.timestamp;
        }
      }
    }
    
    // Processar mensagens sem número de telefone
    const mensagensSemNumero = msgs.filter(msg => !extrairNumeroTelefone(msg));
    
    for (const msg of mensagensSemNumero) {
      // Tentar encontrar uma conversa existente baseada no id_conversa_fk
      let conversaEncontrada = null;
      
      if (msg.id_conversa_fk) {
        // Procurar por uma conversa existente que tenha mensagens com o mesmo id_conversa_fk
        for (const [conversaId, conversa] of conversasMap) {
          const temMensagemComMesmoId = conversa.mensagens.some(m => 
            m.id_conversa_fk === msg.id_conversa_fk || 
            m.id_conversa === msg.id_conversa_fk
          );
          
          if (temMensagemComMesmoId) {
            conversaEncontrada = conversa;
            break;
          }
        }
      }
      
      // Se não encontrou por id_conversa_fk, tentar por proximidade temporal
      if (!conversaEncontrada && msg.remetente === 'operador') {
        // Para mensagens do operador, tentar associar com a conversa mais recente
        const conversasOrdenadas = Array.from(conversasMap.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        if (conversasOrdenadas.length > 0) {
          // Verificar se a mensagem do operador é próxima temporalmente da conversa mais recente
          const conversaMaisRecente = conversasOrdenadas[0];
          const diferencaTempo = Math.abs(
            new Date(msg.timestamp).getTime() - new Date(conversaMaisRecente.timestamp).getTime()
          );
          
          // Se a diferença for menor que 5 minutos, associar à conversa
          if (diferencaTempo < 5 * 60 * 1000) {
            conversaEncontrada = conversaMaisRecente;
          }
        }
      }
      
      if (conversaEncontrada) {
        // Adicionar à conversa existente
        conversaEncontrada.mensagens.push(msg);
        
        // Ordenar mensagens por timestamp
        conversaEncontrada.mensagens.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        // Atualizar timestamp se necessário
        if (new Date(msg.timestamp) > new Date(conversaEncontrada.timestamp)) {
          conversaEncontrada.ultima_mensagem = msg.conteudo;
          conversaEncontrada.timestamp = msg.timestamp;
        }
      } else {
        // Criar nova conversa
        const conversaId = msg.id_conversa_fk || msg.id_conversa || crypto.randomUUID();
        
        conversasMap.set(conversaId, {
          id_conversa: conversaId,
          nome_contato: msg.remetente === 'operador' ? 'Operador' : 
                       msg.remetente === 'contato' ? 'Contato' : 
                       msg.remetente || 'Usuário',
          ultima_mensagem: msg.conteudo,
          timestamp: msg.timestamp,
          status: 'ativa' as const,
          importante: false,
          mensagens: [msg]
        });
      }
    }
    
    return Array.from(conversasMap.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  useEffect(() => {
    // Carregar dados iniciais
    const loadInitialData = async () => {
      try {
        console.log('Carregando mensagens...');
        const { data: msgs } = await supabase.from('mensagens').select('*').order('timestamp', { ascending: true });
        
        if (msgs) {
          console.log(`Encontradas ${msgs.length} mensagens`);
          setMensagens(msgs);
          
          // Criar conversas dinamicamente a partir das mensagens
          const conversasCriadas = criarConversasDasMensagens(msgs);
          console.log(`Criadas ${conversasCriadas.length} conversas dinamicamente`);
          setConversas(conversasCriadas);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    loadInitialData();

    // Polling para atualizações em tempo real (fallback para subscription)
    const pollingInterval = setInterval(async () => {
      try {
        const { data: msgs } = await supabase
          .from('mensagens')
          .select('*')
          .order('timestamp', { ascending: true });
        
        if (msgs) {
          setMensagens(prev => {
            // Verificar se há novas mensagens
            const novasMensagens = msgs.filter(msg => 
              !prev.some(p => p.id === msg.id)
            );
            
            if (novasMensagens.length > 0) {
              console.log(`🔄 ${novasMensagens.length} novas mensagens detectadas via polling`);
              
              // Atualizar conversas
              const conversasAtualizadas = criarConversasDasMensagens(msgs);
              setConversas(conversasAtualizadas);
              
              // Adicionar às novas mensagens para notificações
              setNovasMensagens(prevNovas => {
                const novas = novasMensagens.filter(nova => 
                  !prevNovas.some(p => p.id === nova.id)
                );
                return [...prevNovas, ...novas];
              });
              
              // Mostrar notificações para mensagens não-operador
              novasMensagens.forEach(msg => {
                if (msg.remetente !== 'operador') {
                  showNotification('Nova mensagem recebida!', msg.conteudo);
                }
              });
            }
            
            return msgs;
          });
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, 2000); // Polling a cada 2 segundos

    // Subscription para novas mensagens (tentativa principal)
    const mensagensSubscription = supabase
      .channel('mensagens_realtime')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'mensagens' },
        (payload) => {
          try {
            const novaMensagem = payload.new as Mensagem;
            console.log('🔔 Nova mensagem recebida via subscription:', novaMensagem);
            
            // Verificar se a mensagem já existe para evitar duplicatas
            setMensagens(prev => {
              const jaExiste = prev.some(m => m.id === novaMensagem.id);
              if (jaExiste) {
                console.log('⚠️ Mensagem já existe, ignorando duplicata');
                return prev;
              }
              
              console.log('✅ Adicionando nova mensagem ao estado');
              const novasMensagens = [...prev, novaMensagem];
              
              // Atualizar conversas dinamicamente
              const conversasAtualizadas = criarConversasDasMensagens(novasMensagens);
              console.log('📋 Conversas atualizadas:', conversasAtualizadas.length);
              setConversas(conversasAtualizadas);
              
              return novasMensagens;
            });
            
            setNovasMensagens(prev => {
              const jaExiste = prev.some(m => m.id === novaMensagem.id);
              if (jaExiste) return prev;
              return [...prev, novaMensagem];
            });
            
            // Mostrar notificação se a mensagem não for do operador
            if (novaMensagem.remetente !== 'operador') {
              showNotification('Nova mensagem recebida!', novaMensagem.conteudo);
            }
          } catch (error) {
            console.error('❌ Erro ao processar nova mensagem:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscription de mensagens:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscription ativa - escutando novas mensagens');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na subscription');
        }
      });

    // Cleanup subscriptions e polling
    return () => {
      clearInterval(pollingInterval);
      supabase.removeChannel(mensagensSubscription);
    };
  }, []);

  const showNotification = (title: string, body: string) => {
    // Notificação do navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body.slice(0, 100),
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
    
    // Log para debug
    console.log(`🔔 ${title}: ${body}`);
  };

  const marcarMensagemComoLida = (mensagemId: string) => {
    setNovasMensagens(prev => prev.filter(m => m.id !== mensagemId));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  return {
    mensagens,
    conversas,
    novasMensagens,
    marcarMensagemComoLida,
    requestNotificationPermission,
    totalNovasMensagens: novasMensagens.length
  };
}