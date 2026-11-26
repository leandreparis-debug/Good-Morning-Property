import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { ActionResult } from "@/lib/actionResult";
import { toDomainError } from "./errors";

/**
 * Runs a Server Action body and turns failures into `{ ok: false, error }` with the French
 * business message. Next.js redirects (e.g. from `requireFacilitator`) are re-thrown.
 */
export async function runAction<T>(body: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await body() };
  } catch (error) {
    unstable_rethrow(error);
    const domainError = toDomainError(error);
    if (domainError.code === "UNKNOWN") {
      console.error("[action]", domainError.cause);
    }
    return { ok: false, error: domainError.message };
  }
}
