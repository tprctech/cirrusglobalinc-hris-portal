import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { ArrowDown, ArrowUp, Trash2, X } from 'lucide-react';
import '../pages/employee-portal/ReviewsPage.css';

export type BuilderQuestionType =
  | 'Long Answer'
  | 'Single Choice'
  | 'Multiple Choice'
  | '5-Star Rating';

export type BuilderSectionQuestion = {
  id: string;
  prompt: string;
  type: BuilderQuestionType;
  options: string[];
  required: boolean;
};

export type BuilderSection = {
  id: string;
  label: string;
  questions: BuilderSectionQuestion[];
  isReadOnly?: boolean;
  readOnlyReason?: string;
  sourceTitle?: string;
  sourceDescription?: string;
  sourceQuestionSetId?: number;
};

type BuilderFieldOption = {
  label: string;
  value: string;
  description?: string;
};

type BuilderFieldConfig = {
  id: string;
  label: string;
  name: string;
  dataField: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'date' | 'select';
  options?: BuilderFieldOption[];
  helperText?: string;
  disabled?: boolean;
  disabledTooltip?: string;
};

export type BuilderExistingSectionOption = {
  id: string;
  label: string;
  description?: string;
  section: BuilderSection;
};

type TemplateBuilderModalProps = {
  isOpen: boolean;
  templateId: string;
  templateEntity: string;
  modalTitle: string;
  modalDescription: string;
  metaFields?: BuilderFieldConfig[];
  subjectField: BuilderFieldConfig;
  afterSubjectFields?: BuilderFieldConfig[];
  titleField: BuilderFieldConfig;
  sections: BuilderSection[];
  setSections: Dispatch<SetStateAction<BuilderSection[]>>;
  existingSectionOptions?: BuilderExistingSectionOption[];
  allowMultipleSections?: boolean;
  saveButtonLabel: string;
  onSave: () => void;
  onClose: () => void;
};

const questionTypeOptions: BuilderQuestionType[] = [
  'Long Answer',
  'Single Choice',
  'Multiple Choice',
  '5-Star Rating',
];

function getMaxNumericSuffix(ids: string[], prefix: string) {
  let max = 0;
  for (const id of ids) {
    if (!id.startsWith(prefix)) {
      continue;
    }
    const parsed = Number(id.slice(prefix.length));
    if (!Number.isNaN(parsed)) {
      max = Math.max(max, parsed);
    }
  }
  return max;
}

