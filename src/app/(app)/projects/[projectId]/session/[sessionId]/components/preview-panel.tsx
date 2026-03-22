interface PreviewPanelProps {
  url: string;
  ready: boolean;
  error: string | null;
  reloadKey: number;
  onReload: () => void;
}

export function PreviewPanel({
  url,
  ready,
  error,
  reloadKey,
  onReload,
}: PreviewPanelProps) {
  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <span className="text-xl">!</span>
          </div>
          <p className="font-medium text-foreground">Preview unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={onReload}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!ready || !url) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">
            Starting your preview...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-1 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="text-xs text-muted-foreground">Live Preview</span>
        </div>
        <button
          onClick={onReload}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Reload preview"
        >
          <ReloadIcon />
        </button>
      </div>

      {/* iframe */}
      <div className="flex-1 overflow-hidden rounded-xl border border-border shadow-sm">
        <iframe
          key={reloadKey}
          src={url}
          className="h-full w-full border-0"
          title="Application preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}

function ReloadIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}
