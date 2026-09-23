const { pipeline } = require("@huggingface/transformers");

let embeddingPipeline = null;

const getEmbeddingPipeline = async () => {
    if (!embeddingPipeline) {
        embeddingPipeline = await pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2"
        );
    }

    return embeddingPipeline;
};

const generateEmbedding = async (text) => {
    const extractor = await getEmbeddingPipeline();

    const output = await extractor(text, {
        pooling: "mean",
        normalize: true,
    });

    return Array.from(output.data);
};

module.exports = {
    generateEmbedding,
};