const qdrant = require("../../config/qdrant");

const COLLECTION_NAME = "rag_platform_collection";

const upsertChunkBatch = async (points) => {
    await qdrant.upsert(COLLECTION_NAME, { wait: true, points });
};

const deleteChunkBatch = async (pointIds) => {
    await qdrant.delete(COLLECTION_NAME, { wait: true, points: pointIds });
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
    upsertChunkBatch,
    deleteChunkBatch,
    deleteDocumentChunks,
};