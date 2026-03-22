interface SessionLayoutProps {
  topBar: React.ReactNode;
  chatPanel: React.ReactNode;
  previewPanel: React.ReactNode;
}

export function SessionLayout({
  topBar,
  chatPanel,
  previewPanel,
}: SessionLayoutProps) {
  return (
    <div className="flex h-screen flex-col">
      {topBar}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex h-1/2 min-h-0 flex-col border-b border-border bg-card md:h-auto md:w-[420px] md:min-w-[360px] md:border-b-0 md:border-r">
          {chatPanel}
        </div>
        <div className="flex-1 bg-muted/30 p-2 md:p-4">{previewPanel}</div>
      </div>
    </div>
  );
}