function TemplateBuilderModal({
  isOpen,
  templateId,
  templateEntity,
  modalTitle,
  modalDescription,
  metaFields = [],
  subjectField,
  afterSubjectFields = [],
  titleField,
  sections,
  setSections,
  existingSectionOptions = [],
  allowMultipleSections = true,
  saveButtonLabel,
  onSave,
  onClose,
}: TemplateBuilderModalProps) {
  const [selectedExistingSectionId, setSelectedExistingSectionId] = useState('');
  const sectionCounterRef = useRef(sections.length + 1);
  const questionCounterRef = useRef(
    sections.reduce((count, section) => count + section.questions.length, 0) + 1,
  );
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const previousSectionTopsRef = useRef<Record<string, number>>({});
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const previousQuestionTopsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const sectionIds = sections.map((section) => section.id);
    const questionIds = sections.flatMap((section) => section.questions.map((question) => question.id));

    sectionCounterRef.current = getMaxNumericSuffix(sectionIds, 'section-') + 1;
    questionCounterRef.current = getMaxNumericSuffix(questionIds, 'question-') + 1;
  }, [isOpen]);

  useLayoutEffect(() => {
    const previousTops = previousSectionTopsRef.current;
    if (!Object.keys(previousTops).length) {
      return;
    }

    for (const section of sections) {
      const element = sectionRefs.current[section.id];
      if (!element) {
        continue;
      }

      const previousTop = previousTops[section.id];
      if (previousTop === undefined) {
        continue;
      }

      const currentTop = element.getBoundingClientRect().top;
      const deltaY = previousTop - currentTop;
      if (deltaY === 0) {
        continue;
      }

      element.style.transition = 'none';
      element.style.transform = `translateY(${deltaY}px)`;
      element.style.willChange = 'transform';
      void element.offsetHeight;
      element.style.transition = 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)';
      element.style.transform = 'translateY(0)';

      const handleTransitionEnd = () => {
        element.style.transition = '';
        element.style.willChange = '';
        element.removeEventListener('transitionend', handleTransitionEnd);
      };
      element.addEventListener('transitionend', handleTransitionEnd);
    }

    previousSectionTopsRef.current = {};
  }, [sections]);

  useLayoutEffect(() => {
    const previousTops = previousQuestionTopsRef.current;
    if (!Object.keys(previousTops).length) {
      return;
    }

    for (const [questionKey, previousTop] of Object.entries(previousTops)) {
      const element = questionRefs.current[questionKey];
      if (!element) {
        continue;
      }

      const currentTop = element.getBoundingClientRect().top;
      const deltaY = previousTop - currentTop;
      if (deltaY === 0) {
        continue;
      }

      element.style.transition = 'none';
      element.style.transform = `translateY(${deltaY}px)`;
      element.style.willChange = 'transform';
      void element.offsetHeight;
      element.style.transition = 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)';
      element.style.transform = 'translateY(0)';

      const handleTransitionEnd = () => {
        element.style.transition = '';
        element.style.willChange = '';
        element.removeEventListener('transitionend', handleTransitionEnd);
      };
      element.addEventListener('transitionend', handleTransitionEnd);
    }

    previousQuestionTopsRef.current = {};
  }, [sections]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!existingSectionOptions.length) {
      setSelectedExistingSectionId('');
      return;
    }

    setSelectedExistingSectionId((previous) => {
      if (existingSectionOptions.some((option) => option.id === previous)) {
        return previous;
      }
      return existingSectionOptions[0].id;
    });
  }, [isOpen, existingSectionOptions]);

  function nextSectionId() {
    const id = `section-${sectionCounterRef.current}`;
    sectionCounterRef.current += 1;
    return id;
  }

  function nextQuestionId() {
    const id = `question-${questionCounterRef.current}`;
    questionCounterRef.current += 1;
    return id;
  }

  function captureSectionPositions() {
    const nextPositions: Record<string, number> = {};
    for (const section of sections) {
      const element = sectionRefs.current[section.id];
      if (!element) {
        continue;
      }
      nextPositions[section.id] = element.getBoundingClientRect().top;
    }
    previousSectionTopsRef.current = nextPositions;
  }

  function captureQuestionPositions(sectionId: string) {
    const section = sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    const nextPositions: Record<string, number> = {};
    for (const question of section.questions) {
      const questionKey = `${sectionId}:${question.id}`;
      const element = questionRefs.current[questionKey];
      if (!element) {
        continue;
      }
      nextPositions[questionKey] = element.getBoundingClientRect().top;
    }
    previousQuestionTopsRef.current = nextPositions;
  }

  function addSection() {
    setSections((previous) => [
      ...previous,
      {
        id: nextSectionId(),
        label: `New Section ${previous.length + 1}`,
        questions: [
          {
            id: nextQuestionId(),
            prompt: 'New question',
            type: 'Long Answer',
            options: [],
            required: false,
          },
        ],
      },
    ]);
  }

  function addExistingSection() {
    if (!selectedExistingSectionId) {
      return;
    }

    const selectedOption = existingSectionOptions.find((option) => option.id === selectedExistingSectionId);
    if (!selectedOption) {
      return;
    }

    const clonedSection: BuilderSection = {
      id: nextSectionId(),
      label: selectedOption.section.label,
      isReadOnly: true,
      readOnlyReason: 'This section comes from a reusable question set.',
      sourceTitle: selectedOption.label,
      sourceDescription: selectedOption.description,
      sourceQuestionSetId: Number(selectedOption.id) || undefined,
      questions: selectedOption.section.questions.map((question) => ({
        id: nextQuestionId(),
        prompt: question.prompt,
        type: question.type,
        options: [...question.options],
        required: question.required ?? false,
      })),
    };

    setSections((previous) => [...previous, clonedSection]);
  }

  function removeSection(sectionId: string) {
    setSections((previous) => {
      if (previous.length <= 1) {
        return previous;
      }
      return previous.filter((section) => section.id !== sectionId);
    });
  }

  function moveSection(sectionId: string, direction: 'up' | 'down') {
    captureSectionPositions();
    setSections((previous) => {
      const currentIndex = previous.findIndex((section) => section.id === sectionId);
      if (currentIndex < 0) {
        return previous;
      }

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= previous.length) {
        return previous;
      }

      const next = [...previous];
      [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
      return next;
    });
  }

  function updateSectionLabel(sectionId: string, value: string) {
    setSections((previous) => previous.map((section) => (
      section.id === sectionId ? { ...section, label: value } : section
    )));
  }

  function addQuestion(sectionId: string) {
    setSections((previous) => previous.map((section) => {
      if (section.id !== sectionId) {
        return section;
      }

      const newQuestion: BuilderSectionQuestion = {
        id: nextQuestionId(),
        prompt: 'New question',
        type: 'Long Answer',
        options: [],
        required: false,
      };
      return { ...section, questions: [...section.questions, newQuestion] };
    }));
  }

  function removeQuestion(sectionId: string, questionId: string) {
    setSections((previous) => previous.map((section) => {
      if (section.id !== sectionId) {
        return section;
      }

      if (section.questions.length <= 1) {
        return section;
      }

      return {
        ...section,
        questions: section.questions.filter((question) => question.id !== questionId),
      };
    }));
  }

  function moveQuestion(sectionId: string, questionId: string, direction: 'up' | 'down') {
    captureQuestionPositions(sectionId);
    setSections((previous) => previous.map((section) => {
      if (section.id !== sectionId) {
        return section;
      }

      const currentIndex = section.questions.findIndex((question) => question.id === questionId);
      if (currentIndex < 0) {
        return section;
      }

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= section.questions.length) {
        return section;
      }

      const nextQuestions = [...section.questions];
      [nextQuestions[currentIndex], nextQuestions[targetIndex]] = [
        nextQuestions[targetIndex],
        nextQuestions[currentIndex],
      ];

      return { ...section, questions: nextQuestions };
    }));
  }

  function updateQuestion(
    sectionId: string,
    questionId: string,
    key: 'prompt' | 'type',
    value: string,
  ) {
    setSections((previous) => previous.map((section) => {
      if (section.id !== sectionId) {
        return section;
      }

      return {
        ...section,
        questions: section.questions.map((question) => {
          if (question.id !== questionId) {
            return question;
          }

          if (key === 'type') {
            const nextType = value as BuilderQuestionType;
            return {
              ...question,
              type: nextType,
              options: nextType === 'Multiple Choice' || nextType === 'Single Choice'
                ? (question.options.length ? question.options : ['Option 1', 'Option 2'])
                : [],
            };
          }

          return { ...question, prompt: value };
        }),
      };
    }));
  }

  function updateOption(
    sectionId: string,
    questionId: string,
    optionIndex: number,
    value: string,
  ) {
    setSections((previous) => previous.map((section) => {
      if (section.id !== sectionId) {
        return section;
      }

      return {
        ...section,
        questions: section.questions.map((question) => {
          if (question.id !== questionId) {
            return question;
          }

          const nextOptions = [...question.options];
          nextOptions[optionIndex] = value;
          return { ...question, options: nextOptions };
        }),
      };
    }));
  }

  function toggleQuestionRequired(sectionId: string, questionId: string) {
    setSections((previous) => previous.map((section) => {
      if (section.id !== sectionId) {
        return section;
      }

      return {
        ...section,
        questions: section.questions.map((question) => (
          question.id === questionId
            ? { ...question, required: !question.required }
            : question
        )),
      };
    }));
  }

  function addOption(sectionId: string, questionId: string) {
    setSections((previous) => previous.map((section) => {
      if (section.id !== sectionId) {
        return section;
      }

      return {
        ...section,
        questions: section.questions.map((question) => {
          if (question.id !== questionId) {
            return question;
          }
          return { ...question, options: [...question.options, `Option ${question.options.length + 1}`] };
        }),
      };
    }));
  }

  function removeOption(sectionId: string, questionId: string, optionIndex: number) {
    setSections((previous) => previous.map((section) => {
      if (section.id !== sectionId) {
        return section;
      }

      return {
        ...section,
        questions: section.questions.map((question) => {
          if (question.id !== questionId) {
            return question;
          }

          if (question.options.length <= 2) {
            return question;
          }

          return {
            ...question,
            options: question.options.filter((_, index) => index !== optionIndex),
          };
        }),
      };
    }));
  }

  const selectedExistingSectionOption = existingSectionOptions.find(
    (option) => option.id === selectedExistingSectionId,
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="reviews-modal-backdrop">
      <section
        className="reviews-modal"
        onClick={(event) => event.stopPropagation()}
        data-entity={templateEntity}
        data-template-id={templateId}
      >
        <div className="builder-header reviews-modal-header">
          <div>
            <h2>{modalTitle}</h2>
            <p>{modalDescription}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {metaFields.map(renderBuilderField)}

        {renderBuilderField(subjectField)}
        {afterSubjectFields.map(renderBuilderField)}

        <div className="builder-block">
          <label htmlFor={titleField.id}>{titleField.label}</label>
          <input
            id={titleField.id}
            value={titleField.value}
            onChange={(event) => titleField.onChange(event.target.value)}
            name={titleField.name}
            data-field={titleField.dataField}
            disabled={titleField.disabled}
            title={titleField.disabled ? titleField.disabledTooltip : undefined}
          />
          {titleField.helperText && <p className="builder-field-help">{titleField.helperText}</p>}
        </div>

        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`builder-section ${section.isReadOnly ? 'readonly' : ''}`}
            ref={(node) => {
              sectionRefs.current[section.id] = node;
            }}
            data-entity="section"
            data-section-id={section.id}
            data-section-order={index + 1}
            title={section.isReadOnly ? section.readOnlyReason : undefined}
          >
            <div className="section-toolbar">
              <span className="entity-order-tag">Section {index + 1}</span>
              {section.isReadOnly && (
                <span className="entity-readonly-tag" title={section.readOnlyReason}>
                  Locked
                </span>
              )}
              <button
                className="section-order-btn"
                onClick={() => moveSection(section.id, 'up')}
                disabled={index === 0}
                title="Move Up"
              >
                <ArrowUp size={14} />
              </button>
              <button
                className="section-order-btn"
                onClick={() => moveSection(section.id, 'down')}
                disabled={index === sections.length - 1}
                title="Move Down"
              >
                <ArrowDown size={14} />
              </button>
              <button
                className="section-delete-btn"
                onClick={() => removeSection(section.id)}
                disabled={sections.length <= 1 || !allowMultipleSections || section.isReadOnly}
                title={section.isReadOnly ? section.readOnlyReason : 'Remove Section'}
              >
                <Trash2 size={14} />
              </button>
            </div>

            {(section.sourceTitle || section.sourceDescription) && (
              <p className="section-source-text">
                {section.sourceTitle ? `${section.sourceTitle}: ` : ''}
                {section.sourceDescription ?? ''}
              </p>
            )}

            <div className="builder-block">
              <label>Section Label</label>
              <input
                value={section.label}
                onChange={(event) => updateSectionLabel(section.id, event.target.value)}
                disabled={section.isReadOnly}
                name={`sections[${index}].label`}
                data-field="section-label"
                data-section-id={section.id}
                data-section-order={index + 1}
                title={section.isReadOnly ? section.readOnlyReason : undefined}
              />
            </div>

            <div className="builder-questions">
              {section.questions.map((question, questionIndex) => (
                <div
                  key={question.id}
                  className="builder-question"
                  ref={(node) => {
                    questionRefs.current[`${section.id}:${question.id}`] = node;
                  }}
                  data-entity="question"
                  data-section-id={section.id}
                  data-question-id={question.id}
                  data-section-order={index + 1}
                  data-question-order={questionIndex + 1}
                >
                  <div className="question-toolbar">
                    <span className="entity-order-tag">Question {questionIndex + 1}</span>
                    <button
                      className="question-order-btn"
                      onClick={() => moveQuestion(section.id, question.id, 'up')}
                      disabled={questionIndex === 0 || section.isReadOnly}
                      title={section.isReadOnly ? section.readOnlyReason : 'Move Question Up'}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      className="question-order-btn"
                      onClick={() => moveQuestion(section.id, question.id, 'down')}
                      disabled={questionIndex === section.questions.length - 1 || section.isReadOnly}
                      title={section.isReadOnly ? section.readOnlyReason : 'Move Question Down'}
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      className="question-delete-btn"
                      onClick={() => removeQuestion(section.id, question.id)}
                      disabled={section.questions.length <= 1 || section.isReadOnly}
                      title={section.isReadOnly ? section.readOnlyReason : 'Remove Question'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="builder-question-grid">
                    <div className="builder-block">
                      <label>Question</label>
                      <input
                        value={question.prompt}
                        onChange={(event) => updateQuestion(
                          section.id,
                          question.id,
                          'prompt',
                          event.target.value,
                        )}
                        disabled={section.isReadOnly}
                        name={`sections[${index}].questions[${questionIndex}].prompt`}
                        data-field="question-prompt"
                        data-section-id={section.id}
                        data-question-id={question.id}
                        data-section-order={index + 1}
                        data-question-order={questionIndex + 1}
                        title={section.isReadOnly ? section.readOnlyReason : undefined}
                      />
                    </div>
                    <div className="builder-block">
                      <label>Question Type</label>
                      <select
                        value={question.type}
                        onChange={(event) => updateQuestion(
                          section.id,
                          question.id,
                          'type',
                          event.target.value,
                        )}
                        disabled={section.isReadOnly}
                        name={`sections[${index}].questions[${questionIndex}].type`}
                        data-field="question-type"
                        data-section-id={section.id}
                        data-question-id={question.id}
                        data-section-order={index + 1}
                        data-question-order={questionIndex + 1}
                        title={section.isReadOnly ? section.readOnlyReason : undefined}
                      >
                        {questionTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    className={`question-required-toggle ${question.required ? 'enabled' : ''}`}
                    onClick={() => toggleQuestionRequired(section.id, question.id)}
                    disabled={section.isReadOnly}
                    title={section.isReadOnly ? section.readOnlyReason : undefined}
                  >
                    {question.required ? 'Required' : 'Optional'}
                  </button>

                  {(question.type === 'Multiple Choice'
                    || question.type === 'Single Choice') && (
                    <div className="builder-options">
                      {question.options.map((option, optionIndex) => (
                        <div className="builder-option-row" key={`${question.id}-option-${optionIndex}`}>
                          <input
                            value={option}
                            onChange={(event) => updateOption(
                              section.id,
                              question.id,
                              optionIndex,
                              event.target.value,
                            )}
                            disabled={section.isReadOnly}
                            name={`sections[${index}].questions[${questionIndex}].options[${optionIndex}]`}
                            data-field="question-option"
                            data-section-id={section.id}
                            data-question-id={question.id}
                            data-section-order={index + 1}
                            data-question-order={questionIndex + 1}
                            data-option-index={optionIndex}
                            title={section.isReadOnly ? section.readOnlyReason : undefined}
                          />
                          <button
                            className="remove-option-btn"
                            onClick={() => removeOption(section.id, question.id, optionIndex)}
                            title="Remove Option"
                            aria-label="Remove Option"
                            disabled={question.options.length <= 2 || section.isReadOnly}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        className="add-option-btn"
                        onClick={() => addOption(section.id, question.id)}
                        disabled={section.isReadOnly}
                        title={section.isReadOnly ? section.readOnlyReason : undefined}
                      >
                        Add Option
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              className="add-question-btn"
              onClick={() => addQuestion(section.id)}
              disabled={section.isReadOnly}
              title={section.isReadOnly ? section.readOnlyReason : undefined}
            >
              Add Question
            </button>
          </div>
        ))}

        <div className="builder-actions">
          <div className="builder-actions-left">
            {allowMultipleSections && (
              <button className="secondary-btn" onClick={addSection}>
                Add New Section
              </button>
            )}
            {allowMultipleSections && existingSectionOptions.length > 0 && (
              <div className="builder-existing-section-actions">
                <select
                  value={selectedExistingSectionId}
                  onChange={(event) => setSelectedExistingSectionId(event.target.value)}
                  aria-label="Select existing section"
                >
                  {existingSectionOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.description ? `${option.label} - ${option.description}` : option.label}
                    </option>
                  ))}
                </select>
                <button className="secondary-btn" onClick={addExistingSection}>
                  Add Existing Section
                </button>
              </div>
            )}
            {allowMultipleSections && selectedExistingSectionOption?.description && (
              <p className="builder-field-help">{selectedExistingSectionOption.description}</p>
            )}
          </div>
          <button className="primary-btn" onClick={onSave}>
            {saveButtonLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default TemplateBuilderModal;


  function renderBuilderField(field: BuilderFieldConfig) {
    const inputType = field.type === 'date' ? 'date' : 'text';

    return (
      <div className="builder-block" key={field.id}>
        <label htmlFor={field.id}>{field.label}</label>
        {field.type === 'select' ? (
          <select
            id={field.id}
            value={field.value}
            onChange={(event) => field.onChange(event.target.value)}
            name={field.name}
            data-field={field.dataField}
            disabled={field.disabled}
            title={field.disabled ? field.disabledTooltip : undefined}
          >
            {(field.options ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.description ? `${option.label} - ${option.description}` : option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={inputType}
            id={field.id}
            value={field.value}
            onChange={(event) => field.onChange(event.target.value)}
            name={field.name}
            data-field={field.dataField}
            disabled={field.disabled}
            title={field.disabled ? field.disabledTooltip : undefined}
          />
        )}
        {field.helperText && <p className="builder-field-help">{field.helperText}</p>}
      </div>
    );
  }
