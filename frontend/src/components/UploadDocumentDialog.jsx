import { useEffect, useRef, useState } from "react";
import {
    FileText,
    Upload,
    X,
    LoaderCircle,
} from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
];

const getFileValidationError = (file) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return "Unsupported file type. Please select a PDF, DOCX, or TXT file.";
    }

    if (file.size > MAX_FILE_SIZE) {
        return "File is too large. Maximum file size is 10 MB.";
    }

    return "";
};

const UploadDocumentDialog = ({
    isOpen,
    initialFile,
    onClose,
    onUpload,
    uploading,
}) => {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen || !initialFile) {
            return;
        }

        const validationError = getFileValidationError(initialFile);
        setError(validationError);
        setSelectedFile(validationError ? null : initialFile);
    }, [isOpen, initialFile]);

    if (!isOpen) {
        return null;
    }

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const validationError = getFileValidationError(file);
        setError(validationError);

        if (validationError) {
            setSelectedFile(null);
            event.target.value = "";
            return;
        }

        setSelectedFile(file);
    };

    const handleChooseFile = () => {
        fileInputRef.current?.click();
    };

    const handleClose = () => {
        setSelectedFile(null);
        setError("");
        onClose();
    };
    const handleUpload = async () => {
        if (!selectedFile || uploading) {
            return;
        }

        await onUpload(selectedFile);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={handleClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Upload Document
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Add a document to your knowledge base.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {!selectedFile ? (
                        <button
                            type="button"
                            onClick={handleChooseFile}
                            className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 transition hover:border-gray-500 hover:bg-gray-50"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                                <Upload
                                    size={24}
                                    className="text-gray-600"
                                />
                            </div>

                            <p className="mt-4 text-sm font-medium text-gray-800">
                                Click to choose a file
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                                PDF, DOCX or TXT
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                                Maximum size: 10 MB
                            </p>
                        </button>
                    ) : (
                        <div className="rounded-xl border bg-gray-50 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
                                    <FileText
                                        size={20}
                                        className="text-gray-600"
                                    />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-800">
                                        {selectedFile.name}
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                        {(
                                            selectedFile.size /
                                            1024
                                        ).toFixed(1)}{" "}
                                        KB
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedFile(null)
                                    }
                                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                                    title="Remove file"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Validation Error */}
                {error && (
                    <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 text-center">
                        {error}
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t px-6 py-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="flex min-w-[90px] items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {uploading ? (
                            <>
                                <LoaderCircle
                                    size={16}
                                    className="animate-spin"
                                />
                                Uploading...
                            </>
                        ) : (
                            "Upload"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadDocumentDialog;