const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const authMiddleware = require("../middleware/auth.middleware");
const {
    getDocuments,
    getDocument,
    deleteDocument,
} = require("../services/document/document-management.service");
const {
    processDocument,
} = require("../services/document/document-processing.service");
const {
    uploadDocumentFile,
} = require("../services/storage/storage.service");
const upload = require("../middleware/upload.middleware");


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
        let documentId = null;
        let userSupabase = null;

        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No file uploaded",
                });
            }

            // ---------------------------------------
            // 1. Create authenticated Supabase client
            // ---------------------------------------

            const authHeader = req.headers.authorization;
            const token = authHeader.replace("Bearer ", "");

            userSupabase = createClient(
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

            // ---------------------------------------
            // 2. Create document record
            // ---------------------------------------

            const { data, error } = await userSupabase
                .from("documents")
                .insert({
                    user_id: req.user.id,
                    file_name: req.file.originalname,
                    file_type: req.file.mimetype,
                    file_size: req.file.size,
                    status: "processing",
                    processing_stage: "extracting",
                })
                .select()
                .single();

            if (error) {
                console.error(
                    "Document metadata error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to save document metadata",
                });
            }

            documentId = data.id;

            const storagePath = await uploadDocumentFile({
                file: req.file,
                userId: req.user.id,
                documentId,
                token,
            });

            const { error: storagePathError } = await userSupabase
                .from("documents")
                .update({
                    storage_path: storagePath,
                })
                .eq("id", documentId)
                .eq("user_id", req.user.id);

            if (storagePathError) {
                console.error(
                    "Failed to save storage path:",
                    storagePathError
                );

                throw storagePathError;
            }

            processDocument({
                documentId,
                userId: req.user.id,
                token,
            }).catch(async (error) => {
                console.error(
                    `Background processing failed for document ${documentId}:`,
                    error
                );
            });

            return res.json({
                success: true,
                message: "File uploaded and indexed successfully",
                document: {
                    ...data,
                    status: "ready",
                    processing_stage: null,
                    storage_path: storagePath,
                },
            });
        } catch (error) {
            console.error("Upload error:", error);

            // ---------------------------------------
            // Mark document as failed
            // ---------------------------------------

            if (documentId && userSupabase) {
                try {
                    await userSupabase
                        .from("documents")
                        .update({
                            status: "failed",
                        })
                        .eq("id", documentId);
                } catch (statusError) {
                    console.error(
                        "Failed to update document status:",
                        statusError
                    );
                }
            }

            return res.status(500).json({
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

router.get(
    "/:documentId/download-test",
    authMiddleware,
    async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader.replace("Bearer ", "");

            const result = await processDocument({
                documentId: req.params.documentId,
                userId: req.user.id,
                token,
            });
            return res.json({
                success: true,
                documentId: result.document.id,
                fileName: result.document.file_name,
                chunkCount: result.chunks.length,
            });
        } catch (error) {
            console.error(
                "Document processing test error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
);

module.exports = router;