// Script de teste para verificar o sistema de tempo real
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zaupvohmnaiilistuxtl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphdXB2b2htbmFpaWxpc3R1eHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODY2MTcsImV4cCI6MjA3Mzg2MjYxN30.kQP6BnFj84COj8rrw9iKDLbvHPG-98XcrNXuAmh5dxE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testRealtimeSystem() {
  console.log('🧪 Testando sistema de tempo real...\n');

  try {
    // 1. Testar inserção de mensagem do operador
    console.log('1. Testando inserção de mensagem do operador...');
    
    const mensagemOperador = {
      id_conversa_fk: 'test_conversa_123',
      remetente: 'operador',
      conteudo: 'Mensagem de teste do operador - ' + new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    const { data: msgData, error: msgError } = await supabase
      .from('mensagens')
      .insert(mensagemOperador)
      .select();

    if (msgError) {
      console.error('❌ Erro ao inserir mensagem do operador:', msgError);
    } else {
      console.log('✅ Mensagem do operador inserida:', msgData[0]);
    }

    // 2. Testar atualização de conversa
    console.log('\n2. Testando atualização de conversa...');
    
    const { error: convError } = await supabase
      .from('conversas')
      .upsert({
        id_conversa: 'test_conversa_123',
        nome_contato: 'Cliente Teste',
        ultima_mensagem: mensagemOperador.conteudo,
        timestamp: mensagemOperador.timestamp,
        status: 'ativa',
        importante: false
      }, { onConflict: 'id_conversa' });

    if (convError) {
      console.error('❌ Erro ao atualizar conversa:', convError);
    } else {
      console.log('✅ Conversa atualizada com sucesso');
    }

    // 3. Testar inserção de mensagem do cliente
    console.log('\n3. Testando inserção de mensagem do cliente...');
    
    const mensagemCliente = {
      id_conversa_fk: 'test_conversa_123',
      remetente: 'contato',
      conteudo: 'Mensagem de teste do cliente - ' + new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    const { data: msgClienteData, error: msgClienteError } = await supabase
      .from('mensagens')
      .insert(mensagemCliente)
      .select();

    if (msgClienteError) {
      console.error('❌ Erro ao inserir mensagem do cliente:', msgClienteError);
    } else {
      console.log('✅ Mensagem do cliente inserida:', msgClienteData[0]);
    }

    // 4. Verificar dados finais
    console.log('\n4. Verificando dados finais...');
    
    const { data: mensagensFinais } = await supabase
      .from('mensagens')
      .select('*')
      .eq('id_conversa_fk', 'test_conversa_123')
      .order('timestamp', { ascending: true });

    const { data: conversaFinal } = await supabase
      .from('conversas')
      .select('*')
      .eq('id_conversa', 'test_conversa_123')
      .single();

    console.log('📊 Mensagens na conversa:', mensagensFinais?.length || 0);
    console.log('📊 Conversa encontrada:', conversaFinal ? 'Sim' : 'Não');
    
    if (mensagensFinais) {
      mensagensFinais.forEach((msg, index) => {
        console.log(`   ${index + 1}. [${msg.remetente}] ${msg.conteudo.slice(0, 50)}...`);
      });
    }

    console.log('\n✅ Teste concluído com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Inicie o servidor: npm run dev (na pasta server)');
    console.log('   2. Inicie o cliente: npm run dev (na pasta client)');
    console.log('   3. Abra a aplicação e teste o chat em tempo real');
    console.log('   4. Verifique se as mensagens aparecem instantaneamente');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testRealtimeSystem();
