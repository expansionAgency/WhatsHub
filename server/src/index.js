import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const PORT = process.env.PORT || 4000;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zaupvohmnaiilistuxtl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphdXB2b2htbmFpaWxpc3R1eHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODY2MTcsImV4cCI6MjA3Mzg2MjYxN30.kQP6BnFj84COj8rrw9iKDLbvHPG-98XcrNXuAmh5dxE';
// Tentar usar service role key se disponível
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || SUPABASE_KEY;
// Usar webhook simulador local temporariamente até N8N estar ativo
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:4000/api/webhook-simulator';
const N8N_WEBHOOK_URL = 'https://n8n-n8n.we3qg7.easypanel.host/webhook/d6d5efa4-4179-406f-9439-25142f1de595';
const USE_SIMULATOR = process.env.USE_SIMULATOR === 'true' || false; // Usar simulador por padrão para testes

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Webhook simulado para testes (substitui temporariamente o N8N)
app.post('/api/webhook-simulator', (req, res) => {
  console.log('=== WEBHOOK SIMULADOR ===');
  console.log('Dados recebidos:', JSON.stringify(req.body, null, 2));
  console.log('Headers:', req.headers);
  
  // Simular processamento
  const { id_conversa, numero, mensagem, remetente, timestamp } = req.body;
  
  console.log(`📱 Simulando envio WhatsApp:`);
  console.log(`   Para: ${numero}`);
  console.log(`   Mensagem: ${mensagem}`);
  console.log(`   De: ${remetente}`);
  console.log(`   Hora: ${timestamp}`);
  
  // Resposta simulada de sucesso
  res.json({ 
    ok: true, 
    message: 'Webhook simulado - mensagem "enviada" com sucesso',
    data: {
      numero_formatado: numero,
      mensagem_enviada: mensagem,
      timestamp_processamento: new Date().toISOString()
    }
  });
});

