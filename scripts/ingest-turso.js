require('dotenv').config({ path: '.env' });

const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const DATA_DIR = path.join(process.cwd(), 'data/source');
const RAG_DOCS = [
  { slug: 'company', title: 'Company Information', file: 'company.md' },
  { slug: 'faq', title: 'FAQ', file: 'faq.md' },
  { slug: 'policies', title: 'Policies', file: 'policies.md' },
];

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function chunkMarkdown(content, source) {
  const sections = content.split(/(?=^## )/m).filter(s => s.trim());
  const chunks = [];
  const CHUNK_SIZE = 500;
  const OVERLAP = 50;
  for (const section of sections) {
    const heading = section.match(/^## (.+)/m)?.[1] || source;
    if (section.length <= CHUNK_SIZE) {
      chunks.push({ content: section.trim(), metadata: JSON.stringify({ source, heading }) });
      continue;
    }
    let start = 0;
    while (start < section.length) {
      const end = Math.min(start + CHUNK_SIZE, section.length);
      chunks.push({ content: section.slice(start, end).trim(), metadata: JSON.stringify({ source, heading }) });
      if (end >= section.length) break;
      start = end - OVERLAP;
    }
  }
  return chunks;
}

// Simple pseudo-embedding (same as the fallback in embedder.ts when no API key)
function pseudoEmbedding(text, dims = 64) {
  const vec = new Array(dims).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % dims] += text.charCodeAt(i) / 255;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

async function embedTexts(texts) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (apiKey) {
    // Use real embeddings via REST
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const results = [];
    for (const text of texts) {
      const result = await model.embedContent(text);
      results.push(result.embedding.values);
    }
    return results;
  }
  return texts.map(t => pseudoEmbedding(t));
}

async function run() {
  console.log('Ingesting knowledge base into Turso...');
  for (const doc of RAG_DOCS) {
    const filePath = path.join(DATA_DIR, doc.file);
    if (!fs.existsSync(filePath)) { console.warn('Missing:', filePath); continue; }

    const content = fs.readFileSync(filePath, 'utf-8');
    const contentHash = hashContent(content);
    const existing = await prisma.knowledgeDocument.findUnique({ where: { slug: doc.slug } });
    if (existing?.contentHash === contentHash) { console.log('Unchanged:', doc.slug); continue; }

    const chunks = chunkMarkdown(content, doc.slug);
    console.log('Embedding', chunks.length, 'chunks for', doc.slug, '...');
    const embeddings = await embedTexts(chunks.map(c => c.content));

    const document = await prisma.knowledgeDocument.upsert({
      where: { slug: doc.slug },
      create: { slug: doc.slug, title: doc.title, sourcePath: filePath, contentHash },
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
    console.log('Done:', doc.slug, '-', chunks.length, 'chunks');
  }
  const total = await prisma.knowledgeChunk.count();
  console.log('Total chunks in Turso:', total);
  await prisma.$disconnect();
}

run().catch(e => { console.error(e.message); process.exit(1); });
