import { useEffect, useState } from 'react';
import { Star, X } from 'lucide-react';
import './FormResponseModal.css';

export type ResponseQuestionType =
  | 'Long Answer'
  | 'Single Choice'
  | 'Multiple Choice'
  | '5-Star Rating';

export type ResponseQuestion = {
  questionId: number;
  sectionId: number;
  prompt: string;
  type: ResponseQuestionType;
  options: string[];
  required: boolean;
};

export type ResponseSection = {
  sectionId: number;
  label: string;
  questions: ResponseQuestion[];
};

export type AnswerValue = {
  questionId: number;
  sectionId: number;
  answerText: string;
  rating: number | null;
  selectedOptions: string[];
};

export type FormResponseData = {
  answers: AnswerValue[];
  status: 'Draft' | 'Submitted';
};

type MetaItem = {
  label: string;
  value: string;
};

type FormResponseModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  meta?: MetaItem[];
  sections: ResponseSection[];
  existingAnswers?: AnswerValue[];
  readOnly?: boolean;
  saving?: boolean;
  onSaveDraft?: (data: FormResponseData) => void;
  onSubmit?: (data: FormResponseData) => void;
  onClose: () => void;
};

function buildAnswerKey(sectionId: number, questionId: number): string {
  return `${sectionId}:${questionId}`;
}

function FormResponseModal({
  isOpen,
  title,
  description,
  meta = [],
  sections,
  existingAnswers = [],
  readOnly = false,
  saving = false,
  onSaveDraft,
  onSubmit,
  onClose,
}: FormResponseModalProps) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    const initial: Record<string, AnswerValue> = {};
    for (const section of sections) {
      for (const question of section.questions) {
        const key = buildAnswerKey(question.sectionId, question.questionId);
        const existing = existingAnswers.find(
          (a) => a.questionId === question.questionId && a.sectionId === question.sectionId,
        );
        initial[key] = existing ?? {
          questionId: question.questionId,
          sectionId: question.sectionId,
          answerText: '',
          rating: null,
          selectedOptions: [],
        };
      }
    }
    setAnswers(initial);
    setValidationErrors({});
  }, [isOpen, sections, existingAnswers]);

  function updateAnswer(sectionId: number, questionId: number, patch: Partial<AnswerValue>) {
    const key = buildAnswerKey(sectionId, questionId);
    setAnswers((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function collectAnswers(): AnswerValue[] {
    return Object.values(answers);
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    for (const section of sections) {
      for (const question of section.questions) {
        if (!question.required) continue;
        const key = buildAnswerKey(question.sectionId, question.questionId);
        const answer = answers[key];
        if (!answer) {
          errors[key] = 'This question is required.';
          continue;
        }
        if (question.type === 'Long Answer' && !answer.answerText.trim()) {
          errors[key] = 'This question is required.';
        } else if (question.type === 'Single Choice' && !answer.answerText) {
          errors[key] = 'Please select an option.';
        } else if (question.type === 'Multiple Choice' && answer.selectedOptions.length === 0) {
          errors[key] = 'Please select at least one option.';
        } else if (question.type === '5-Star Rating' && (answer.rating === null || answer.rating === 0)) {
          errors[key] = 'Please provide a rating.';
        }
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSaveDraft() {
    onSaveDraft?.({ answers: collectAnswers(), status: 'Draft' });
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit?.({ answers: collectAnswers(), status: 'Submitted' });
  }

  if (!isOpen) return null;

  return (
    <div className="form-response-backdrop">
      <section className="form-response-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-response-header">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {meta.length > 0 && (
          <div className="form-response-meta">
            {meta.map((item) => (
              <div className="form-response-meta-item" key={item.label}>
                <span className="meta-label">{item.label}</span>
                <span className="meta-value">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {sections.map((section) => (
          <div className="form-response-section" key={section.sectionId}>
            <div className="form-response-section-header">
              <h3>{section.label}</h3>
            </div>
            <div className="form-response-questions">
              {section.questions.map((question) => {
                const key = buildAnswerKey(question.sectionId, question.questionId);
                const answer = answers[key];
                const error = validationErrors[key];
                return (
                  <div className="form-response-question" key={key}>
                    <div className="form-response-question-prompt">
                      <span>{question.prompt}</span>
                      {question.required && <span className="required-marker">*</span>}
                    </div>
                    {renderAnswerInput(question, answer, readOnly, (patch) =>
                      updateAnswer(question.sectionId, question.questionId, patch),
                    )}
                    {error && <p className="form-response-validation-error">{error}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {!readOnly && (
          <div className="form-response-actions">
            {onSaveDraft && (
              <button
                className="form-response-btn secondary"
                onClick={handleSaveDraft}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
            )}
            {onSubmit && (
              <button
                className="form-response-btn primary"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function renderAnswerInput(
  question: ResponseQuestion,
  answer: AnswerValue | undefined,
  readOnly: boolean,
  onChange: (patch: Partial<AnswerValue>) => void,
) {
  switch (question.type) {
    case 'Long Answer':
      return (
        <textarea
          className="form-response-textarea"
          value={answer?.answerText ?? ''}
          onChange={(e) => onChange({ answerText: e.target.value })}
          disabled={readOnly}
          placeholder="Type your answer here..."
          rows={3}
        />
      );
    case 'Single Choice':
      return (
        <div className="form-response-radio-group">
          {question.options.map((option) => (
            <label
              key={option}
              className={`form-response-radio-option ${answer?.answerText === option ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name={`q-${question.sectionId}-${question.questionId}`}
                checked={answer?.answerText === option}
                onChange={() => onChange({ answerText: option })}
                disabled={readOnly}
              />
              {option}
            </label>
          ))}
        </div>
      );
    case 'Multiple Choice':
      return (
        <div className="form-response-checkbox-group">
          {question.options.map((option) => {
            const isChecked = answer?.selectedOptions.includes(option) ?? false;
            return (
              <label
                key={option}
                className={`form-response-checkbox-option ${isChecked ? 'selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const current = answer?.selectedOptions ?? [];
                    const next = isChecked
                      ? current.filter((o) => o !== option)
                      : [...current, option];
                    onChange({ selectedOptions: next });
                  }}
                  disabled={readOnly}
                />
                {option}
              </label>
            );
          })}
        </div>
      );
    case '5-Star Rating':
      return (
        <div className="form-response-star-group">
          {[1, 2, 3, 4, 5].map((starValue) => (
            <button
              key={starValue}
              type="button"
              className={`form-response-star ${(answer?.rating ?? 0) >= starValue ? 'filled' : 'empty'}`}
              onClick={() => onChange({ rating: starValue })}
              disabled={readOnly}
            >
              <Star size={24} />
            </button>
          ))}
        </div>
      );
    default:
      return null;
  }
}

export default FormResponseModal;
