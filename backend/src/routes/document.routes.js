const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const authMiddleware = require("../middleware/auth.middleware");
const {
    getDocuments,
    getDocument,
    deleteDocument,
} = require("../services/document/document-management.service");
const { extractDocumentText } = require("../services/document/document.service");
const { cleanText } = require("../services/document/text-cleaning.service");
const { chunkText } = require("../services/document/chunking.service");
const { generateEmbedding } = require("../services/embedding/embedding.service");
const { upsertChunk } = require("../services/vector/qdrant.service");
const upload = require("../middleware/upload.middleware");
const crypto = require("crypto");

const router = express.Router();

const getTokenFromRequest = (req) => {
    const authHeader = req.headers.authorization;

    return authHeader.replace("Bearer ", "");
};

const handleUpload = (req, res, next) => {
    upload.single("file")(req, res, (error) => {
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        next();
    });
};

router.post(
    "/upload",
    authMiddleware,
    handleUpload,
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No file uploaded",
                });
            }

            const extractedDocument = await extractDocumentText(req.file);
            const cleanedText = cleanText(extractedDocument.text);
            const chunks = chunkText(cleanedText);

            const authHeader = req.headers.authorization;
            const token = authHeader.replace("Bearer ", "");

            const userSupabase = createClient(
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

            const { data, error } = await userSupabase
                .from("documents")
                .insert({
                    user_id: req.user.id,
                    file_name: req.file.originalname,
                    file_type: req.file.mimetype,
                    file_size: req.file.size,
                    status: "uploaded",
                })
                .select()
                .single();

            if (error) {
                console.error("Document metadata error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Failed to save document metadata",
                });
            }

            for (const chunk of chunks) {
                console.log(`Embedding chunk ${chunk.chunkIndex}...`);

                const embedding = await generateEmbedding(chunk.text);

                const pointId = crypto.randomUUID();

                await upsertChunk({
                    id: pointId,
                    embedding,
                    payload: {
                        userId: req.user.id,
                        documentId: data.id,
                        fileName: req.file.originalname,
                        chunkIndex: chunk.chunkIndex,
                        text: chunk.text,
                        visibility: "private",
                    },
                });

                console.log(
                    `Chunk ${chunk.chunkIndex} inserted into Qdrant`
                );
            }

            // return;
            res.json({
                success: true,
                message: "File uploaded and metadata saved",
                document: data,
            });
        } catch (error) {
            console.error("Upload error:", error);

            res.status(500).json({
                success: false,
                message: "Upload failed",
            });
        }
    }
);

router.get("/", authMiddleware, async (req, res) => {
    try {
        const token = getTokenFromRequest(req);

        const documents = await getDocuments({
            userId: req.user.id,
            token,
        });

        return res.json({
            success: true,
            documents,
        });
    } catch (error) {
        console.error("Get documents error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch documents",
        });
    }
});

router.get("/:documentId", authMiddleware, async (req, res) => {
    try {
        const { documentId } = req.params;

        const token = getTokenFromRequest(req);

        const document = await getDocument({
            documentId,
            userId: req.user.id,
            token,
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        return res.json({
            success: true,
            document,
        });
    } catch (error) {
        console.error("Get document error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch document",
        });
    }
});

router.delete("/:documentId", authMiddleware, async (req, res) => {
    try {
        const { documentId } = req.params;

        const token = getTokenFromRequest(req);

        const document = await deleteDocument({
            documentId,
            userId: req.user.id,
            token,
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        return res.json({
            success: true,
            message: "Document deleted successfully",
            documentId: document.id,
        });
    } catch (error) {
        console.error("Delete document error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete document",
        });
    }
});

module.exports = router;

module.exports = router;