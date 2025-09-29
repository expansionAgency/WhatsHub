-- Inserir dados de teste para WhatsHub

-- Limpar dados existentes (opcional)
-- DELETE FROM mensagens;
-- DELETE FROM conversas;

-- Inserir conversas de teste
INSERT INTO conversas (id_conversa, nome_contato, ultima_mensagem, timestamp, status, importante) VALUES
('whatsapp_5511999887766', 'João Silva', 'Olá, preciso de ajuda com meu pedido', '2025-09-22T10:30:00Z', 'ativa', false),
('whatsapp_5511888776655', 'Maria Santos', 'Obrigada pelo atendimento!', '2025-09-22T09:15:00Z', 'ativa', true),
('whatsapp_5511777665544', 'Pedro Oliveira', 'Quando meu produto vai chegar?', '2025-09-22T08:45:00Z', 'ativa', false),
('whatsapp_5511666554433', 'Ana Costa', 'Gostaria de fazer um orçamento', '2025-09-21T16:20:00Z', 'ativa', true)
ON CONFLICT (id_conversa) DO UPDATE SET
  nome_contato = EXCLUDED.nome_contato,
  ultima_mensagem = EXCLUDED.ultima_mensagem,
  timestamp = EXCLUDED.timestamp,
  status = EXCLUDED.status,
  importante = EXCLUDED.importante;

-- Inserir mensagens de teste
INSERT INTO mensagens (id_conversa_fk, remetente, conteudo, timestamp) VALUES
-- Conversa com João Silva
('whatsapp_5511999887766', 'contato', 'Olá, boa tarde!', '2025-09-22T10:25:00Z'),
('whatsapp_5511999887766', 'operador', 'Olá João! Como posso ajudá-lo?', '2025-09-22T10:26:00Z'),
('whatsapp_5511999887766', 'contato', 'Preciso de ajuda com meu pedido', '2025-09-22T10:30:00Z'),

-- Conversa com Maria Santos
('whatsapp_5511888776655', 'contato', 'Bom dia! Recebi meu produto', '2025-09-22T09:10:00Z'),
('whatsapp_5511888776655', 'operador', 'Que ótimo! Como está tudo?', '2025-09-22T09:12:00Z'),
('whatsapp_5511888776655', 'contato', 'Perfeito! Obrigada pelo atendimento!', '2025-09-22T09:15:00Z'),

-- Conversa com Pedro Oliveira
('whatsapp_5511777665544', 'contato', 'Oi, fiz um pedido ontem', '2025-09-22T08:40:00Z'),
('whatsapp_5511777665544', 'operador', 'Olá Pedro! Vou verificar seu pedido', '2025-09-22T08:42:00Z'),
('whatsapp_5511777665544', 'contato', 'Quando meu produto vai chegar?', '2025-09-22T08:45:00Z'),

-- Conversa com Ana Costa
('whatsapp_5511666554433', 'contato', 'Olá, gostaria de fazer um orçamento', '2025-09-21T16:20:00Z'),
('whatsapp_5511666554433', 'operador', 'Claro! Para qual produto?', '2025-09-21T16:22:00Z')
ON CONFLICT DO NOTHING;
