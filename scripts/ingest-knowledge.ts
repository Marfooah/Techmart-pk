import { ingestKnowledgeBase } from "../src/ai/rag/search";

ingestKnowledgeBase()
  .then(() => {
    console.log("✅ Knowledge base ingestion complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
