const { Ollama } = require("ollama");
const { GoogleGenAI } = require("@google/genai");

const ollama = new Ollama({
    host: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
});

const ollamaCloud = new Ollama({
    host: process.env.OLLAMA_CLOUD_BASE_URL || "https://ollama.com",
    headers: process.env.OLLAMA_CLOUD_API_KEY
        ? { Authorization: `Bearer ${process.env.OLLAMA_CLOUD_API_KEY}` }
        : {},
});

const gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const OLLAMA_MODEL =
    process.env.OLLAMA_MODEL || "qwen2.5:latest";

const OLLAMA_CLOUD_MODEL =
    process.env.OLLAMA_CLOUD_MODEL || "gpt-oss:120b";

const GEMINI_MODEL =
    process.env.GEMINI_MODEL || "gemini-3.8-flash";

const LLM_PROVIDER =
    process.env.LLM_PROVIDER || "ollama";

const createPrompt = ({
    question,
    context,
}) => `
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

const generateWithOllama = async ({
    question,
    context,
}) => {
    const response = await ollama.chat({
        model: OLLAMA_MODEL,
        messages: [
            {
                role: "user",
                content: createPrompt({ question, context }),
            },
        ],
    });

    return response.message.content;
};

const generateWithOllamaCloud = async ({
    question,
    context,
}) => {
    try {
        if (!process.env.OLLAMA_CLOUD_API_KEY) {
            throw new Error("OLLAMA_CLOUD_API_KEY is required for Ollama Cloud");
        }

        const response = await ollamaCloud.chat({
            model: OLLAMA_CLOUD_MODEL,
            messages: [
                {
                    role: "user",
                    content: createPrompt({ question, context }),
                },
            ],
        });
        const status = response?.status;

        if (status !== undefined && status !== 200) {
            throw new Error(`Ollama Cloud request failed with status ${status}`);
        }

        return response.message.content;
    } catch (error) {
        console.warn("Ollama Cloud request failed; falling back to Gemini:", error.message);
        return generateWithGemini({ question, context });
    }
};

const generateWithGemini = async ({
    question,
    context,
}) => {
    const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: createPrompt({ question, context }),
    });
    const status = response?.sdkHttpResponse?.status ?? response?.status;

    if (status !== undefined && status !== 200) {
        throw new Error(`Gemini request failed with status ${status}`);
    }

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

    if (LLM_PROVIDER === "ollama-cloud") {
        return generateWithOllamaCloud({ question, context });
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