// Check database structure
app.get('/api/db-info', async (_req, res) => {
  try {
    const { data: conversas, error: convError } = await supabase.from('conversas').select('*');
    const { data: mensagens, error: msgError } = await supabase.from('mensagens').select('*');
    
    res.json({ 
      conversas: { count: conversas?.length || 0, data: conversas?.slice(0, 3), error: convError },
      mensagens: { count: mensagens?.length || 0, data: mensagens?.slice(0, 3), error: msgError }
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Migrate existing data
app.post('/api/migrate', async (_req, res) => {
  try {
    console.log('Iniciando migração de dados...');
    
    // 1. Buscar todas as mensagens
    const { data: mensagens, error: msgError } = await supabase.from('mensagens').select('*');
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
          nome_contato: msg.remetente === 'contato' ? 'Contato' : (msg.remetente || 'Usuário'),
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
        
        // Se a mensagem não é do operador, usar o remetente como nome
        if (msg.remetente !== 'operador' && msg.remetente !== 'contato') {
          conversa.nome_contato = msg.remetente;
        }
      }
    }
    
    // 3. Inserir conversas
    const conversasArray = Array.from(conversasMap.values());
    console.log(`Criando ${conversasArray.length} conversas`);
    
    if (conversasArray.length > 0) {
      const { error: convInsertError } = await supabase
        .from('conversas')
        .upsert(conversasArray, { onConflict: 'id_conversa' });
      
      if (convInsertError) throw convInsertError;
    }
    
    // 4. Corrigir id_conversa_fk nas mensagens
    let corrigidas = 0;
    for (const msg of mensagens) {
      if (!msg.id_conversa_fk && msg.id_conversa) {
        await supabase
          .from('mensagens')
          .update({ id_conversa_fk: msg.id_conversa })
          .eq('id', msg.id);
        corrigidas++;
      }
    }
    
    res.json({ 
      ok: true, 
      message: `Migração concluída! ${conversasArray.length} conversas criadas, ${corrigidas} mensagens corrigidas.`
    });
    
  } catch (error) {
    console.error('Erro na migração:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fix UUID schema - endpoint informativo
app.get('/api/schema-status', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'mensagens')
      .eq('table_schema', 'public');
    
    if (error) throw error;
    
    res.json({ 
      ok: true, 
      columns: data,
      message: 'Para corrigir o schema UUID, execute o SQL no Supabase Dashboard' 
    });
  } catch (error) {
    console.error('Erro ao verificar schema:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create conversations with admin client
app.post('/api/create-conversas-admin', async (_req, res) => {
  try {
    console.log('Criando conversas com cliente admin...');
    
    const conversas = [
      {
        id_conversa: '8245edca-806d-4be7-8414-45cc387fa34a',
        nome_contato: 'Bruno Silva',
        ultima_mensagem: 'Olá. tudo bem?',
        timestamp: '2025-09-29T23:48:22.084+00:00',
        status: 'ativa'
      },
      {
        id_conversa: 'cd2b69f9-ebc0-4dbe-a63a-6fd71c75f5ad',
        nome_contato: 'Cliente Teste',
        ultima_mensagem: 'Obrigado pela resposta! Funcionou perfeitamente.',
        timestamp: '2025-09-30T00:02:03.483+00:00',
        status: 'ativa'
      }
    ];

    const { data, error } = await supabaseAdmin
      .from('conversas')
      .insert(conversas)
      .select();

    if (error) {
      console.error('Erro ao inserir conversas com admin:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Conversas inseridas com admin:', data);
    res.json({ ok: true, data, message: 'Conversas criadas com cliente admin!' });
    
  } catch (error) {
    console.error('Erro geral:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fix RLS policies endpoint
app.post('/api/fix-rls', async (_req, res) => {
  try {
    console.log('Corrigindo políticas RLS...');
    
    // Primeiro, vamos tentar desabilitar RLS temporariamente
    // Nota: Isso pode não funcionar dependendo das permissões
    const { error: disableError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE public.conversas DISABLE ROW LEVEL SECURITY;'
    });

    if (disableError) {
      console.log('Não foi possível desabilitar RLS:', disableError);
    }

    // Tentar inserir uma conversa de teste
    const { data: insertData, error: insertError } = await supabase
      .from('conversas')
      .insert({
        id_conversa: crypto.randomUUID(),
        nome_contato: 'Teste RLS Fix',
        ultima_mensagem: 'Teste após correção',
        timestamp: new Date().toISOString(),
        status: 'ativa'
      })
      .select();

    console.log('Resultado após correção:', { insertData, insertError });

    res.json({
      message: 'Tentativa de correção RLS concluída',
      insert: { data: insertData, error: insertError }
    });
    
  } catch (error) {
    console.error('Erro ao corrigir RLS:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check RLS policies
app.get('/api/debug-rls', async (_req, res) => {
  try {
    console.log('Verificando políticas RLS...');
    
    // Tentar inserir uma conversa de teste
    const { data: insertData, error: insertError } = await supabase
      .from('conversas')
      .insert({
        id_conversa: crypto.randomUUID(),
        nome_contato: 'Teste RLS',
        ultima_mensagem: 'Teste',
        timestamp: new Date().toISOString(),
        status: 'ativa'
      })
      .select();

    console.log('Resultado da inserção:', { insertData, insertError });

    // Tentar buscar conversas
    const { data: selectData, error: selectError } = await supabase
      .from('conversas')
      .select('*');

    console.log('Resultado da busca:', { selectData, selectError });

    res.json({
      insert: { data: insertData, error: insertError },
      select: { data: selectData, error: selectError }
    });
    
  } catch (error) {
    console.error('Erro no debug RLS:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create test conversations endpoint
app.post('/api/create-test-conversas', async (_req, res) => {
  try {
    console.log('Criando conversas de teste...');
    
    const conversas = [
      {
        id_conversa: '8245edca-806d-4be7-8414-45cc387fa34a',
        nome_contato: 'Bruno Silva',
        ultima_mensagem: 'Olá. tudo bem?',
        timestamp: '2025-09-29T23:48:22.084+00:00',
        status: 'ativa'
      },
      {
        id_conversa: 'cd2b69f9-ebc0-4dbe-a63a-6fd71c75f5ad',
        nome_contato: 'Cliente Teste',
        ultima_mensagem: 'Obrigado pela resposta! Funcionou perfeitamente.',
        timestamp: '2025-09-30T00:02:03.483+00:00',
        status: 'ativa'
      }
    ];

    const { error } = await supabase
      .from('conversas')
      .insert(conversas);

    if (error) {
      console.error('Erro ao inserir conversas:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Conversas inseridas com sucesso!');
    res.json({ ok: true, message: 'Conversas de teste criadas com sucesso!' });
    
  } catch (error) {
    console.error('Erro geral:', error);
    res.status(500).json({ error: error.message });
  }
});

// Insert test data
app.post('/api/test-data', async (_req, res) => {
  try {
    // Insert test conversations
    const { error: convError } = await supabase.from('conversas').upsert([
      {
        id_conversa: 'whatsapp_5511999887766',
        nome_contato: 'João Silva',
        ultima_mensagem: 'Olá, preciso de ajuda com meu pedido',
        timestamp: '2025-09-22T10:30:00Z',
        status: 'ativa',
        importante: false
      },
      {
        id_conversa: 'whatsapp_5511888776655',
        nome_contato: 'Maria Santos',
        ultima_mensagem: 'Obrigada pelo atendimento!',
        timestamp: '2025-09-22T09:15:00Z',
        status: 'ativa',
        importante: true
      },
      {
        id_conversa: 'whatsapp_5511777665544',
        nome_contato: 'Pedro Oliveira',
        ultima_mensagem: 'Quando meu produto vai chegar?',
        timestamp: '2025-09-22T08:45:00Z',
        status: 'ativa',
        importante: false
      }
    ], { onConflict: 'id_conversa' });

    if (convError) throw convError;

    // Insert test messages
    const { error: msgError } = await supabase.from('mensagens').insert([
      { id_conversa_fk: 'whatsapp_5511999887766', remetente: 'contato', conteudo: 'Olá, boa tarde!', timestamp: '2025-09-22T10:25:00Z' },
      { id_conversa_fk: 'whatsapp_5511999887766', remetente: 'operador', conteudo: 'Olá João! Como posso ajudá-lo?', timestamp: '2025-09-22T10:26:00Z' },
      { id_conversa_fk: 'whatsapp_5511999887766', remetente: 'contato', conteudo: 'Preciso de ajuda com meu pedido', timestamp: '2025-09-22T10:30:00Z' },
      { id_conversa_fk: 'whatsapp_5511888776655', remetente: 'contato', conteudo: 'Bom dia! Recebi meu produto', timestamp: '2025-09-22T09:10:00Z' },
      { id_conversa_fk: 'whatsapp_5511888776655', remetente: 'operador', conteudo: 'Que ótimo! Como está tudo?', timestamp: '2025-09-22T09:12:00Z' },
      { id_conversa_fk: 'whatsapp_5511888776655', remetente: 'contato', conteudo: 'Obrigada pelo atendimento!', timestamp: '2025-09-22T09:15:00Z' },
      { id_conversa_fk: 'whatsapp_5511777665544', remetente: 'contato', conteudo: 'Oi, fiz um pedido ontem', timestamp: '2025-09-22T08:40:00Z' },
      { id_conversa_fk: 'whatsapp_5511777665544', remetente: 'operador', conteudo: 'Olá Pedro! Vou verificar seu pedido', timestamp: '2025-09-22T08:42:00Z' },
      { id_conversa_fk: 'whatsapp_5511777665544', remetente: 'contato', conteudo: 'Quando meu produto vai chegar?', timestamp: '2025-09-22T08:45:00Z' }
    ]);

    if (msgError && msgError.code !== '23505') throw msgError; // Ignore duplicate errors

    res.json({ ok: true, message: 'Dados de teste inseridos com sucesso!' });
  } catch (error) {
    console.error('Erro ao inserir dados de teste:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dashboard aggregates
app.get('/api/dashboard', async (req, res) => {
  const { period = 'month' } = req.query;
  const start = getStart(period);
  const { data: mensagens } = await supabase.from('mensagens').select('*').gte('timestamp', start.toISOString());
  const { data: conversas } = await supabase.from('conversas').select('*').gte('timestamp', start.toISOString());
  res.json({ mensagens: mensagens || [], conversas: conversas || [] });
});

// Conversations
app.get('/api/conversas', async (_req, res) => {
  const { data, error } = await supabase.from('conversas').select('*').order('timestamp', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Messages by conversation
app.get('/api/mensagens/:id', async (req, res) => {
  const id = req.params.id;
  const { data, error } = await supabase.from('mensagens').select('*').eq('id_conversa_fk', id).order('timestamp', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Toggle importante
app.post('/api/conversas/:id/toggle-importante', async (req, res) => {
  const id = req.params.id;
  const { data: rows } = await supabase.from('conversas').select('*').eq('id_conversa', id).limit(1).maybeSingle();
  const novaFlag = !(rows?.importante ?? false);
  const { error } = await supabase.from('conversas').update({ importante: novaFlag }).eq('id_conversa', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, importante: novaFlag });
});

// Send message -> forwards to webhook and stores locally
app.post('/api/send', async (req, res) => {
  console.log('=== INÍCIO /api/send ===');
  
  try {
    const { id_conversa, nome_contato, conteudo, timestamp, remetente, number, text } = req.body || {};
    
    console.log('Recebido payload:', JSON.stringify(req.body, null, 2));
    
    // Suporte para ambos os formatos (antigo e novo)
    const conversaId = id_conversa;
    const textoMensagem = text || conteudo;
    
    console.log('Processando - conversaId:', conversaId, 'texto:', textoMensagem);
    
    if (!conversaId || !textoMensagem) {
      console.log('Erro: campos obrigatórios faltando');
      return res.status(400).json({ error: 'id_conversa e conteudo são obrigatórios' });
    }
    
    // Extrair apenas os números do ID da conversa
    let numeroTelefone = number;
    if (!numeroTelefone && id_conversa) {
      console.log('Extraindo número de:', id_conversa);
      // Método mais simples e seguro
      numeroTelefone = id_conversa.split('@')[0]; // Pega tudo antes do @
      numeroTelefone = numeroTelefone.replace(/[^0-9]/g, ''); // Remove não-números
      console.log('Número extraído:', numeroTelefone);
    }
    
    // Enviar para webhook - tentar N8N primeiro, depois simulador
    if (numeroTelefone && numeroTelefone.length >= 10) {
      const webhookPayload = {
        id_conversa: conversaId,
        numero: numeroTelefone,
        mensagem: textoMensagem,
        remetente: remetente || 'operador',
        timestamp: timestamp || new Date().toISOString()
      };
      
      console.log('Payload preparado:', JSON.stringify(webhookPayload, null, 2));
      
      // Tentar N8N primeiro
      let webhookSuccess = false;
      
      try {
        console.log('🔄 Tentando webhook N8N:', N8N_WEBHOOK_URL);
        
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, { 
          method: 'POST', 
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'WhatsHub-Server/1.0'
          }, 
          body: JSON.stringify(webhookPayload),
          timeout: 5000 // 5 segundos timeout para N8N
        });
        
        if (n8nResponse.ok) {
          const responseText = await n8nResponse.text();
          console.log('✅ N8N webhook enviado com sucesso!');
          console.log('📄 Resposta N8N:', responseText);
          webhookSuccess = true;
        } else {
          console.log('⚠️ N8N retornou status:', n8nResponse.status);
          throw new Error(`N8N webhook failed: ${n8nResponse.status}`);
        }
      } catch (n8nError) {
        console.log('❌ Erro no webhook N8N:', n8nError.message);
        
        // Fallback: usar simulador local
        try {
          console.log('🔄 Usando webhook simulador local:', WEBHOOK_URL);
          
          const simulatorResponse = await fetch(WEBHOOK_URL, { 
            method: 'POST', 
            headers: { 
              'Content-Type': 'application/json',
              'User-Agent': 'WhatsHub-Server/1.0'
            }, 
            body: JSON.stringify(webhookPayload),
            timeout: 3000
          });
          
          if (simulatorResponse.ok) {
            const responseText = await simulatorResponse.text();
            console.log('✅ Simulador webhook funcionou!');
            console.log('📄 Resposta simulador:', responseText);
            webhookSuccess = true;
          }
        } catch (simulatorError) {
          console.error('❌ Erro também no simulador:', simulatorError.message);
        }
      }
      
      if (!webhookSuccess) {
        console.warn('⚠️ Nenhum webhook funcionou - mensagem não foi enviada para WhatsApp');
      }
    } else {
      console.warn('❌ Número inválido:', numeroTelefone, 'de:', conversaId);
    }
    
    // Salvar no banco local
    console.log('Preparando dados para salvar no banco...');
    
    try {
      // Gerar UUID para a conversa se necessário
      let conversaUuid = conversaId;
      
      // Verificar se o ID da conversa é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(conversaId)) {
        // Se não for UUID, gerar um baseado no ID original
        conversaUuid = crypto.randomUUID();
        console.log(`Convertendo ID de conversa ${conversaId} para UUID ${conversaUuid}`);
      }
      
      // Primeiro, garantir que a conversa existe
      const { error: convError } = await supabase
        .from('conversas')
        .upsert({
          id_conversa: conversaUuid,
          nome_contato: nome_contato || 'Contato',
          ultima_mensagem: textoMensagem,
          timestamp: timestamp || new Date().toISOString(),
          status: 'ativa',
          importante: false
        }, { onConflict: 'id_conversa' });
      
      if (convError) {
        console.error('Erro ao salvar conversa:', convError);
      } else {
        console.log('Conversa salva/atualizada com sucesso');
      }
      
      // Agora salvar a mensagem
      const { error: msgError } = await supabase
        .from('mensagens')
        .insert({
          id: crypto.randomUUID(),
          id_conversa_fk: conversaUuid,
          remetente: remetente || 'operador',
          conteudo: textoMensagem,
          timestamp: timestamp || new Date().toISOString()
        });
      
      if (msgError) {
        console.error('Erro ao salvar mensagem:', msgError);
      } else {
        console.log('Mensagem salva no banco com sucesso');
      }
    } catch (dbError) {
      console.error('Erro geral ao salvar no banco:', dbError);
    }
    res.json({ ok: true, message: 'Mensagem enviada e salva com sucesso' });
    
  } catch (error) {
    console.error('Erro geral no /api/send:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro interno do servidor: ' + error.message,
      details: error.stack ? error.stack.split('\n')[0] : 'Sem detalhes'
    });
  }
});

// Incoming webhook to store received conversations/messages
app.post('/api/webhook/whatsapp', async (req, res) => {
  const { id_conversa, nome_contato, conteudo, timestamp } = req.body || {};
  if (!id_conversa || !nome_contato || !conteudo) return res.status(400).json({ error: 'payload inválido' });
  
  try {
    // Gerar UUID para a conversa se necessário
    let conversaUuid = id_conversa;
    
    // Verificar se o ID da conversa é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id_conversa)) {
      // Se não for UUID, gerar um baseado no ID original
      conversaUuid = crypto.randomUUID();
      console.log(`Convertendo ID de conversa ${id_conversa} para UUID ${conversaUuid}`);
    }
    
    // Upsert conversation
    await supabase.from('conversas').upsert({ 
      id_conversa: conversaUuid, 
      nome_contato, 
      ultima_mensagem: conteudo, 
      timestamp: timestamp || new Date().toISOString(), 
      status: 'ativa', 
      importante: false 
    }, { onConflict: 'id_conversa' });
    
    // Insert message
    const { error: msgError } = await supabase.from('mensagens').insert({
      id: crypto.randomUUID(),
      id_conversa_fk: conversaUuid,
      remetente: 'contato',
      conteudo: conteudo,
      timestamp: timestamp || new Date().toISOString()
    });
    
    if (msgError) {
      console.error('Erro ao salvar mensagem:', msgError);
    } else {
      console.log('Mensagem salva com sucesso');
    }
    
    res.json({ ok: true, message: 'Conversa e mensagem salvas com sucesso' });
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));

function getStart(period) {
  const now = new Date();
  if (period === 'day') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'week') {
    const day = now.getDay();
    const diff = (day + 6) % 7; // monday start
    const d = new Date(now);
    d.setDate(now.getDate() - diff);
    d.setHours(0,0,0,0);
    return d;
  }
  if (period === 'year') return new Date(now.getFullYear(), 0, 1);
  return new Date(now.getFullYear(), now.getMonth(), 1);
}


