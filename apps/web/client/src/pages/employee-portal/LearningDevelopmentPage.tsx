import { useCallback, useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, MapPin, Medal, TrendingUp, User, X } from 'lucide-react';
import { currentUser } from '../../data/mock/homeMockData';
import {
  coreCompetencies,
  initialTrainingProgressRecords,
  learningMaterials,
  trainingCalendarEvents,
  type LearningLevel,
  type LearningMaterial,
  type LearningMaterialType,
  type TrainingCalendarCategory,
  type TrainingCalendarEvent,
  type TrainingProgressRecord,
} from '../../data/mock/learningDevelopmentMockData';
import {
  addCertification,
  getStoredCertifications,
  hasCertification,
} from '../../data/certificationsStore';
import './LearningDevelopmentPage.css';

type LearningTab = 'materials' | 'competencies' | 'tracking' | 'calendar';

const LEVELS: Array<'All' | LearningLevel> = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const TYPES: Array<'All' | LearningMaterialType> = ['All', 'Course', 'Workshop', 'Module'];

function formatDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getLevelClass(level: LearningLevel) {
  if (level === 'Advanced') {
    return 'advanced';
  }
  if (level === 'Intermediate') {
    return 'intermediate';
  }
  return 'beginner';
}

function LearningDevelopmentPage() {
  const [activeTab, setActiveTab] = useState<LearningTab>('materials');
  const [selectedLevel, setSelectedLevel] = useState<'All' | LearningLevel>('All');
  const [selectedType, setSelectedType] = useState<'All' | LearningMaterialType>('All');
  const [progressRecords, setProgressRecords] = useState<TrainingProgressRecord[]>(initialTrainingProgressRecords);
  const [certificateState, setCertificateState] = useState(getStoredCertifications());

  const filteredMaterials = useMemo(() => (
    learningMaterials.filter((item) => (
      (selectedLevel === 'All' || item.level === selectedLevel)
      && (selectedType === 'All' || item.type === selectedType)
    ))
  ), [selectedLevel, selectedType]);

  const myProgressMap = useMemo(() => {
    const entries = progressRecords
      .filter((item) => item.employeeName === currentUser.name)
      .map((item) => [item.materialId, item] as const);
    return new Map(entries);
  }, [progressRecords]);

  const summary = useMemo(() => ({
    total: learningMaterials.length,
    courses: learningMaterials.filter((item) => item.type === 'Course').length,
    workshops: learningMaterials.filter((item) => item.type === 'Workshop').length,
    modules: learningMaterials.filter((item) => item.type === 'Module').length,
  }), []);

  function updateProgressRecord(recordId: string, increment: number) {
    const today = new Date().toISOString().slice(0, 10);
    setProgressRecords((previous) => previous.map((item) => {
      if (item.id !== recordId || item.status === 'Completed') {
        return item;
      }

      const nextProgress = Math.min(item.progress + increment, 100);
      const isCompleted = nextProgress >= 100;

      return {
        ...item,
        progress: nextProgress,
        status: isCompleted ? 'Completed' : 'In Progress',
        movement: `+${nextProgress - item.progress}% updated today`,
        lastActivity: today,
        completedOn: isCompleted ? today : undefined,
      };
    }));
  }

  function startOrContinueMaterial(material: LearningMaterial) {
    const today = new Date().toISOString().slice(0, 10);

    setProgressRecords((previous) => {
      const existing = previous.find((item) => (
        item.employeeName === currentUser.name && item.materialId === material.id
      ));

      if (!existing) {
        return [
          {
            id: `progress-${Date.now()}`,
            employeeName: currentUser.name,
            materialId: material.id,
            trainingTitle: material.title,
            competencyArea: material.category,
            status: 'In Progress',
            progress: 20,
            movement: '+20% started',
            startedOn: today,
            lastActivity: today,
          },
          ...previous,
        ];
      }

      if (existing.status === 'Completed') {
        return previous;
      }

      return previous.map((item) => {
        if (item.id !== existing.id) {
          return item;
        }

        const nextProgress = Math.min(item.progress + 20, 100);
        const isCompleted = nextProgress >= 100;

        return {
          ...item,
          progress: nextProgress,
          status: isCompleted ? 'Completed' : 'In Progress',
          movement: `+${nextProgress - item.progress}% updated today`,
          lastActivity: today,
          completedOn: isCompleted ? today : undefined,
        };
      });
    });
  }

  function generateCertificate(record: TrainingProgressRecord) {
    if (record.employeeName !== currentUser.name || record.status !== 'Completed') {
      return;
    }

    addCertification({
      employeeName: record.employeeName,
      trainingTitle: record.trainingTitle,
      competencyArea: record.competencyArea,
    });

    setCertificateState(getStoredCertifications());
  }

  return (
    <section className="ld-page">
      <header className="ld-header">
        <h1>Learning &amp; Development</h1>
        <div className="ld-tab-switch">
          <button className={activeTab === 'materials' ? 'active' : ''} onClick={() => setActiveTab('materials')}>
            Training materials
          </button>
          <button className={activeTab === 'competencies' ? 'active' : ''} onClick={() => setActiveTab('competencies')}>
            Competencies
          </button>
          <button className={activeTab === 'tracking' ? 'active' : ''} onClick={() => setActiveTab('tracking')}>
            Progress tracking
          </button>
          <button className={activeTab === 'calendar' ? 'active' : ''} onClick={() => setActiveTab('calendar')}>
            Training Calendar
          </button>
        </div>
      </header>

      <div className="ld-summary-grid">
        <article className="ld-summary-card">
          <p>Total materials</p>
          <strong>{summary.total}</strong>
          <span>Available now</span>
        </article>
        <article className="ld-summary-card">
          <p>Courses</p>
          <strong>{summary.courses}</strong>
          <span>Structured</span>
        </article>
        <article className="ld-summary-card">
          <p>Workshops</p>
          <strong>{summary.workshops}</strong>
          <span>Interactive</span>
        </article>
        <article className="ld-summary-card">
          <p>Modules</p>
          <strong>{summary.modules}</strong>
          <span>Short-form</span>
        </article>
      </div>

      {activeTab === 'materials' && (
        <>
          <div className="ld-filters">
            <select value={selectedLevel} onChange={(event) => setSelectedLevel(event.target.value as 'All' | LearningLevel)}>
              {LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <select value={selectedType} onChange={(event) => setSelectedType(event.target.value as 'All' | LearningMaterialType)}>
              {TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="ld-material-grid">
            {filteredMaterials.map((material) => {
              const myRecord = myProgressMap.get(material.id);
              const statusLabel = myRecord?.status ?? 'Not Started';
              const progressValue = myRecord?.progress ?? 0;
              const levelClass = getLevelClass(material.level);

              return (
                <article key={material.id} className="ld-material-card">
                  <div className={`ld-material-head ${levelClass}`}>
                    <span>{material.category}</span>
                    <span className="ld-level-chip">{material.level}</span>
                  </div>
                  <div className="ld-material-body">
                    <h3>{material.title}</h3>
                    <p>{material.description}</p>
                    <div className="ld-material-meta">
                      <span><Clock3 size={14} /> {material.durationHours}h</span>
                      <span>{statusLabel}</span>
                    </div>
                    {progressValue > 0 && (
                      <div className="ld-progress-wrapper">
                        <div className="ld-progress-caption">
                          <span>Progress</span>
                          <strong>{progressValue}%</strong>
                        </div>
                        <div className="ld-progress-track">
                          <div className="ld-progress-fill" style={{ width: `${progressValue}%` }} />
                        </div>
                      </div>
                    )}
                    <button
                      className="ld-cta-btn"
                      onClick={() => startOrContinueMaterial(material)}
                      disabled={statusLabel === 'Completed'}
                    >
                      {statusLabel === 'Not Started' && 'Start learning'}
                      {statusLabel === 'In Progress' && 'Continue'}
                      {statusLabel === 'Completed' && 'Completed'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'competencies' && (
        <div className="ld-competency-grid">
          {coreCompetencies.map((competency) => (
            <article key={competency.id} className="ld-competency-card">
              <h3>{competency.name}</h3>
              <p>{competency.description}</p>
              <div className="ld-competency-footer">
                <span>{competency.level}</span>
                <strong>{competency.learningMaterialCount} learning materials</strong>
              </div>
            </article>
          ))}
        </div>
      )}

      {activeTab === 'tracking' && (
        <div className="ld-tracking-list">
          {progressRecords.map((record) => {
            const certified = hasCertification(record.employeeName, record.trainingTitle);

            return (
              <article key={record.id} className="ld-tracking-card">
                <div className="ld-tracking-head">
                  <div>
                    <h3>{record.trainingTitle}</h3>
                    <p>{record.employeeName} | {record.competencyArea}</p>
                  </div>
                  <span className={`ld-status-chip ${record.status.toLowerCase().replace(' ', '-')}`}>
                    {record.status}
                  </span>
                </div>

                <div className="ld-tracking-meta">
                  <span><TrendingUp size={14} /> {record.movement}</span>
                  <span>Started: {formatDate(record.startedOn)}</span>
                  <span>Last activity: {formatDate(record.lastActivity)}</span>
                </div>

                <div className="ld-progress-track">
                  <div className="ld-progress-fill" style={{ width: `${record.progress}%` }} />
                </div>

                <div className="ld-tracking-actions">
                  <strong>{record.progress}% complete</strong>
                  {record.status === 'In Progress' && (
                    <button className="ld-cta-btn small" onClick={() => updateProgressRecord(record.id, 20)}>
                      Update Progress
                    </button>
                  )}
                  {record.status === 'Completed' && record.employeeName === currentUser.name && !certified && (
                    <button className="ld-cta-btn small" onClick={() => generateCertificate(record)}>
                      Generate Certificate
                    </button>
                  )}
                  {record.status === 'Completed' && (certified || record.employeeName !== currentUser.name) && (
                    <span className="ld-certified-badge">
                      <Medal size={14} /> {certified ? 'Certificate Issued' : 'Completed'}
                    </span>
                  )}
                </div>
              </article>
            );
          })}

          {certificateState.some((item) => item.employeeName === currentUser.name) && (
            <div className="ld-certificate-note">
              <CheckCircle2 size={16} />
              Certificates generated for {currentUser.name} are now visible in My Profile under Certifications Acquired.
            </div>
          )}
        </div>
      )}

      {activeTab === 'calendar' && (
        <TrainingCalendar events={trainingCalendarEvents} />
      )}
    </section>
  );
}

const CATEGORY_COLORS: Record<TrainingCalendarCategory, string> = {
  Competency: '#3b82f6',
  IDP: '#8b5cf6',
  'Cross-Training': '#f59e0b',
  'Leadership Essentials': '#10b981',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime12h(time24: string) {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function TrainingCalendar({ events }: { events: TrainingCalendarEvent[] }) {
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 3, 1));
  const [selectedEvent, setSelectedEvent] = useState<TrainingCalendarEvent | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'All' | TrainingCalendarCategory>('All');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const goToPrevMonth = useCallback(() => {
    setCurrentDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const goToNextMonth = useCallback(() => {
    setCurrentDate(new Date(year, month + 1, 1));
  }, [year, month]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date(2026, 3, 1));
  }, []);

  const filteredEvents = useMemo(() => (
    categoryFilter === 'All'
      ? events
      : events.filter((e) => e.category === categoryFilter)
  ), [events, categoryFilter]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, TrainingCalendarEvent[]> = {};
    for (const event of filteredEvents) {
      if (!map[event.date]) map[event.date] = [];
      map[event.date].push(event);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [filteredEvents]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: Array<{ day: number; inMonth: boolean; dateStr: string }> = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      days.push({ day: d, inMonth: false, dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        inMonth: true,
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const m = month + 2 > 12 ? 1 : month + 2;
        const y = month + 2 > 12 ? year + 1 : year;
        days.push({ day: d, inMonth: false, dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
      }
    }

    return days;
  }, [year, month]);

  return (
    <div className="tc-container">
      <div className="tc-toolbar">
        <div className="tc-nav">
          <button className="tc-nav-btn" onClick={goToPrevMonth} aria-label="Previous month"><ChevronLeft size={16} /></button>
          <h2>{MONTH_NAMES[month]} {year}</h2>
          <button className="tc-nav-btn" onClick={goToNextMonth} aria-label="Next month"><ChevronRight size={16} /></button>
          <button className="tc-today-btn" onClick={goToToday}>Today</button>
        </div>
        <div className="tc-legend">
          <button
            className={`tc-legend-item ${categoryFilter === 'All' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('All')}
          >
            All
          </button>
          {(Object.keys(CATEGORY_COLORS) as TrainingCalendarCategory[]).map((cat) => (
            <button
              key={cat}
              className={`tc-legend-item ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat === categoryFilter ? 'All' : cat)}
            >
              <span className="tc-legend-dot" style={{ background: CATEGORY_COLORS[cat] }} />
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="tc-grid">
        {DAY_NAMES.map((day) => (
          <div key={day} className="tc-day-header">{day}</div>
        ))}
        {calendarDays.map((cell, idx) => {
          const dayEvents = eventsByDate[cell.dateStr] ?? [];
          return (
            <div
              key={idx}
              className={`tc-cell ${cell.inMonth ? '' : 'tc-cell-outside'} ${dayEvents.length > 0 ? 'tc-cell-has-events' : ''}`}
            >
              <span className="tc-cell-day">{cell.day}</span>
              <div className="tc-cell-events">
                {dayEvents.slice(0, 2).map((ev) => (
                  <button
                    key={ev.id}
                    className="tc-event-pill"
                    style={{ borderLeftColor: CATEGORY_COLORS[ev.category] }}
                    onClick={() => setSelectedEvent(ev)}
                    title={ev.title}
                  >
                    <span className="tc-event-time">{formatTime12h(ev.startTime)}</span>
                    <span className="tc-event-title">{ev.title}</span>
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <span className="tc-more-events">+{dayEvents.length - 2} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <div className="tc-detail-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="tc-detail-card" onClick={(e) => e.stopPropagation()}>
            <div className="tc-detail-header">
              <div
                className="tc-detail-category"
                style={{ background: CATEGORY_COLORS[selectedEvent.category] }}
              >
                {selectedEvent.category}
              </div>
              <button className="tc-detail-close" onClick={() => setSelectedEvent(null)} aria-label="Close event details">
                <X size={18} />
              </button>
            </div>
            <h3>{selectedEvent.title}</h3>
            <p className="tc-detail-desc">{selectedEvent.description}</p>
            <div className="tc-detail-meta">
              <div className="tc-detail-meta-item">
                <Clock3 size={14} />
                <span>
                  {formatTime12h(selectedEvent.startTime)} – {formatTime12h(selectedEvent.endTime)}
                </span>
              </div>
              <div className="tc-detail-meta-item">
                <MapPin size={14} />
                <span>{selectedEvent.location}</span>
              </div>
              <div className="tc-detail-meta-item">
                <User size={14} />
                <span>{selectedEvent.instructor}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LearningDevelopmentPage;
