/**
 * LOCAL ONLY — prints a fresh personal link for a seed member, to sign in during development:
 *
 *   pnpm local:link -- --email membre1@example.test
 *
 * Refuses to run unless NEXT_PUBLIC_SUPABASE_URL points to the local stack.
 */
import { parseArgs } from "node:util";
import { issueAccessLink } from "@/server/auth/accessLinks";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

async function main(): Promise<void> {
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://invalid");
  if (!["127.0.0.1", "localhost"].includes(url.hostname)) {
    throw new Error("Ce script ne fonctionne qu'avec la pile Supabase locale.");
  }

  const { values } = parseArgs({
    // pnpm forwards the `--` of `pnpm <script> -- --flag`: drop it, or every flag is a positional.
    args: process.argv.slice(2).filter((arg, index) => !(index === 0 && arg === "--")),
    options: { email: { type: "string" } },
    allowPositionals: true,
  });
  const email = values.email ?? "membre1@example.test";

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("members").select("id").eq("email", email).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Aucun membre ${email}.`);

  const link = await issueAccessLink(admin, data.id);
  process.stdout.write(`\n${email} :\n  ${link}\n\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`\nÉchec : ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
