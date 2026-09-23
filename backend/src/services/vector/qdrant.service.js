const qdrant = require("../../config/qdrant");

const COLLECTION_NAME = "rag_platform_collection";

const upsertChunk = async ({
    id,
    embedding,
    payload,
}) => {
    await qdrant.upsert(COLLECTION_NAME, {
        wait: true,
        points: [
            {
                id,
                vector: embedding,
                payload,
            },
        ],
    });
};

const deleteDocumentChunks = async (documentId) => {
    await qdrant.delete(COLLECTION_NAME, {
        wait: true,
        filter: {
            must: [
                {
                    key: "documentId",
                    match: {
                        value: documentId,
                    },
                },
            ],
        },
    });
};

module.exports = {
    upsertChunk,
    deleteDocumentChunks,
};