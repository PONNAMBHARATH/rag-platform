import { useEffect, useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import {
    getDocuments,
    deleteDocument,
    uploadDocument,
} from "../../services/document.service";

import DocumentFileIcon from "./DocumentFileIcon";
import UploadDocumentDialog from "./UploadDocumentDialog";

const DocumentPanel = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

    const handleUpload = async (file) => {
        try {
            setUploading(true);

            await uploadDocument(file);

            await loadDocuments();

            setUploadDialogOpen(false);
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

    const loadDocuments = async () => {
        try {
            setLoading(true);

            const result = await getDocuments();

            setDocuments(result.documents || []);
        } catch (error) {
            console.error(
                "Failed to load documents:",
                error
            );
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadDocuments();
    }, []);

    const handleDelete = async (documentId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this document?"
        );

        if (!confirmed) {
            return;
        }

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
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) {
            return "0 KB";
        }

        const kb = bytes / 1024;

        if (kb < 1024) {
            return `${Math.round(kb)} KB`;
        }

        return `${(kb / 1024).toFixed(1)} MB`;
    };

    if (loading) {
        return (
            <div className="p-6 text-sm text-gray-500">
                Loading documents...
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col bg-white">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Documents
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Manage your uploaded documents
                    </p>
                </div>

                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleUpload}
                        className="hidden"
                    />

                    <button
                        type="button"
                        onClick={() => setUploadDialogOpen(true)}
                        className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        <Upload size={16} />
                        Upload
                    </button>
                </div>
            </div>

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

                                    <p className="mt-1 text-xs text-gray-500">
                                        {formatFileSize(
                                            document.file_size
                                        )}

                                        {" • "}

                                        {new Date(
                                            document.created_at
                                        ).toLocaleDateString()}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDelete(
                                            document.id
                                        )
                                    }
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
                onClose={() => setUploadDialogOpen(false)}
                onUpload={handleUpload}
                uploading={uploading}
            />
        </div>
    );
};

export default DocumentPanel;