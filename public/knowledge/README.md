# GridAtlas Knowledge Base

This folder is the **document store** for the future GridAtlas energy RAG assistant.

Drop documents here in any of these formats:

- `.pdf` — energy reports, regulatory filings, datasheets
- `.md` — markdown briefs, internal notes
- `.txt` — plain text transcripts, logs

## How indexing will work (future)

1. A backend job walks `/public/knowledge`, parses each file into text chunks.
2. Chunks are embedded with the Lovable AI Gateway (`google/gemini-embedding-001`).
3. Embeddings + metadata are stored in Postgres + pgvector.
4. The chat assistant retrieves the top-k chunks per question and grounds its answer in them.

## How documents are listed today

The admin page at **`/admin/knowledge`** fetches `/knowledge/manifest.json` and displays:

- file name
- format
- size
- last-modified date
- ingestion status (`pending` until the indexer runs)

To register new files, add an entry to `manifest.json`. Later this will be auto-generated.
