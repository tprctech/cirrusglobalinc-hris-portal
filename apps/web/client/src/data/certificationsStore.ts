export type CertificationRecord = {
  id: string;
  employeeName: string;
  trainingTitle: string;
  competencyArea: string;
  issuedOn: string;
  credentialId: string;
};

const CERTIFICATIONS_STORAGE_KEY = 'teamflect-certifications';
const CERTIFICATIONS_UPDATED_EVENT = 'teamflect:certifications-updated';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getStoredCertifications(): CertificationRecord[] {
  if (!canUseStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(CERTIFICATIONS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CertificationRecord[]) : [];
  } catch {
    return [];
  }
}

export function hasCertification(employeeName: string, trainingTitle: string): boolean {
  return getStoredCertifications().some((item) => (
    item.employeeName === employeeName && item.trainingTitle === trainingTitle
  ));
}

export function addCertification(input: Omit<CertificationRecord, 'id' | 'credentialId' | 'issuedOn'>): CertificationRecord {
  const existing = getStoredCertifications();
  const alreadyExists = existing.find((item) => (
    item.employeeName === input.employeeName && item.trainingTitle === input.trainingTitle
  ));

  if (alreadyExists) {
    return alreadyExists;
  }

  const today = new Date().toISOString().slice(0, 10);
  const record: CertificationRecord = {
    id: `cert-${Date.now()}`,
    employeeName: input.employeeName,
    trainingTitle: input.trainingTitle,
    competencyArea: input.competencyArea,
    issuedOn: today,
    credentialId: `TF-${today.replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  };

  if (canUseStorage()) {
    window.localStorage.setItem(CERTIFICATIONS_STORAGE_KEY, JSON.stringify([record, ...existing]));
    window.dispatchEvent(new CustomEvent(CERTIFICATIONS_UPDATED_EVENT));
  }

  return record;
}

export function subscribeToCertificationUpdates(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const storageListener = (event: StorageEvent) => {
    if (event.key === CERTIFICATIONS_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener('storage', storageListener);
  window.addEventListener(CERTIFICATIONS_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener('storage', storageListener);
    window.removeEventListener(CERTIFICATIONS_UPDATED_EVENT, callback);
  };
}
