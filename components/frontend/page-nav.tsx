import Link from "next/link";

type PageNavProps = {
  active: "dashboard" | "fixtures";
};

export function PageNav({ active }: PageNavProps) {
  return (
    <nav className="flex gap-1 border-b border-border px-6">
      <Link
        href="/dashboard"
        className={`px-3 py-2.5 text-sm transition-colors ${
          active === "dashboard"
            ? "font-medium border-b-2 border-primary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Puan Tablosu
      </Link>
      <Link
        href="/fixtures"
        className={`px-3 py-2.5 text-sm transition-colors ${
          active === "fixtures"
            ? "font-medium border-b-2 border-primary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Fikstür
      </Link>
    </nav>
  );
}
