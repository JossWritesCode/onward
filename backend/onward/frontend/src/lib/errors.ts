export type UserError = {
  field?: string | null;
  message: string;
};

/** The message for one form field, if the server flagged it. */
export function fieldError(errors: readonly UserError[], field: string): string | undefined {
  return errors.find((error) => error.field === field)?.message;
}

/** Messages that don't belong to any of the given fields, shown at the top of a form. */
export function generalErrors(errors: readonly UserError[], fields: readonly string[]): string[] {
  return errors.filter((error) => !error.field || !fields.includes(error.field)).map((error) => error.message);
}
