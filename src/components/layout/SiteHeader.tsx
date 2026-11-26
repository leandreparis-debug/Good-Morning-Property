import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ROUTES } from "@/lib/routes";
import { MainNav } from "./MainNav";

/** App header: logo on the left, main navigation on the right (bottom bar on mobile). */
export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-6">
      <Link href={ROUTES.home} className="inline-flex min-h-11 items-center rounded-2xl text-ink">
        <Logo withWordmark />
      </Link>
      <MainNav />
    </header>
  );
}
