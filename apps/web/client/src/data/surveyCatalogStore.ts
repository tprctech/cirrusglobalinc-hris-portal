import { useCallback, useEffect, useState } from 'react';
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

type ApiQuestion = {
  id: number;
  prompt: string;
  question_type: string;
  options: string;
  required: boolean;
  sort_order: number;
};

type ApiSection = {
  id: number;
  label: string;
  sort_order: number;
  questions: ApiQuestion[];
};

type ApiTemplate = {
  id: number;
  title: string;
  description: string;
  sections: ApiSection[];
};

type ApiQuestionSet = {
  id: number;
  title: string;
  description: string;
  sections: ApiSection[];
};

const BASE = '/api/v1/hr/surveys';

function apiSectionToBuilder(s: ApiSection): BuilderSection {
  return {
    id: `section-${s.id}`,
    label: s.label,
    questions: s.questions
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((q) => ({
        id: `question-${q.id}`,
        prompt: q.prompt,
        type: q.question_type as BuilderQuestionType,
        options: q.options ? q.options.split('\n').filter(Boolean) : [],
        required: q.required,
      })),
  };
}

function builderSectionToApi(s: BuilderSection, idx: number) {
  return {
    label: s.label,
    sort_order: idx,
    questions: s.questions.map((q, qi) => ({
      prompt: q.prompt,
      question_type: q.type,
      options: q.options.join('\n'),
      required: q.required ?? false,
      sort_order: qi,
    })),
  };
}

function apiTemplateToRecord(t: ApiTemplate): SurveyTemplateRecord {
  return {
    id: String(t.id),
    title: t.title,
    description: t.description || '',
    sections: t.sections
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(apiSectionToBuilder),
  };
}

function apiQsToRecord(qs: ApiQuestionSet): SurveyQuestionSetRecord {
  const sorted = qs.sections.sort((a, b) => a.sort_order - b.sort_order);
  return {
    id: String(qs.id),
    title: qs.title,
    description: qs.description || '',
    section: sorted.length > 0 ? apiSectionToBuilder(sorted[0]) : {
      id: 'section-new',
      label: 'New Section',
      questions: [],
    },
  };
}

export async function fetchSurveyTemplates(): Promise<SurveyTemplateRecord[]> {
  const res = await fetch(`${BASE}/templates`);
  if (!res.ok) throw new Error('Failed to fetch survey templates');
  const data: ApiTemplate[] = await res.json();
  return data.map(apiTemplateToRecord);
}

export async function fetchSurveyQuestionSets(): Promise<SurveyQuestionSetRecord[]> {
  const res = await fetch(`${BASE}/question-sets`);
  if (!res.ok) throw new Error('Failed to fetch survey question sets');
  const data: ApiQuestionSet[] = await res.json();
  return data.map(apiQsToRecord);
}

export async function addSurveyTemplate(input: Omit<SurveyTemplateRecord, 'id'>): Promise<SurveyTemplateRecord> {
  const res = await fetch(`${BASE}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      sections: input.sections.map(builderSectionToApi),
    }),
  });
  if (!res.ok) throw new Error('Failed to create survey template');
  return apiTemplateToRecord(await res.json());
}

export async function updateSurveyTemplate(templateId: string, input: Omit<SurveyTemplateRecord, 'id'>): Promise<SurveyTemplateRecord> {
  const res = await fetch(`${BASE}/templates/${templateId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      sections: input.sections.map(builderSectionToApi),
    }),
  });
  if (!res.ok) throw new Error('Failed to update survey template');
  return apiTemplateToRecord(await res.json());
}

export async function deleteSurveyTemplate(templateId: string): Promise<void> {
  const res = await fetch(`${BASE}/templates/${templateId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete survey template');
}

export async function addSurveyQuestionSet(input: Omit<SurveyQuestionSetRecord, 'id'>): Promise<SurveyQuestionSetRecord> {
  const res = await fetch(`${BASE}/question-sets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      sections: [builderSectionToApi(input.section, 0)],
    }),
  });
  if (!res.ok) throw new Error('Failed to create survey question set');
  return apiQsToRecord(await res.json());
}

export async function updateSurveyQuestionSet(qsId: string, input: Omit<SurveyQuestionSetRecord, 'id'>): Promise<SurveyQuestionSetRecord> {
  const res = await fetch(`${BASE}/question-sets/${qsId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      sections: [builderSectionToApi(input.section, 0)],
    }),
  });
  if (!res.ok) throw new Error('Failed to update survey question set');
  return apiQsToRecord(await res.json());
}

export async function deleteSurveyQuestionSet(qsId: string): Promise<void> {
  const res = await fetch(`${BASE}/question-sets/${qsId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete survey question set');
}

export function useSurveyCatalog() {
  const [templates, setTemplates] = useState<SurveyTemplateRecord[]>([]);
  const [questionSets, setQuestionSets] = useState<SurveyQuestionSetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const [tpls, qsets] = await Promise.all([
        fetchSurveyTemplates(),
        fetchSurveyQuestionSets(),
      ]);
      setTemplates(tpls);
      setQuestionSets(qsets);
    } catch {
      setTemplates([]);
      setQuestionSets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { templates, questionSets, loading, reload };
}
