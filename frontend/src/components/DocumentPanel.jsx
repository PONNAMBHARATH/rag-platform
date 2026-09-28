import { useEffect, useState } from "react";
import { Menu, Trash2, Upload } from "lucide-react";
import {
    getDocuments,
    deleteDocument,
    uploadDocument,
} from "../../services/document.service";

import DocumentFileIcon from "./DocumentFileIcon";
import UploadDocumentDialog from "./UploadDocumentDialog";

const DocumentHeader = ({ onOpenMenu, onUpload, uploadDisabled }) => (
    <header className="flex shrink-0 items-center gap-3 border-b bg-white px-4 py-3 md:px-6 md:py-4">
        {onOpenMenu && (
            <button
                type="button"
                onClick={onOpenMenu}
                aria-label="Open navigation"
                className="grid size-10 shrink-0 place-items-center rounded-lg hover:bg-gray-100 md:hidden"
            >
                <Menu size={20} />
            </button>
        )}

        <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-gray-900">
                Documents
            </h2>
            <p className="hidden text-sm text-gray-500 sm:block">
                Manage your uploaded documents
            </p>
        </div>

        <button
            type="button"
            onClick={onUpload}
            disabled={uploadDisabled}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
        >
            <Upload size={16} />
            Upload
        </button>
    </header>
);

const DocumentPanel = ({ onOpenMenu }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [droppedFile, setDroppedFile] = useState(null);
    const [deletingDoc, setDeletingDoc] = useState(false);

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();

        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDragging(false);
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);

        const file = event.dataTransfer.files?.[0];

        if (!file) {
            return;
        }

        setDroppedFile(file);
        setUploadDialogOpen(true);
    };

    const handleUpload = async (file) => {
        try {
            setUploading(true);

            await uploadDocument(file);
            await loadDocuments();

            setUploadDialogOpen(false);
            setDroppedFile(null);
        } catch (error) {
            console.error(
                "Failed to upload document:",
                error
            );

            alert("Failed to upload document.");
        } finally {
            setUploading(false);
        }
    };

    const loadDocuments = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            const result = await getDocuments();

            setDocuments(result.documents || []);
        } catch (error) {
            console.error(
                "Failed to load documents:",
                error
            );
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };


    useEffect(() => {
        loadDocuments();
    }, []);

    useEffect(() => {
        const hasProcessingDocuments = documents.some(
            (document) => document.status === "processing"
        );

        if (!hasProcessingDocuments) {
            return;
        }

        const interval = setInterval(() => {
            loadDocuments(false);
        }, 3000);

        return () => {
            clearInterval(interval);
        };
    }, [documents]);

    const handleDelete = async (documentId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this document?"
        );

        if (!confirmed) {
            return;
        }

        setDeletingDoc(true);

        try {
            await deleteDocument(documentId);

            setDocuments((prev) =>
                prev.filter(
                    (document) =>
                        document.id !== documentId
                )
            );
        } catch (error) {
            console.error(
                "Failed to delete document:",
                error
            );

            alert("Failed to delete document.");
        } finally {
            setDeletingDoc(false);
        }
    };

    const getStatusInfo = (document) => {
        if (document.status === "ready") {
            return {
                label: "Ready",
                className: "bg-green-50 text-green-700",
            };
        }

        if (document.status === "failed") {
            return {
                label: "Failed",
                className: "bg-red-50 text-red-700",
            };
        }

        if (document.status === "processing") {
            const stage = document.processing_stage;

            const stageLabels = {
                extracting: "Extracting",
                chunking: "Chunking",
                embedding: "Embedding",
                indexing: "Indexing",
            };

            return {
                label: stageLabels[stage] || "Processing",
                className: "bg-yellow-50 text-yellow-700",
            };
        }

        return {
            label: "Unknown",
            className: "bg-gray-100 text-gray-600",
        };
    };

    const formatFileSize = (bytes) => {
        if (!bytes) {
            return "0 B";
        }

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        const kb = bytes / 1024;

        if (kb < 1024) {
            return `${Math.round(kb)} KB`;
        }

        return `${(kb / 1024).toFixed(1)} MB`;
    };

    if (loading) {
        return (
            <div
                className="relative flex h-full flex-col bg-white"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <DocumentHeader
                    onOpenMenu={onOpenMenu}
                    onUpload={() => setUploadDialogOpen(true)}
                    uploadDisabled
                />
                <div className="p-6 text-sm text-gray-500">
                    Loading documents...
                </div>
                {isDragging && (
                    <div className="pointer-events-none absolute inset-3 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-400 bg-white/90">
                        <p className="text-sm font-medium text-gray-700">
                            Drop a PDF, DOCX, or TXT file to upload
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className="relative flex h-full flex-col bg-white"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragging && (
                <div className="pointer-events-none absolute inset-3 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-400 bg-white/90">
                    <p className="text-sm font-medium text-gray-700">
                        Drop a PDF, DOCX, or TXT file to upload
                    </p>
                </div>
            )}
            <DocumentHeader
                onOpenMenu={onOpenMenu}
                onUpload={() => setUploadDialogOpen(true)}
                uploadDisabled={uploading}
            />

            {/* Document list */}
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {documents.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-700">
                                No documents yet
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                Upload a document to start chatting.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="mx-auto max-w-3xl space-y-3">
                        {documents.map((document) => (
                            <div
                                key={document.id}
                                className="flex items-center gap-4 rounded-xl border bg-white p-4 transition hover:shadow-sm"
                            >
                                <DocumentFileIcon
                                    fileType={document.file_type}
                                />

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-900">
                                        {document.file_name}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <p className="text-xs text-gray-500">
                                            {formatFileSize(document.file_size)}
                                            {" • "}
                                            {new Date(
                                                document.created_at
                                            ).toLocaleDateString()}
                                        </p>

                                        {(() => {
                                            const statusInfo = getStatusInfo(document);

                                            return (
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusInfo.className}`}
                                                >
                                                    {statusInfo.label}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDelete(
                                            document.id
                                        )
                                    }
                                    disabled={deletingDoc}
                                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                    title="Delete document"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <UploadDocumentDialog
                isOpen={uploadDialogOpen}
                initialFile={droppedFile}
                onClose={() => {
                    setUploadDialogOpen(false);
                    setDroppedFile(null);
                }}
                onUpload={handleUpload}
                uploading={uploading}
            />
        </div>
    );
};

export default DocumentPanel;