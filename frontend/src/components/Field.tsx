import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  hint?: string;
  /** true — для группы кнопок (вместо <label> рисуется <div role="group">). */
  group?: boolean;
  children: ReactNode;
}

export default function Field({ label, hint, group = false, children }: FieldProps) {
  const content = (
    <>
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </>
  );

  return group ? (
    <div className="field" role="group" aria-label={label}>
      {content}
    </div>
  ) : (
    <label className="field">{content}</label>
  );
}
