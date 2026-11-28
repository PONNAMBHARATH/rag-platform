import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CircleAlert, CircleCheck, Eye, LoaderCircle, Menu, Trash2, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import {
    getDocuments,
    deleteDocument,
    uploadDocument,
} from "../../services/document.service";

import { supportedFileTypes } from "../lib/documentFileTypes";
import { formatFileSize } from "../lib/formatFileSize";
import AccountMenu from "./AccountMenu";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import DocumentFileIcon from "./DocumentFileIcon";
import DocumentPreviewDialog from "./DocumentPreviewDialog";
import UploadDocumentDialog from "./UploadDocumentDialog";

const documentRowClass = "flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4";
const skeletonBarClass = "h-2.5 rounded-full bg-gray-200";

const documentStatuses = {
    ready: { label: "Ready to chat", Icon: CircleCheck, className: "bg-green-50 text-green-800" },
    processing: { label: "Processing", Icon: LoaderCircle, className: "bg-amber-50 text-amber-800" },
    failed: { label: "Processing failed", Icon: CircleAlert, className: "bg-red-50 text-red-800" },
};
const processingStages = {
    extracting: "Extracting text",
    chunking: "Splitting text",
    embedding: "Generating embeddings",
    indexing: "Indexing",
};

function DocumentStatus({ status, stage }) {
    const statusInfo = Object.hasOwn(documentStatuses, status) ? documentStatuses[status] : null;
    if (!statusInfo) {
        return <span className="text-xs text-gray-600">Status unavailable</span>;
    }

    const { label, Icon, className } = statusInfo;
    const isProcessing = status === "processing";
    const stageLabel = isProcessing && Object.hasOwn(processingStages, stage) ? processingStages[stage] : null;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${className}`}>
            <Icon size={14} aria-hidden="true" className={isProcessing ? "shrink-0 motion-safe:animate-spin" : "shrink-0"} />
            {stageLabel ? `${label} · ${stageLabel}` : label}
        </span>
    );
}

function DocumentListSkeleton() {
    return (
        <div aria-hidden="true" className="mx-auto max-w-3xl space-y-3 motion-safe:animate-pulse">
            {[0, 1, 2].map((row) => (
                <div key={row} className={documentRowClass}>
                    <div className="size-10 shrink-0 rounded-lg bg-gray-200" />
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className={`${skeletonBarClass} w-2/3 max-w-52`} />
                        <div className={`${skeletonBarClass} w-2/5 max-w-28`} />
                    </div>
                    <div className="size-5 shrink-0 rounded-md bg-gray-200" />
                </div>
            ))}
        </div>
    );
}

const DocumentHeader = ({ onOpenMenu, menuButtonRef, onUpload, uploadButtonRef, uploadDisabled }) => (
    <header className="flex shrink-0 items-center gap-3 border-b bg-white px-4 py-3 md:px-6 md:py-4">
        {onOpenMenu && (
            <button
                type="button"
                ref={menuButtonRef}
                onClick={onOpenMenu}
                aria-label="Open navigation"
                aria-haspopup="dialog"
                className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-gray-900 md:hidden"
            >
                <Menu size={20} aria-hidden="true" />
            </button>
        )}

        <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-gray-900">
                Documents
            </h2>
            <Link
                to="/chat"
                className="inline-flex min-h-8 items-center gap-1 rounded text-xs font-medium text-gray-600 hover:text-gray-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            >
                <ArrowLeft size={14} aria-hidden="true" />
                Back to chat
            </Link>
        </div>

        <button
            type="button"
            ref={uploadButtonRef}
            onClick={onUpload}
            disabled={uploadDisabled}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white enabled:cursor-pointer hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
        >
            <Upload size={16} />
            Upload
        </button>
        <AccountMenu />
    </header>
);

const DocumentPanel = ({ onOpenMenu, menuButtonRef, initialUploadDialogOpen = false }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(initialUploadDialogOpen);
    const [isDragging, setIsDragging] = useState(false);
    const [droppedFile, setDroppedFile] = useState(null);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const [previewDocument, setPreviewDocument] = useState(null);

    const uploadButtonRef = useRef(null);
    const initialDocumentsRequestRef = useRef(null);

    const openUploadDialog = (event) => {
        event.currentTarget.focus({ preventScroll: true });
        setUploadDialogOpen(true);
    };

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
        await uploadDocument(file);
        await refreshDocuments();
    };

    const refreshDocuments = async () => {
        try {
            const result = await getDocuments();
            setDocuments(result.documents || []);
        } catch (error) {
            console.error("Failed to refresh documents:", error);
        }
    };

    useEffect(() => {
        let isCurrent = true;
        initialDocumentsRequestRef.current ??= getDocuments();

        initialDocumentsRequestRef.current
            .then((result) => {
                if (isCurrent) setDocuments(result.documents || []);
            })
            .catch((error) => {
                if (isCurrent) console.error("Failed to load documents:", error);
            })
            .finally(() => {
                if (isCurrent) setLoading(false);
            });

        return () => {
            isCurrent = false;
        };
    }, []);

    useEffect(() => {
        const hasProcessingDocuments = documents.some(
            (document) => document.status === "processing"
        );

        if (!hasProcessingDocuments) {
            return;
        }

        const interval = setInterval(() => {
            refreshDocuments();
        }, 3000);

        return () => {
            clearInterval(interval);
        };
    }, [documents]);

    const handleDelete = async () => {
        const { id } = documentToDelete;
        await deleteDocument(id);
        setDocuments((current) => current.filter((document) => document.id !== id));
    };

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
                        Drop a {supportedFileTypes} file to upload
                    </p>
                </div>
            )}
            <DocumentHeader
                onOpenMenu={onOpenMenu}
                menuButtonRef={menuButtonRef}
                uploadButtonRef={uploadButtonRef}
                onUpload={openUploadDialog}
                uploadDisabled={loading}
            />

            {/* Document list */}
            <p role="status" className="sr-only">{loading && "Loading documents…"}</p>
            <div aria-busy={loading} className="min-h-0 flex-1 overflow-y-auto p-6">
                {loading ? (
                    <DocumentListSkeleton />
                ) : documents.length === 0 ? (
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
                                className={`${documentRowClass} transition hover:shadow-sm`}
                            >
                                <DocumentFileIcon
                                    fileType={document.file_type}
                                />

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <p className="min-w-0 break-words text-sm font-medium text-gray-900">
                                            {document.file_name}
                                        </p>
                                        <DocumentStatus status={document.status} stage={document.processing_stage} />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-600">
                                        {formatFileSize(document.file_size)}
                                        {" • "}
                                        {new Date(document.created_at).toLocaleDateString()}
                                    </p>
                                    {document.status === "failed" && (
                                        <div className="mt-2 text-sm text-gray-700">
                                            <p>This file couldn’t be processed. Upload a fresh copy to try again.</p>
                                            <button
                                                type="button"
                                                onClick={openUploadDialog}
                                                className="min-h-11 cursor-pointer rounded font-semibold text-gray-950 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                                            >
                                                Upload another copy
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex shrink-0 items-center">
                                    {document.status === "ready" && (
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.currentTarget.focus({ preventScroll: true });
                                                setPreviewDocument(document);
                                            }}
                                            aria-label={`Preview document: ${document.file_name}`}
                                            aria-haspopup="dialog"
                                            className="grid size-11 cursor-pointer place-items-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-950 focus-visible:outline-2 focus-visible:outline-gray-900"
                                            title="Preview document"
                                        >
                                            <Eye size={18} aria-hidden="true" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setDocumentToDelete(document)}
                                        aria-label={`Delete document: ${document.file_name}`}
                                        className="cursor-pointer rounded-lg p-2 text-gray-600 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-gray-900"
                                        title="Delete document"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {previewDocument && <DocumentPreviewDialog document={previewDocument} onClose={() => setPreviewDocument(null)} />}
            {documentToDelete && (
                <DeleteConfirmationDialog
                    title="Delete document?"
                    description={`“${documentToDelete.file_name}” will be permanently removed from your documents.`}
                    onCancel={() => setDocumentToDelete(null)}
                    onDelete={handleDelete}
                />
            )}
            {!loading && uploadDialogOpen && (
                <UploadDocumentDialog
                    initialFile={droppedFile}
                    fallbackFocusRef={uploadButtonRef}
                    onClose={() => {
                        setUploadDialogOpen(false);
                        setDroppedFile(null);
                    }}
                    onUpload={handleUpload}
                />
            )}
        </div>
    );
};

export default DocumentPanel;
