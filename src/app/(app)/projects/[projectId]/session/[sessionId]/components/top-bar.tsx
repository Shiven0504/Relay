import { Button } from "@/components/ui/button";

interface TopBarProps {
  projectName: string;
  elapsedFormatted: string;
  onCreatePR: () => void;
  onDiscard: () => void;
  isCommitting: boolean;
}

export function TopBar({
  projectName,
  elapsedFormatted,
  onCreatePR,
  onDiscard,
  isCommitting,
}: TopBarProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-3 py-2 md:px-5 md:py-3">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold md:flex">
          R
        </div>
        <div>
          <h1 className="text-xs font-semibold md:text-sm">{projectName}</h1>
          <p className="text-[10px] text-muted-foreground font-mono md:text-xs">
            {elapsedFormatted}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDiscard}
          disabled={isCommitting}
          className="h-7 px-2 text-xs md:h-8 md:px-3 md:text-sm"
        >
          Discard
        </Button>
        <Button
          size="sm"
          onClick={onCreatePR}
          disabled={isCommitting}
          className="h-7 px-2 text-xs md:h-8 md:px-3 md:text-sm"
        >
          {isCommitting ? "Creating..." : "Create PR"}
        </Button>
      </div>
    </header>
  );
}
