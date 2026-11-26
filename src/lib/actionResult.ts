/** What a Server Action returns to the UI: data, or a French error message to display. */
export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };
