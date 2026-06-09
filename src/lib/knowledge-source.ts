// GridAtlas knowledge-base source layer.
//
// This is the read-side abstraction for the RAG document store. The default
// implementation reads a static manifest from `/public/knowledge/manifest.json`;
// later it can be swapped for an API-backed indexer without touching the UI.

export type KnowledgeFormat = "pdf" | "md" | "txt";
export type IngestionStatus = "pending" | "indexed" | "failed" | "reference";

export interface KnowledgeDocument {
  id: string;
  name: string;
  path: string;             // public URL, e.g. "/knowledge/grid-2030.pdf"
  format: KnowledgeFormat;
  sizeBytes: number;
  modifiedAt: string;       // ISO
  status: IngestionStatus;
  tags?: string[];
  chunkCount?: number;      // populated once indexed
}

export interface KnowledgeManifest {
  version: number;
  generatedAt: string;
  documents: KnowledgeDocument[];
}

export interface KnowledgeSource {
  list(): Promise<KnowledgeManifest>;
}

export class StaticManifestSource implements KnowledgeSource {
  constructor(private url = "/knowledge/manifest.json") {}
  async list(): Promise<KnowledgeManifest> {
    const res = await fetch(this.url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`);
    return (await res.json()) as KnowledgeManifest;
  }
}

let defaultSource: KnowledgeSource = new StaticManifestSource();
export function setDefaultKnowledgeSource(src: KnowledgeSource) {
  defaultSource = src;
}
export function getDefaultKnowledgeSource() {
  return defaultSource;
}
