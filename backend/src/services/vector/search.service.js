const qdrant = require("../../config/qdrant");

const COLLECTION_NAME = "rag_platform_collection";

const searchSimilarChunks = async ({
    embedding,
    userId,
    limit = 4,
}) => {
    const response = await qdrant.query(COLLECTION_NAME, {
        query: embedding,
        limit,
        filter: {
            must: [
                {
                    key: "userId",
                    match: {
                        value: userId,
                    },
                },
            ],
        },
        with_payload: true,
    });

    return response.points.filter((point) => point.score >= 0.1);
};

module.exports = {
    searchSimilarChunks,
};