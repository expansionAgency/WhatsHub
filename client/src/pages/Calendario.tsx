import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';

interface Evento {
  id: string;
  titulo: string;
  data: Date;
  horario: string;
  tipo: 'reuniao' | 'follow-up' | 'demo' | 'outro';
  cliente?: string;
  descricao?: string;
}

const eventos: Evento[] = [
  {
    id: '1',
    titulo: 'Reunião com Cliente ABC',
    data: new Date(2025, 8, 25),
    horario: '09:00',
    tipo: 'reuniao',
    cliente: 'ABC Corp',
    descricao: 'Discussão sobre implementação do WhatsApp Business'
  },
  {
    id: '2',
    titulo: 'Follow-up Proposta',
    data: new Date(2025, 8, 26),
    horario: '14:30',
    tipo: 'follow-up',
    cliente: 'XYZ Ltda',
    descricao: 'Acompanhar proposta enviada'
  },
  {
    id: '3',
    titulo: 'Demo do Sistema',
    data: new Date(2025, 8, 28),
    horario: '10:00',
    tipo: 'demo',
    cliente: 'Tech Solutions',
    descricao: 'Demonstração das funcionalidades'
  },
  {
    id: '4',
    titulo: 'Reunião Interna',
    data: new Date(2025, 8, 30),
    horario: '16:00',
    tipo: 'outro',
    descricao: 'Planejamento mensal'
  },
];

const tiposEvento = {
  reuniao: { cor: 'bg-blue-500', label: 'Reunião' },
  'follow-up': { cor: 'bg-whatsapp-500', label: 'Follow-up' },
  demo: { cor: 'bg-purple-500', label: 'Demo' },
  outro: { cor: 'bg-orange-500', label: 'Outro' },
};

export default function CalendarioPage() {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const diasDoMes = eachDayOfInterval({
    start: startOfMonth(mesAtual),
    end: endOfMonth(mesAtual)
  });

  const eventosDoMes = eventos.filter(evento => 
    isSameMonth(evento.data, mesAtual)
  );

  const eventosData = (data: Date) => 
    eventosDoMes.filter(evento => isSameDay(evento.data, data));

  const proximoMes = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1));
  };

  const mesAnterior = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendário</h1>
          <p className="text-neutral-400 mt-1">Gerencie seus compromissos e reuniões</p>
        </div>
        <button 
          onClick={() => setMostrarModal(true)}
          className="btn-primary"
        >
          + Novo Evento
        </button>
      </div>

      {/* Calendar Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-500/10 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-neutral-400 text-sm font-medium">Reuniões</div>
              <div className="text-3xl font-bold mt-2 text-blue-400">
                {eventosDoMes.filter(e => e.tipo === 'reuniao').length}
              </div>
            </div>
            <div className="text-3xl opacity-50">🤝</div>
          </div>
        </div>
        
        <div className="bg-whatsapp-500/10 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-neutral-400 text-sm font-medium">Follow-ups</div>
              <div className="text-3xl font-bold mt-2 text-whatsapp-400">
                {eventosDoMes.filter(e => e.tipo === 'follow-up').length}
              </div>
            </div>
            <div className="text-3xl opacity-50">📞</div>
          </div>
        </div>
        
        <div className="bg-purple-500/10 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-neutral-400 text-sm font-medium">Demos</div>
              <div className="text-3xl font-bold mt-2 text-purple-400">
                {eventosDoMes.filter(e => e.tipo === 'demo').length}
              </div>
            </div>
            <div className="text-3xl opacity-50">💻</div>
          </div>
        </div>
        
        <div className="bg-orange-500/10 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-neutral-400 text-sm font-medium">Total</div>
              <div className="text-3xl font-bold mt-2 text-orange-400">{eventosDoMes.length}</div>
            </div>
            <div className="text-3xl opacity-50">📅</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {format(mesAtual, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={mesAnterior}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg"
              >
                ←
              </button>
              <button 
                onClick={proximoMes}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg"
              >
                →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
              <div key={dia} className="p-3 text-center text-sm font-medium text-neutral-400">
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {diasDoMes.map(dia => {
              const eventosNoDia = eventosData(dia);
              const ehHoje = isToday(dia);
              
              return (
                <button
                  key={dia.toISOString()}
                  onClick={() => setDataSelecionada(dia)}
                  className={`
                    p-3 h-24 border border-neutral-800 rounded-lg text-left hover:bg-neutral-800/50 transition-colors
                    ${ehHoje ? 'bg-whatsapp-500/20 border-whatsapp-500' : ''}
                    ${dataSelecionada && isSameDay(dia, dataSelecionada) ? 'bg-neutral-800' : ''}
                  `}
                >
                  <div className={`text-sm font-medium ${ehHoje ? 'text-whatsapp-400' : 'text-white'}`}>
                    {format(dia, 'd')}
                  </div>
                  <div className="mt-1 space-y-1">
                    {eventosNoDia.slice(0, 2).map(evento => (
                      <div 
                        key={evento.id}
                        className={`text-xs px-1 py-0.5 rounded text-white ${tiposEvento[evento.tipo].cor}`}
                      >
                        {evento.horario} {evento.titulo.slice(0, 10)}...
                      </div>
                    ))}
                    {eventosNoDia.length > 2 && (
                      <div className="text-xs text-neutral-400">
                        +{eventosNoDia.length - 2} mais
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {dataSelecionada ? format(dataSelecionada, 'dd/MM/yyyy') : 'Próximos Eventos'}
          </h3>
          
          <div className="space-y-3">
            {(dataSelecionada ? eventosData(dataSelecionada) : eventosDoMes.slice(0, 5)).map(evento => (
              <div key={evento.id} className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${tiposEvento[evento.tipo].cor}`}></div>
                  <span className="text-sm font-medium text-white">{evento.titulo}</span>
                </div>
                <div className="text-xs text-neutral-400 space-y-1">
                  <div>⏰ {evento.horario}</div>
                  {evento.cliente && <div>👤 {evento.cliente}</div>}
                  {evento.descricao && <div>📝 {evento.descricao}</div>}
                </div>
                <div className="mt-2">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium text-white ${tiposEvento[evento.tipo].cor}`}>
                    {tiposEvento[evento.tipo].label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-neutral-800">
            <div className="text-sm font-medium text-white mb-3">Tipos de Evento</div>
            <div className="space-y-2">
              {Object.entries(tiposEvento).map(([tipo, config]) => (
                <div key={tipo} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${config.cor}`}></div>
                  <span className="text-sm text-neutral-400">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
