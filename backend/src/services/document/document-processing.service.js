const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const {
    extractDocumentText,
} = require("./document.service");

const { cleanText } = require("./text-cleaning.service");
const { chunkText } = require("./chunking.service");
const {
    generateEmbedding,
} = require("../embedding/embedding.service");

const {
    upsertChunk,
} = require("../vector/qdrant.service");

const {
    downloadDocumentFile,
} = require("../storage/storage.service");

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

        const cleanedText = cleanText(extractedDocument.text);

        await updateDocumentStatus({
            userSupabase,
            documentId,
            userId,
            status: "processing",
            processingStage: "chunking",
        });

        const chunks = chunkText(cleanedText);

        await updateDocumentStatus({
            userSupabase,
            documentId,
            userId,
            status: "processing",
            processingStage: "embedding",
        });

        for (const chunk of chunks) {
            const embedding = await generateEmbedding(chunk.text);
            const pointId = crypto.randomUUID();

            await upsertChunk({
                id: pointId,
                embedding,
                payload: {
                    userId,
                    documentId,
                    fileName: document.file_name,
                    chunkIndex: chunk.chunkIndex,
                    text: chunk.text,
                    visibility: "private",
                },
            });
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