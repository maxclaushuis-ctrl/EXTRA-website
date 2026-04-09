import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";

interface FormPersistenceOptions {
  draftKey: string;
  form: UseFormReturn<any>;
  currentSection: number;
  setCurrentSection: (section: number) => void;
  isSubmitted: boolean;
  maxSection: number;
}

interface FormPersistenceResult {
  wasRestored: boolean;
  clearDraft: () => void;
}

export function useFormPersistence({
  draftKey,
  form,
  currentSection,
  setCurrentSection,
  isSubmitted,
  maxSection,
}: FormPersistenceOptions): FormPersistenceResult {
  const [wasRestored, setWasRestored] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const { section, data } = JSON.parse(saved);
        form.reset({ ...data });
        const clampedSection = typeof section === "number"
          ? Math.max(0, Math.min(section, maxSection))
          : 0;
        setCurrentSection(clampedSection);
        setWasRestored(true);
      }
    } catch {}
  }, []);

  const allValues = form.watch();
  useEffect(() => {
    if (isSubmitted) return;
    try {
      const data = form.getValues();
      localStorage.setItem(draftKey, JSON.stringify({ section: currentSection, data }));
    } catch {}
  }, [allValues, currentSection, isSubmitted]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {}
    setWasRestored(false);
  };

  return { wasRestored, clearDraft };
}
