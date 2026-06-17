import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { prisma } from "@/lib/db";
import { embedText, embedTexts } from "@/ai/embedder";

const DATA_DIR = path.join(process.cwd(), "data/source");

const RAG_DOCS = [
  { slug: "company", title: "Company Information", file: "company.md" },
  { slug: "faq", title: "FAQ", file: "faq.md" },
  { slug: "policies", title: "Policies", file: "policies.md" },
];

function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function chunkMarkdown(content: string, source: string): { content: string; metadata: string }[] {
  const sections = content.split(/(?=^## )/m).filter((s) => s.trim());
  const chunks: { content: string; metadata: string }[] = [];
  const CHUNK_SIZE = 500;
  const OVERLAP = 50;

  for (const section of sections) {
    const heading = section.match(/^## (.+)/m)?.[1] || source;
    if (section.length <= CHUNK_SIZE) {
      chunks.push({
        content: section.trim(),
        metadata: JSON.stringify({ source, heading }),
      });
      continue;
    }
    let start = 0;
    while (start < section.length) {
      const end = Math.min(start + CHUNK_SIZE, section.length);
      chunks.push({
        content: section.slice(start, end).trim(),
        metadata: JSON.stringify({ source, heading }),
      });
      if (end >= section.length) break;
      start = end - OVERLAP;
    }
  }
  return chunks;
}

export async function ingestKnowledgeBase(): Promise<void> {
  console.log("📚 Ingesting knowledge base...");

  for (const doc of RAG_DOCS) {
    const filePath = path.join(DATA_DIR, doc.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skipping missing file: ${filePath}`);
      continue;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const contentHash = hashContent(content);

    const existing = await prisma.knowledgeDocument.findUnique({
      where: { slug: doc.slug },
    });

    if (existing?.contentHash === contentHash) {
      console.log(`✓ ${doc.slug} unchanged, skipping`);
      continue;
    }

    const chunks = chunkMarkdown(content, doc.slug);
    const embeddings = await embedTexts(chunks.map((c) => c.content));

    const document = await prisma.knowledgeDocument.upsert({
      where: { slug: doc.slug },
      create: {
        slug: doc.slug,
        title: doc.title,
        sourcePath: filePath,
        contentHash,
      },
      update: { contentHash, title: doc.title },
    });

    await prisma.knowledgeChunk.deleteMany({ where: { documentId: document.id } });

    for (let i = 0; i < chunks.length; i++) {
      await prisma.knowledgeChunk.create({
        data: {
          documentId: document.id,
          chunkIndex: i,
          content: chunks[i].content,
          metadata: chunks[i].metadata,
          embedding: JSON.stringify(embeddings[i]),
        },
      });
    }
    console.log(`✓ ${doc.slug}: ${chunks.length} chunks embedded`);
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

export async function searchKnowledgeBase(query: string, topK = 3) {
  const queryEmbedding = await embedText(query);
  const chunks = await prisma.knowledgeChunk.findMany({
    include: { document: { select: { slug: true, title: true } } },
  });

  if (chunks.length === 0) {
    return { results: [], message: "Knowledge base not indexed. Run npm run ingest." };
  }

  const scored = chunks
    .map((chunk) => {
      const embedding = JSON.parse(chunk.embedding) as number[];
      return {
        content: chunk.content,
        source: chunk.document.slug,
        title: chunk.document.title,
        metadata: chunk.metadata ? JSON.parse(chunk.metadata) : {},
        score: cosineSimilarity(queryEmbedding, embedding),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return { results: scored, message: null };
}
