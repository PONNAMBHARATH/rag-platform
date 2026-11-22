const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const {
    extractDocumentText,
} = require("./document.service");

const { cleanText } = require("./text-cleaning.service");
const { chunkWorkbookRows } = require("./xlsx-chunking.service");
const { chunkText } = require("./chunking.service");
const {
    generateEmbedding,
    getEmbeddingTokenizer,
} = require("../embedding/embedding.service");

const {
    upsertChunkBatch,
    deleteChunkBatch,
} = require("../vector/qdrant.service");

const {
    downloadDocumentFile,
} = require("../storage/storage.service");

const INDEX_BATCH_SIZE = 32;

const createUserSupabaseClient = (token) => {
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_PUBLISHABLE_KEY,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        }
    );
};

const updateDocumentStatus = async ({
    userSupabase,
    documentId,
    userId,
    status,
    processingStage,
}) => {
    const { error } = await userSupabase
        .from("documents")
        .update({
            status,
            processing_stage: processingStage,
        })
        .eq("id", documentId)
        .eq("user_id", userId);

    if (error) {
        throw error;
    }
};

const processDocument = async ({
    documentId,
    userId,
    token,
}) => {
    const userSupabase = createUserSupabaseClient(token);
    const attemptedPointBatches = [];

    try {
        const { data: document, error } = await userSupabase
            .from("documents")
            .select(
                "id, user_id, file_name, file_type, storage_path, status"
            )
            .eq("id", documentId)
            .eq("user_id", userId)
            .single();

        if (error || !document) {
            throw new Error("Document not found");
        }

        if (!document.storage_path) {
            throw new Error("Document has no storage path");
        }

        const fileBuffer = await downloadDocumentFile({
            storagePath: document.storage_path,
            token,
        });

        await updateDocumentStatus({
            userSupabase,
            documentId,
            userId,
            status: "processing",
            processingStage: "extracting",
        });

        const extractedDocument = await extractDocumentText({
            buffer: fileBuffer,
            mimetype: document.file_type,
        });

        await updateDocumentStatus({
            userSupabase,
            documentId,
            userId,
            status: "processing",
            processingStage: "chunking",
        });

        const chunks = extractedDocument.worksheets
            ? chunkWorkbookRows(extractedDocument.worksheets, await getEmbeddingTokenizer())
            : chunkText(cleanText(extractedDocument.text));

        await updateDocumentStatus({
            userSupabase,
            documentId,
            userId,
            status: "processing",
            processingStage: "embedding",
        });

        for (let offset = 0; offset < chunks.length; offset += INDEX_BATCH_SIZE) {
            const points = [];

            for (const chunk of chunks.slice(offset, offset + INDEX_BATCH_SIZE)) {
                points.push({
                    id: crypto.randomUUID(),
                    vector: await generateEmbedding(chunk.text),
                    payload: {
                        userId,
                        documentId,
                        fileName: document.file_name,
                        chunkIndex: chunk.chunkIndex,
                        text: chunk.text,
                        visibility: "private",
                        ...(chunk.spreadsheetLocation && { spreadsheetLocation: chunk.spreadsheetLocation }),
                    },
                });
            }

            // A failed or timed-out write may still have reached Qdrant.
            attemptedPointBatches.push(points.map(({ id }) => id));
            await upsertChunkBatch(points);
        }

        await updateDocumentStatus({
            userSupabase,
            documentId,
            userId,
            status: "ready",
            processingStage: null,
        });

        return {
            document,
            fileBuffer,
            extractedDocument,
            chunks,
        };
    } catch (error) {
        for (const pointIds of attemptedPointBatches) {
            try {
                await deleteChunkBatch(pointIds);
            } catch (cleanupError) {
                console.error("Failed to remove vectors from a failed indexing attempt:", cleanupError);
            }
        }

        try {
            await updateDocumentStatus({
                userSupabase,
                documentId,
                userId,
                status: "failed",
                processingStage: null,
            });
        } catch (statusError) {
            console.error(
                "Failed to update document failure status:",
                statusError
            );
        }

        throw error;
    }
};

module.exports = {
    processDocument,
};