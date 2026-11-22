const { pipeline } = require("@huggingface/transformers");

let embeddingPipelinePromise = null;

const getEmbeddingPipeline = () => {
    if (!embeddingPipelinePromise) {
        embeddingPipelinePromise = pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2"
        ).catch((error) => {
            embeddingPipelinePromise = null;
            throw error;
        });
    }

    return embeddingPipelinePromise;
};

const getEmbeddingTokenizer = async () => {
    const extractor = await getEmbeddingPipeline();
    return extractor.tokenizer;
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
    getEmbeddingTokenizer,
};
