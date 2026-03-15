import { Rocket, Star, Calendar, CheckCircle2 } from 'lucide-react';

const RELEASES = [
    {
        version: '1.3.0',
        date: '15/03/2026',
        title: 'Calendário de Estudos Semanal',
        features: [
            'Nova aba "Calendário" para organizar estudos semanais',
            'Visualização semanal estilo Google Calendar com grade de horários',
            'Criação de eventos de estudo com título, matéria e tópico',
            'Seleção de cores personalizadas para cada evento',
            'Navegação entre semanas com botões de anterior/próxima',
            'Botão "Hoje" para voltar rapidamente à semana atual',
            'Clique em evento para ver detalhes e opção de excluir',
            'Eventos salvos localmente e persistidos entre sessões',
            'Eventos agora esticam visualmente para ocupar o intervalo de horas completo',
            'Sessões de estudo registradas aparecem no calendário',
            'Exibição de horário de início, fim e duração das sessões de estudo',
            'Opção de recorrência para eventos se repetirem toda semana',
            'Eventos recorrentes aparecem em todas as semanas automaticamente',
        ],
    },
    {
        version: '1.2.0',
        date: '15/03/2026',
        title: 'Sistema de Progresso e Checklists',
        features: [
            'Removida a aba "Aulas" para simplificar a navegação',
            'Adicionados checkboxes para marcar tópicos e subtópicos como concluídos',
            'Barra de progresso individual para cada matéria mostrando conclusão de tópicos e subtópicos',
            'Barra de progresso no cabeçalho agora considera o progresso de todas as matérias',
            'Conclusão automática de tópico quando todos os subtópicos são marcados',
            'Desmarcar um tópico também desmarca todos os seus subtópicos',
            'Progresso salvo localmente e persistido entre sessões',
        ],
    },
    {
        version: '1.1.0',
        date: '05/03/2026',
        title: 'Hierarquia de Subtópicos e Refatoração',
        features: [
            'Adicionado suporte completo para Subtópicos',
            'Matéria > Tópico > Subtópico: 3 níveis de organização de estudos',
            'Nova interface expansível na tela de Matérias para gerenciamento fácil',
            'Filtros aprimorados em Sessões, Aulas, Cronômetro, Anotações e Histórico de Questões para agrupar estudos por Subtópico',
            'Refatoração geral de termos: "Tema" agora se chama "Tópico" para fazer mais sentido.',
            'Aba "Novidades" criada para rastrear atualizações recentes',
        ],
    },
    {
        version: '1.0.0',
        date: 'Lançamento Inicial',
        title: 'Gerenciador de Estudos Focus',
        features: [
            'Criação de Perfis',
            'Gerenciamento de disciplinas',
            'Cronômetro Pomodoro integrado',
            'Anotações ricas (Rich Text)',
            'Registro de atividades e métricas de questões',
        ],
    },
];

export function ReleasesPage() {
    return (
        <div className="p-8 max-w-4xl max-w-5xl">
            <div className="mb-10">
                <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
                    <Rocket className="text-true-white" size={36} />
                    Novidades e Atualizações
                </h1>
                <p className="text-gray-400 text-lg">
                    Acompanhe o que há de novo nas recentes versões do Focus App.
                </p>
            </div>

            <div className="space-y-8">
                {RELEASES.map((release, index) => (
                    <div
                        key={release.version}
                        className="bg-gray-900 border border-gray-800 rounded-xl p-6 relative overflow-hidden group"
                    >
                        {index === 0 && (
                            <div className="absolute top-0 right-0 bg-blue-600/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-bl-lg border-b border-l border-blue-500/30 flex items-center gap-1">
                                <Star size={12} fill="currentColor" />
                                MAIS RECENTE
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 pb-4 border-b border-gray-800">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl font-bold text-true-white">
                                        v{release.version}
                                    </span>
                                    <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-md flex items-center gap-1 font-medium">
                                        <Calendar size={12} />
                                        {release.date}
                                    </span>
                                </div>
                                <h2 className="text-xl text-gray-200 font-semibold">{release.title}</h2>
                            </div>
                        </div>

                        <ul className="space-y-3">
                            {release.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-gray-300">
                                    <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                                    <span className="leading-relaxed">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
