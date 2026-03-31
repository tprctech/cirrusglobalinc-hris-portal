import { useSyncExternalStore } from 'react';
import { surveysMockData } from './mock/menuMockData';
import type { BuilderQuestionType, BuilderSection } from '../components/TemplateBuilderModal';

export type SurveyTemplateRecord = {
  id: string;
  title: string;
  description: string;
  sections: BuilderSection[];
};

export type SurveyQuestionSetRecord = {
  id: string;
  title: string;
  description: string;
  section: BuilderSection;
};

type SurveyCatalogSnapshot = {
  templates: SurveyTemplateRecord[];
  questionSets: SurveyQuestionSetRecord[];
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

const defaultSections = surveysMockData.surveyTemplate.sections.map((section) => cloneSection({
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

let templates: SurveyTemplateRecord[] = [
  {
    id: 'survey-template-1',
    title: 'Employee Engagement Pulse',
    description: 'Short pulse survey for monthly engagement.',
    sections: cloneSections(defaultSections),
  },
  {
    id: 'survey-template-2',
    title: 'Onboarding Feedback',
    description: 'Template for collecting new hire onboarding feedback.',
    sections: cloneSections(defaultSections.slice(0, 1)),
  },
];

let questionSets: SurveyQuestionSetRecord[] = [
  {
    id: 'survey-question-set-1',
    title: 'Engagement Core Questions',
    description: 'Reusable section for engagement check-ins.',
    section: cloneSection(defaultSections[0]),
  },
  {
    id: 'survey-question-set-2',
    title: 'Workplace Satisfaction Set',
    description: 'Reusable section for workplace satisfaction.',
    section: cloneSection(defaultSections[1] ?? defaultSections[0]),
  },
];

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function buildSnapshot(): SurveyCatalogSnapshot {
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

let snapshot: SurveyCatalogSnapshot = buildSnapshot();

function emitChange() {
  snapshot = buildSnapshot();
  for (const listener of listeners) {
    listener();
  }
}

function getSnapshot() {
  return snapshot;
}

export function addSurveyTemplate(input: Omit<SurveyTemplateRecord, 'id'>) {
  templates = [
    {
      id: nextId('survey-template'),
      title: input.title,
      description: input.description,
      sections: cloneSections(input.sections),
    },
    ...templates,
  ];
  emitChange();
}

export function updateSurveyTemplate(templateId: string, input: Omit<SurveyTemplateRecord, 'id'>) {
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

export function deleteSurveyTemplate(templateId: string) {
  templates = templates.filter((template) => template.id !== templateId);
  emitChange();
}

export function addSurveyQuestionSet(input: Omit<SurveyQuestionSetRecord, 'id'>) {
  questionSets = [
    {
      id: nextId('survey-question-set'),
      title: input.title,
      description: input.description,
      section: cloneSection(input.section),
    },
    ...questionSets,
  ];
  emitChange();
}

export function updateSurveyQuestionSet(questionSetId: string, input: Omit<SurveyQuestionSetRecord, 'id'>) {
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

export function deleteSurveyQuestionSet(questionSetId: string) {
  questionSets = questionSets.filter((questionSet) => questionSet.id !== questionSetId);
  emitChange();
}

export function useSurveyCatalog() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
