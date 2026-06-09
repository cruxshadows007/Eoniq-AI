import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, FileType, FileCode2, RefreshCw, Database, Inbox } from "lucide-react";
import {
  getDefaultKnowledgeSource,
  type KnowledgeManifest,
  type KnowledgeDocument,
  type KnowledgeFormat,
} from "@/lib/knowledge-source";

// Internal-only admin route. NOT linked from any user-facing navigation.
// Reach it manually at /admin/knowledge.
// `noindex` prevents search engines from listing it.

export const Route = createFileRoute("/admin/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge Admin — GridAtlas" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Internal document index for the GridAtlas RAG knowledge base." },
    ],
  }),
  component: KnowledgeAdminPage,
});

function KnowledgeAdminPage() {
  const [manifest, setManifest] = useState<KnowledgeManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const m = await getDefaultKnowledgeSource().list();
      setManifest(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const docs = manifest?.documents ?? [];
  const totalBytes = docs.reduce((s, d) => s + d.sizeBytes, 0);
  const byFormat = docs.reduce<Record<string, number>>((acc, d) => {
    acc[d.format] = (acc[d.format] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.3em] text-primary mb-2">
              Internal · Admin
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              Read-only index of source documents that will feed the GridAtlas energy RAG
              assistant. PDF, Markdown and plain-text are supported. No LLM is wired yet —
              this view is purely for verifying which files are present.
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--panel-border)] bg-white/[0.03] hover:bg-white/[0.06] text-[12px] mono uppercase tracking-wider disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </header>

        {/* Telemetry */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Stat icon={Inbox} label="Documents" value={String(docs.length)} />
          <Stat icon={Database} label="Total Size" value={fmtBytes(totalBytes)} />
          <Stat icon={FileType} label="PDF" value={String(byFormat.pdf ?? 0)} />
          <Stat icon={FileCode2} label="Markdown / Text" value={String((byFormat.md ?? 0) + (byFormat.txt ?? 0))} />
        </section>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-md border border-red-500/30 bg-red-500/10 text-[12px] text-red-300 mono">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-[var(--panel-border)] overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-4 py-2 mono text-[10px] uppercase tracking-wider text-muted-foreground border-b border-[var(--panel-border)] bg-white/[0.02]">
            <span className="w-5" />
            <span>Name</span>
            <span>Format</span>
            <span className="text-right">Size</span>
            <span className="text-right w-28">Status</span>
          </div>
          {docs.length === 0 && !loading && (
            <div className="px-4 py-10 text-center text-[12px] text-muted-foreground">
              No documents registered. Drop files into <code className="mono">/public/knowledge/</code> and add them to <code className="mono">manifest.json</code>.
            </div>
          )}
          <ul>
            {docs.map((d) => (
              <DocRow key={d.id} doc={d} />
            ))}
          </ul>
        </div>

        <footer className="mt-8 text-[11px] text-muted-foreground leading-relaxed">
          Source: <code className="mono">/public/knowledge/manifest.json</code>.
          Files live in <code className="mono">/public/knowledge/</code> and are served at
          <code className="mono"> /knowledge/&lt;filename&gt;</code>. Swap the data source by
          calling <code className="mono">setDefaultKnowledgeSource()</code> with an API-backed
          implementation once the indexer is online.
        </footer>
      </div>
    </div>
  );
}

function DocRow({ doc }: { doc: KnowledgeDocument }) {
  const Icon = doc.format === "pdf" ? FileType : doc.format === "md" ? FileCode2 : FileText;
  return (
    <li className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center px-4 py-2.5 border-b border-[var(--panel-border)] last:border-b-0 hover:bg-white/[0.02]">
      <Icon className="size-4 text-primary/80" />
      <a
        href={doc.path}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[13px] truncate hover:text-primary"
      >
        {doc.name}
      </a>
      <span className="mono text-[10px] uppercase text-muted-foreground">{doc.format}</span>
      <span className="mono text-[11px] tabular-nums text-right">{fmtBytes(doc.sizeBytes)}</span>
      <span className="text-right w-28"><StatusPill status={doc.status} /></span>
    </li>
  );
}

function StatusPill({ status }: { status: KnowledgeDocument["status"] }) {
  const color =
    status === "indexed" ? "#58D68D" :
    status === "pending" ? "#FFC857" :
    status === "failed" ? "#FF6B6B" : "#8EC5FF";
  return (
    <span className="inline-flex items-center gap-1.5 mono text-[10px] uppercase">
      <span className="size-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      <span style={{ color }}>{status}</span>
    </span>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--panel-border)] bg-white/[0.02] px-3 py-2.5">
      <div className="flex items-center gap-1.5 mono text-[9px] uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="mt-1 text-[18px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function _formats(_t: KnowledgeFormat) { return _t; }
