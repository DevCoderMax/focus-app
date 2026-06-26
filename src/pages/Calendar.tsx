import { useEffect, useState, useMemo } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  BookOpen,
  Trash2,
  X,
  Play,
  Timer
} from 'lucide-react';
import { generateId, formatTime } from '@/utils/helpers';
import type { StudySession } from '@/types';

interface CalendarEvent {
  id: string;
  title: string;
  subjectId?: string;
  topicId?: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startHour: number; // 0-23
  endHour: number; // 0-23
  color: string;
  recurring: boolean; // Se o evento se repete toda semana
  createdAt: string;
  updatedAt: string;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const EVENT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function CalendarPage() {
  const { subjects, topics, studySessions, loadAllData } = useStore();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    return new Date(today.setDate(diff));
  });
  
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const stored = localStorage.getItem('focus.calendarEvents');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [, setSelectedHour] = useState<number | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventSubjectId, setNewEventSubjectId] = useState('');
  const [newEventTopicId, setNewEventTopicId] = useState('');
  const [newEventStartHour, setNewEventStartHour] = useState(9);
  const [newEventEndHour, setNewEventEndHour] = useState(10);
  const [newEventColor, setNewEventColor] = useState(EVENT_COLORS[0]);
  const [newEventRecurring, setNewEventRecurring] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    localStorage.setItem('focus.calendarEvents', JSON.stringify(events));
  }, [events]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentWeekStart]);

  const formatWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startMonth = start.toLocaleDateString('pt-BR', { month: 'short' });
    const endMonth = end.toLocaleDateString('pt-BR', { month: 'short' });
    const year = start.getFullYear();
    
    if (startMonth === endMonth) {
      return `${start.getDate()} - ${end.getDate()} de ${startMonth} de ${year}`;
    }
    return `${start.getDate()} de ${startMonth} - ${end.getDate()} de ${endMonth} de ${year}`;
  };

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToToday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    setCurrentWeekStart(new Date(today.setDate(diff)));
  };

  const handleAddEvent = () => {
    if (!newEventTitle.trim()) return;
    if (newEventStartHour >= newEventEndHour) return;

    const event: CalendarEvent = {
      id: generateId(),
      title: newEventTitle,
      subjectId: newEventSubjectId || undefined,
      topicId: newEventTopicId || undefined,
      dayOfWeek: selectedDay ?? 0,
      startHour: newEventStartHour,
      endHour: newEventEndHour,
      color: newEventColor,
      recurring: newEventRecurring,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEvents([...events, event]);
    resetForm();
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
    setSelectedEvent(null);
  };

  const resetForm = () => {
    setIsAddingEvent(false);
    setSelectedDay(null);
    setSelectedHour(null);
    setNewEventTitle('');
    setNewEventSubjectId('');
    setNewEventTopicId('');
    setNewEventStartHour(9);
    setNewEventEndHour(10);
    setNewEventColor(EVENT_COLORS[0]);
    setNewEventRecurring(false);
  };

  const handleCellClick = (dayIndex: number, hour: number) => {
    setSelectedDay(dayIndex);
    setSelectedHour(hour);
    setNewEventStartHour(hour);
    setNewEventEndHour(hour + 1);
    setIsAddingEvent(true);
  };

  const getEventsForDayAndHour = (dayIndex: number, hour: number) => {
    return events.filter(
      e => e.dayOfWeek === dayIndex && hour >= e.startHour && hour < e.endHour
    );
  };

  const getStudySessionsForDay = (dayIndex: number) => {
    return studySessions.filter(session => {
      const sessionDate = new Date(session.startedAt);
      const sessionDay = sessionDate.getDay();
      return sessionDay === dayIndex && isDateInCurrentWeek(sessionDate);
    });
  };

  const isDateInCurrentWeek = (date: Date) => {
    const weekStart = new Date(currentWeekStart);
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return date >= weekStart && date < weekEnd;
  };

  const formatSessionTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getSessionDuration = (session: StudySession) => {
    return formatTime(session.durationSec);
  };

  const getSubjectName = (subjectId?: string) => {
    if (!subjectId) return '';
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || '';
  };

  const getTopicName = (topicId?: string) => {
    if (!topicId) return '';
    const topic = topics.find(t => t.id === topicId);
    return topic?.name || '';
  };

  const topicsForSubject = useMemo(() => {
    if (!newEventSubjectId) return [];
    return topics.filter(t => t.subjectId === newEventSubjectId);
  }, [topics, newEventSubjectId]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <CalendarIcon size={36} />
            Calendário de Estudos
          </h1>
          <p className="text-gray-400">Organize sua semana de estudos</p>
        </div>
        <Button onClick={() => setIsAddingEvent(true)}>
          <Plus size={20} className="mr-2" />
          Novo Evento
        </Button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6 bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft size={20} />
          </Button>
          <h2 className="text-xl font-semibold min-w-[300px] text-center">
            {formatWeekRange()}
          </h2>
          <Button variant="ghost" size="sm" onClick={goToNextWeek}>
            <ChevronRight size={20} />
          </Button>
        </div>
        <Button variant="secondary" size="sm" onClick={goToToday}>
          Hoje
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-8 border-b border-gray-800">
          <div className="p-3 text-center text-sm text-gray-500 border-r border-gray-800">
            Hora
          </div>
          {weekDays.map((date, index) => (
            <div
              key={index}
              className={`p-3 text-center border-r border-gray-800 last:border-r-0 ${
                isToday(date) ? 'bg-blue-900/30' : ''
              }`}
            >
              <div className="text-sm text-gray-400">{DAYS_OF_WEEK[index]}</div>
              <div className={`text-lg font-semibold ${isToday(date) ? 'text-blue-400' : ''}`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="max-h-[600px] overflow-y-auto">
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-800 last:border-b-0">
              <div className="p-2 text-center text-sm text-gray-500 border-r border-gray-800 bg-gray-850">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map((_, dayIndex) => {
                const dayEvents = getEventsForDayAndHour(dayIndex, hour);
                const isFirstHourOfEvent = dayEvents.some(e => e.startHour === hour);
                const daySessions = getStudySessionsForDay(dayIndex);
                const sessionsInHour = daySessions.filter(session => {
                  const sessionDate = new Date(session.startedAt);
                  const sessionHour = sessionDate.getHours();
                  return sessionHour === hour;
                });
                
                return (
                  <div
                    key={dayIndex}
                    className={`p-1 border-r border-gray-800 last:border-r-0 min-h-[50px] cursor-pointer hover:bg-gray-800/50 transition-colors relative ${
                      isToday(weekDays[dayIndex]) ? 'bg-blue-900/10' : ''
                    }`}
                    onClick={() => handleCellClick(dayIndex, hour)}
                  >
                    {isFirstHourOfEvent && dayEvents.map(event => {
                      const eventHeight = (event.endHour - event.startHour) * 50;
                      return (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 absolute left-1 right-1 z-10"
                          style={{
                            backgroundColor: event.color + '40',
                            borderLeft: `3px solid ${event.color}`,
                            height: `${eventHeight}px`,
                            top: '2px'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-gray-400 text-[10px]">
                            {event.startHour.toString().padStart(2, '0')}:00 - {event.endHour.toString().padStart(2, '0')}:00
                          </div>
                          {event.subjectId && (
                            <div className="text-gray-400 truncate">
                              {getSubjectName(event.subjectId)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {sessionsInHour.map(session => (
                      <div
                        key={session.id}
                        className="text-xs p-1 rounded mb-1 bg-green-900/40 border-l-3 border-green-500 cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <Play size={10} className="text-green-400" />
                          <span className="font-medium truncate">Sessão de Estudo</span>
                        </div>
                        <div className="text-gray-400 text-[10px]">
                          {formatSessionTime(session.startedAt)} - {formatSessionTime(session.endedAt)}
                        </div>
                        <div className="text-gray-400 text-[10px] flex items-center gap-1">
                          <Timer size={10} />
                          {getSessionDuration(session)}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Add Event Modal */}
      {isAddingEvent && (
        <div className="fixed inset-0 bg-true-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Novo Evento de Estudo</h2>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X size={20} />
              </Button>
            </div>
            
            <div className="space-y-4">
              <Input
                label="Título do evento"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Ex: Revisão de Matemática"
                autoFocus
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Matéria (opcional)
                </label>
                <select
                  value={newEventSubjectId}
                  onChange={(e) => {
                    setNewEventSubjectId(e.target.value);
                    setNewEventTopicId('');
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-true-white"
                >
                  <option value="">Selecione uma matéria</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {newEventSubjectId && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tópico (opcional)
                  </label>
                  <select
                    value={newEventTopicId}
                    onChange={(e) => setNewEventTopicId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-true-white"
                  >
                    <option value="">Selecione um tópico</option>
                    {topicsForSubject.map(topic => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Clock size={14} className="inline mr-1" />
                    Hora início
                  </label>
                  <select
                    value={newEventStartHour}
                    onChange={(e) => setNewEventStartHour(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-true-white"
                  >
                    {HOURS.map(hour => (
                      <option key={hour} value={hour}>
                        {hour.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Clock size={14} className="inline mr-1" />
                    Hora fim
                  </label>
                  <select
                    value={newEventEndHour}
                    onChange={(e) => setNewEventEndHour(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-true-white"
                  >
                    {HOURS.filter(h => h > newEventStartHour).map(hour => (
                      <option key={hour} value={hour}>
                        {hour.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cor do evento
                </label>
                <div className="flex gap-2 flex-wrap">
                  {EVENT_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewEventColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        newEventColor === color ? 'scale-110 ring-2 ring-white' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={newEventRecurring}
                  onChange={(e) => setNewEventRecurring(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="recurring" className="text-sm text-gray-300 cursor-pointer">
                  Recorrente (repetir toda semana)
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button onClick={handleAddEvent} className="flex-1">
                  Criar Evento
                </Button>
                <Button variant="ghost" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-true-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedEvent.title}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(null)}>
                <X size={20} />
              </Button>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-gray-300">
                <CalendarIcon size={16} />
                <span>{DAYS_OF_WEEK[selectedEvent.dayOfWeek]}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Clock size={16} />
                <span>
                  {selectedEvent.startHour.toString().padStart(2, '0')}:00 - {selectedEvent.endHour.toString().padStart(2, '0')}:00
                </span>
              </div>
              {selectedEvent.subjectId && (
                <div className="flex items-center gap-2 text-gray-300">
                  <BookOpen size={16} />
                  <span>{getSubjectName(selectedEvent.subjectId)}</span>
                </div>
              )}
              {selectedEvent.topicId && (
                <div className="flex items-center gap-2 text-gray-300 pl-6">
                  <span>→ {getTopicName(selectedEvent.topicId)}</span>
                </div>
              )}
              {selectedEvent.recurring && (
                <div className="flex items-center gap-2 text-blue-400">
                  <CalendarIcon size={16} />
                  <span>Recorrente (toda semana)</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="flex-1 text-red-400 hover:text-red-300"
              >
                <Trash2 size={16} className="mr-2" />
                Excluir
              </Button>
              <Button variant="ghost" onClick={() => setSelectedEvent(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
