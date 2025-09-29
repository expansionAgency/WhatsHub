import { useEffect, useState } from 'react';
import { supabase, Mensagem, Conversa } from '../lib/supabase';

export function useRealtimeMessages() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [novasMensagens, setNovasMensagens] = useState<Mensagem[]>([]);

  useEffect(() => {
    // Carregar dados iniciais
    const loadInitialData = async () => {
      try {
        const { data: msgs } = await supabase.from('mensagens').select('*').order('timestamp', { ascending: false }).limit(100);
        const { data: convs } = await supabase.from('conversas').select('*').order('timestamp', { ascending: false });
        
        if (msgs) setMensagens(msgs);
        if (convs) setConversas(convs);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    loadInitialData();

    // Subscription para novas mensagens
    const mensagensSubscription = supabase
      .channel('mensagens_realtime')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'mensagens' },
        (payload) => {
          try {
            const novaMensagem = payload.new as Mensagem;
            console.log('Nova mensagem recebida:', novaMensagem);
            
            setMensagens(prev => [novaMensagem, ...prev]);
            setNovasMensagens(prev => [...prev, novaMensagem]);
            
            // Mostrar notificação se a mensagem não for do operador
            if (novaMensagem.remetente !== 'operador') {
              showNotification('Nova mensagem recebida!', novaMensagem.conteudo);
            }
          } catch (error) {
            console.error('Erro ao processar nova mensagem:', error);
          }
        }
      )
      .subscribe();

    // Subscription para conversas
    const conversasSubscription = supabase
      .channel('conversas_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversas' },
        (payload) => {
          try {
            console.log('Conversa atualizada:', payload);
            
            if (payload.eventType === 'INSERT') {
              const novaConversa = payload.new as Conversa;
              setConversas(prev => [novaConversa, ...prev.filter(c => c.id_conversa !== novaConversa.id_conversa)]);
            } else if (payload.eventType === 'UPDATE') {
              const conversaAtualizada = payload.new as Conversa;
              setConversas(prev => prev.map(c => 
                c.id_conversa === conversaAtualizada.id_conversa ? conversaAtualizada : c
              ));
            }
          } catch (error) {
            console.error('Erro ao processar conversa:', error);
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(mensagensSubscription);
      supabase.removeChannel(conversasSubscription);
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