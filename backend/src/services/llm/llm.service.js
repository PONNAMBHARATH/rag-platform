const { Ollama } = require("ollama");
const { GoogleGenAI } = require("@google/genai");

const ollama = new Ollama();

const gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const OLLAMA_MODEL =
    process.env.OLLAMA_MODEL || "qwen2.5:latest";

const GEMINI_MODEL =
    process.env.GEMINI_MODEL || "gemini-3.8-flash";

const LLM_PROVIDER =
    process.env.LLM_PROVIDER || "ollama";

const generateWithOllama = async ({
    question,
    context,
}) => {
    const prompt = `
You are a helpful assistant answering questions using the provided context.

Rules:
- Answer using only the provided context.
- If the answer cannot be found in the context, say:
  "I couldn't find the answer in the provided documents."
- Do not make up information.

Context:
${context}

Question:
${question}

Answer:
`;

    const response = await ollama.chat({
        model: OLLAMA_MODEL,
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
    });

    return response.message.content;
};

const generateWithGemini = async ({
    question,
    context,
}) => {
    const prompt = `
You are a helpful assistant answering questions using the provided context.

Rules:
- Answer using only the provided context.
- If the answer cannot be found in the context, say:
  "I couldn't find the answer in the provided documents."
- Do not make up information.

Context:
${context}

Question:
${question}

Answer:
`;

    const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
    });

    return response.text;
};

const generateAnswer = async ({
    question,
    context,
}) => {
    if (LLM_PROVIDER === "ollama") {
        return generateWithOllama({
            question,
            context,
        });
    }

    if (LLM_PROVIDER === "gemini") {
        return generateWithGemini({
            question,
            context,
        });
    }

    throw new Error(
        `Unsupported LLM provider: ${LLM_PROVIDER}`
    );
};

module.exports = {
    generateAnswer,
};