"use client";

type ViewMode = "day" | "all";

type FixtureToolbarProps = {
  viewMode: ViewMode;
  myMatchesOnly: boolean;
  onViewChange: (mode: ViewMode) => void;
  onMyMatchesToggle: () => void;
};

export function FixtureToolbar({ viewMode, myMatchesOnly, onViewChange, onMyMatchesToggle }: FixtureToolbarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border gap-3">
      <div className="flex rounded-md border border-border overflow-hidden text-xs font-medium shrink-0">
        <button
          onClick={() => onViewChange("day")}
          className={`px-3 py-1.5 transition-colors cursor-pointer ${viewMode === "day" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Günlük
        </button>
        <button
          onClick={() => onViewChange("all")}
          className={`px-3 py-1.5 border-l border-border transition-colors cursor-pointer ${viewMode === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Tümü
        </button>
      </div>

      <button
        onClick={onMyMatchesToggle}
        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors cursor-pointer ${myMatchesOnly ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
      >
        Maçlarım
      </button>
    </div>
  );
}
