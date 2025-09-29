import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zaupvohmnaiilistuxtl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphdXB2b2htbmFpaWxpc3R1eHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODY2MTcsImV4cCI6MjA3Mzg2MjYxN30.kQP6BnFj84COj8rrw9iKDLbvHPG-98XcrNXuAmh5dxE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrateData() {
  try {
    console.log('Iniciando migração de dados...');
    
    // 1. Buscar todas as mensagens
    const { data: mensagens, error: msgError } = await supabase
      .from('mensagens')
      .select('*');
    
    if (msgError) throw msgError;
    
    console.log(`Encontradas ${mensagens.length} mensagens`);
    
    // 2. Agrupar mensagens por id_conversa e criar conversas
    const conversasMap = new Map();
    
    for (const msg of mensagens) {
      const conversaId = msg.id_conversa || msg.id_conversa_fk;
      if (!conversaId) continue;
      
      if (!conversasMap.has(conversaId)) {
        conversasMap.set(conversaId, {
          id_conversa: conversaId,
          nome_contato: msg.remetente || 'Contato',
          ultima_mensagem: msg.conteudo,
          timestamp: msg.timestamp,
          status: 'ativa',
          importante: false
        });
      }
      
      // Atualizar com a mensagem mais recente
      const conversa = conversasMap.get(conversaId);
      if (new Date(msg.timestamp) > new Date(conversa.timestamp)) {
        conversa.ultima_mensagem = msg.conteudo;
        conversa.timestamp = msg.timestamp;
      }
    }
    
    // 3. Inserir conversas
    const conversasArray = Array.from(conversasMap.values());
    console.log(`Criando ${conversasArray.length} conversas`);
    
    const { error: convInsertError } = await supabase
      .from('conversas')
      .upsert(conversasArray, { onConflict: 'id_conversa' });
    
    if (convInsertError) throw convInsertError;
    
    // 4. Corrigir id_conversa_fk nas mensagens
    for (const msg of mensagens) {
      if (!msg.id_conversa_fk && msg.id_conversa) {
        await supabase
          .from('mensagens')
          .update({ id_conversa_fk: msg.id_conversa })
          .eq('id', msg.id);
      }
    }
    
    console.log('Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('Erro na migração:', error);
  }
}

migrateData();
