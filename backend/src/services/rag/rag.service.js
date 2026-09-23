const { generateAnswer } = require("../llm/llm.service");
const { buildContext } = require("./context.service");
const { generateEmbedding } = require("../embedding/embedding.service");
const { searchSimilarChunks } = require("../vector/search.service");

const generateRagAnswer = async ({
    question,
    userId,
}) => {
    // 1. Convert question into embedding
    const embedding = await generateEmbedding(question);

    // 2. Retrieve relevant chunks
    const results = await searchSimilarChunks({
        embedding,
        userId,
        limit: 4,
    });

    // 3. Build context from retrieved chunks
    const context = buildContext(results);

    // 4. Generate answer using LLM
    const answer = await generateAnswer({
        question,
        context,
    });

    return {
        answer,
        sources: results.map((result) => ({
            documentId: result.payload.documentId,
            fileName: result.payload.fileName,
            snippet: result.payload.text.slice(0, 180),
        }))
    };
};

module.exports = {
    generateRagAnswer,
};