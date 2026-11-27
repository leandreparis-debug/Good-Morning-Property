/**
 * Creates the FIRST animateur in a database that has none, and prints their personal link.
 *
 *   pnpm bootstrap:facilitator -- --name "Prénom Nom" [--initials PN] [--color sun] [--email x@y.z]
 *
 * Reads NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and
 * SUPABASE_SERVICE_ROLE_KEY from the environment (.env.local if present). Refuses to run when an
 * active animateur already exists. The link is printed once and stored nowhere.
 */
import { parseArgs } from "node:util";
import { getInitials } from "@/lib/initials";
import { memberColorSchema } from "@/lib/memberColors";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { bootstrapFacilitator } from "@/server/team/teamService";

async function main(): Promise<void> {
  const { values } = parseArgs({
    // pnpm forwards the `--` of `pnpm <script> -- --flag`: drop it, or every flag is a positional.
    args: process.argv.slice(2).filter((arg, index) => !(index === 0 && arg === "--")),
    options: {
      name: { type: "string" },
      initials: { type: "string" },
      color: { type: "string" },
      email: { type: "string" },
    },
    allowPositionals: true,
  });

  if (!values.name?.trim()) {
    throw new Error('Nom manquant : pnpm bootstrap:facilitator -- --name "Prénom Nom"');
  }

  const { member, link } = await bootstrapFacilitator(createSupabaseAdminClient(), {
    displayName: values.name,
    initials: values.initials ?? getInitials(values.name),
    avatarColor: memberColorSchema.parse(values.color ?? "sun"),
    email: values.email,
  });

  process.stdout.write(
    `\nAnimateur créé : ${member.displayName} (${member.initials})\n\n` +
      `Lien personnel (affiché une seule fois, ne le partage qu'avec cette personne) :\n\n  ${link}\n\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`\nÉchec : ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
