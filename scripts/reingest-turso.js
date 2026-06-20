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

async function embedTexts(texts) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not set');
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const results = [];
  for (const text of texts) {
    const result = await model.embedContent(text);
    results.push(result.embedding.values);
  }
  return results;
}

async function run() {
  console.log('Force re-ingesting with real embeddings...');

  // Delete all existing chunks and docs first
  await prisma.knowledgeChunk.deleteMany({});
  await prisma.knowledgeDocument.deleteMany({});
  console.log('Cleared existing knowledge base');

  for (const doc of RAG_DOCS) {
    const filePath = path.join(DATA_DIR, doc.file);
    if (!fs.existsSync(filePath)) { console.warn('Missing:', filePath); continue; }

    const content = fs.readFileSync(filePath, 'utf-8');
    const contentHash = hashContent(content);
    const chunks = chunkMarkdown(content, doc.slug);

    console.log('Embedding', chunks.length, 'chunks for', doc.slug, '...');
    const embeddings = await embedTexts(chunks.map(c => c.content));

    const document = await prisma.knowledgeDocument.create({
      data: { slug: doc.slug, title: doc.title, sourcePath: filePath, contentHash },
    });

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
    console.log('Done:', doc.slug, '-', chunks.length, 'chunks with real embeddings');
  }

  const total = await prisma.knowledgeChunk.count();
  console.log('Total chunks in Turso:', total);
  await prisma.$disconnect();
}

run().catch(e => { console.error(e.message); process.exit(1); });
