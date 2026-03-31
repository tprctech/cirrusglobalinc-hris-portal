import { useSyncExternalStore } from 'react';
import { reviewsMockData } from './mock/menuMockData';
import type { BuilderQuestionType, BuilderSection } from '../components/TemplateBuilderModal';

export type ReviewTemplateRecord = {
  id: string;
  title: string;
  description: string;
  sections: BuilderSection[];
};

export type ReviewQuestionSetRecord = {
  id: string;
  title: string;
  description: string;
  section: BuilderSection;
};

type ReviewCatalogSnapshot = {
  templates: ReviewTemplateRecord[];
  questionSets: ReviewQuestionSetRecord[];
};

let idCounter = 1;

function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function cloneSection(section: BuilderSection): BuilderSection {
  return {
    id: section.id,
    label: section.label,
    isReadOnly: section.isReadOnly ?? false,
    readOnlyReason: section.readOnlyReason,
    sourceTitle: section.sourceTitle,
    sourceDescription: section.sourceDescription,
    questions: section.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      type: question.type as BuilderQuestionType,
      options: [...question.options],
      required: question.required ?? false,
    })),
  };
}

function cloneSections(sections: BuilderSection[]): BuilderSection[] {
  return sections.map(cloneSection);
}

const defaultSections = reviewsMockData.evaluationTemplate.sections.map((section) => cloneSection({
  id: section.id,
  label: section.label,
  questions: section.questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    type: question.type as BuilderQuestionType,
    options: [...question.options],
    required: false,
  })),
}));

let templates: ReviewTemplateRecord[] = [
  {
    id: 'review-template-1',
    title: 'Quarterly Performance',
    description: 'Quarterly employee performance review.',
    sections: cloneSections(defaultSections),
  },
  {
    id: 'review-template-2',
    title: 'Probation Review',
    description: 'First 90-day probation assessment template.',
    sections: cloneSections(defaultSections.slice(0, 1)),
  },
];

let questionSets: ReviewQuestionSetRecord[] = [
  {
    id: 'review-question-set-1',
    title: 'Manager Evaluation',
    description: 'Question set for manager-to-employee reviews.',
    section: cloneSection(defaultSections[0]),
  },
  {
    id: 'review-question-set-2',
    title: 'Peer Feedback Set',
    description: 'Question set for peer feedback cycles.',
    section: cloneSection(defaultSections[1] ?? defaultSections[0]),
  },
];

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function buildSnapshot(): ReviewCatalogSnapshot {
  return {
    templates: templates.map((template) => ({
      ...template,
      sections: cloneSections(template.sections),
    })),
    questionSets: questionSets.map((questionSet) => ({
      ...questionSet,
      section: cloneSection(questionSet.section),
    })),
  };
}

let snapshot: ReviewCatalogSnapshot = buildSnapshot();

function emitChange() {
  snapshot = buildSnapshot();
  for (const listener of listeners) {
    listener();
  }
}

function getSnapshot() {
  return snapshot;
}

export function addReviewTemplate(input: Omit<ReviewTemplateRecord, 'id'>) {
  templates = [
    {
      id: nextId('review-template'),
      title: input.title,
      description: input.description,
      sections: cloneSections(input.sections),
    },
    ...templates,
  ];
  emitChange();
}

export function updateReviewTemplate(templateId: string, input: Omit<ReviewTemplateRecord, 'id'>) {
  templates = templates.map((template) => (
    template.id === templateId
      ? {
        id: template.id,
        title: input.title,
        description: input.description,
        sections: cloneSections(input.sections),
      }
      : template
  ));
  emitChange();
}

export function deleteReviewTemplate(templateId: string) {
  templates = templates.filter((template) => template.id !== templateId);
  emitChange();
}

export function addReviewQuestionSet(input: Omit<ReviewQuestionSetRecord, 'id'>) {
  questionSets = [
    {
      id: nextId('review-question-set'),
      title: input.title,
      description: input.description,
      section: cloneSection(input.section),
    },
    ...questionSets,
  ];
  emitChange();
}

export function updateReviewQuestionSet(questionSetId: string, input: Omit<ReviewQuestionSetRecord, 'id'>) {
  questionSets = questionSets.map((questionSet) => (
    questionSet.id === questionSetId
      ? {
        id: questionSet.id,
        title: input.title,
        description: input.description,
        section: cloneSection(input.section),
      }
      : questionSet
  ));
  emitChange();
}

export function deleteReviewQuestionSet(questionSetId: string) {
  questionSets = questionSets.filter((questionSet) => questionSet.id !== questionSetId);
  emitChange();
}

export function useReviewCatalog() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
