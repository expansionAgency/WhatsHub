export async function fetchDashboard(period: 'day'|'week'|'month'|'year') {
  const r = await fetch(`/api/dashboard?period=${period}`);
  return r.json();
}

export async function fetchConversas() {
  const r = await fetch('/api/conversas');
  return r.json();
}

export async function fetchMensagens(conversaId: string) {
  const r = await fetch(`/api/mensagens/${conversaId}`);
  return r.json();
}

export async function toggleConversaImportante(conversaId: string) {
  const r = await fetch(`/api/conversas/${conversaId}/toggle-importante`, { method: 'POST' });
  return r.json();
}

export async function sendMessage(payload: { id_conversa: string; nome_contato: string; conteudo: string; timestamp?: string; remetente?: string; }) {
  const r = await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  return r.json();
}


