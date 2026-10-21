import { useState, type FormEvent } from "react";

export type ProjectFormValues = { name: string; description: string };

type Props = {
  initialValues?: ProjectFormValues;
  submitLabel: string;
  onSubmit: (values: ProjectFormValues) => Promise<string | null>;
};

// Name + description form, shared by the create page and the edit mode on the project page.
export function ProjectForm({
  initialValues = { name: "", description: "" },
  submitLabel,
  onSubmit,
}: Props) {
  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(initialValues.description);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim() === "") {
      setError("Name is required.");
      return;
    }

    setSubmitting(true);
    try {
      setError(await onSubmit({ name, description }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name
        <input
          type="text"
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        Description (optional)
        <textarea
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
