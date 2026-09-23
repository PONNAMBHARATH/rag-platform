const { Ollama } = require("ollama");

const ollama = new Ollama();

const MODEL_NAME = "qwen2.5:latest";

const generateAnswer = async ({ question, context }) => {
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
        model: MODEL_NAME,
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
    });

    return response.message.content;
};

module.exports = {
    generateAnswer,
};