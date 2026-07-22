import { useMemo } from 'react';
import { useStore } from '@/store';

export interface TopicSelection {
  subjectId: string;
  topicId: string;
  subtopicId: string;
}

interface TopicSelectorProps {
  subjectId: string;
  topicId: string;
  /** Omit this prop to hide the subtopic select entirely. */
  subtopicId?: string;
  onChange: (value: TopicSelection) => void;
  /**
   * 'filter' (default) shows an "all" option and keeps every item visible when
   * no parent is selected. 'form' shows a placeholder and requires the cascade.
   */
  mode?: 'filter' | 'form';
  /**
   * 'row' renders a self-contained 3-column grid; 'stack' stacks vertically;
   * 'bare' renders the selects as fragment siblings (no wrapper) so they flow
   * into a parent grid alongside other fields.
   */
  layout?: 'row' | 'stack' | 'bare';
  /** Render the "Matéria/Tópico/Subtópico" labels above each select. */
  labels?: boolean;
  /** 'md' (default) matches page filters; 'sm' matches the compact modal style. */
  size?: 'md' | 'sm';
  disabled?: boolean;
}

const SELECT_CLASS_MD =
  'w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-true-white';
const SELECT_CLASS_SM =
  'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm';
const LABEL_CLASS_MD = 'block text-sm font-medium text-gray-300 mb-2';
const LABEL_CLASS_SM = 'block text-sm text-gray-300 mb-1';

export function TopicSelector({
  subjectId,
  topicId,
  subtopicId,
  onChange,
  mode = 'filter',
  layout = 'row',
  labels = true,
  size = 'md',
  disabled = false,
}: TopicSelectorProps) {
  const subjects = useStore((s) => s.subjects);
  const topics = useStore((s) => s.topics);
  const subtopics = useStore((s) => s.subtopics);

  const showSubtopic = subtopicId !== undefined;
  const isFilter = mode === 'filter';
  const selectClass = size === 'sm' ? SELECT_CLASS_SM : SELECT_CLASS_MD;
  const labelClass = size === 'sm' ? LABEL_CLASS_SM : LABEL_CLASS_MD;

  const availableTopics = useMemo(() => {
    if (!subjectId) return isFilter ? topics : [];
    return topics.filter((topic) => topic.subjectId === subjectId);
  }, [topics, subjectId, isFilter]);

  const availableSubtopics = useMemo(() => {
    if (!topicId) return isFilter ? subtopics : [];
    return subtopics.filter((st) => st.topicId === topicId);
  }, [subtopics, topicId, isFilter]);

  const handleSubject = (value: string) => {
    onChange({ subjectId: value, topicId: '', subtopicId: '' });
  };

  const handleTopic = (value: string) => {
    onChange({ subjectId, topicId: value, subtopicId: '' });
  };

  const handleSubtopic = (value: string) => {
    onChange({ subjectId, topicId, subtopicId: value });
  };

  const containerClass =
    layout === 'row'
      ? `grid grid-cols-1 ${showSubtopic ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`
      : 'space-y-4';

  const subjectField = (
    <div>
      {labels && <label className={labelClass}>Matéria</label>}
      <select
        value={subjectId}
        onChange={(event) => handleSubject(event.target.value)}
        className={selectClass}
        disabled={disabled}
      >
        <option value="">{isFilter ? 'Todas' : 'Selecione a matéria'}</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </select>
    </div>
  );

  const topicField = (
    <div>
      {labels && <label className={labelClass}>Tópico</label>}
      <select
        value={topicId}
        onChange={(event) => handleTopic(event.target.value)}
        className={selectClass}
        disabled={disabled || (!isFilter && !subjectId)}
      >
        <option value="">{isFilter ? 'Todos' : 'Selecione o tópico'}</option>
        {availableTopics.map((topic) => (
          <option key={topic.id} value={topic.id}>
            {topic.name}
          </option>
        ))}
      </select>
    </div>
  );

  const subtopicField = showSubtopic ? (
    <div>
      {labels && <label className={labelClass}>Subtópico</label>}
      <select
        value={subtopicId}
        onChange={(event) => handleSubtopic(event.target.value)}
        className={selectClass}
        disabled={disabled || (!isFilter && !topicId)}
      >
        <option value="">{isFilter ? 'Todos' : 'Nenhum'}</option>
        {availableSubtopics.map((st) => (
          <option key={st.id} value={st.id}>
            {st.name}
          </option>
        ))}
      </select>
    </div>
  ) : null;

  if (layout === 'bare') {
    return (
      <>
        {subjectField}
        {topicField}
        {subtopicField}
      </>
    );
  }

  return (
    <div className={containerClass}>
      {subjectField}
      {topicField}
      {subtopicField}
    </div>
  );
}
