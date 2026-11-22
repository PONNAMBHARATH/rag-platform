import { FileText, LoaderCircle, Upload, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useModalDialog } from "../hooks/useModalDialog";
import { formatFileSize } from "../lib/formatFileSize";

import { ACCEPTED_FILE_TYPES, fileInputAccept, supportedFileTypes } from "../lib/documentFileTypes";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const buttonClass = "min-h-11 rounded-lg text-sm font-semibold enabled:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-60";

function getFileError(file) {
    if (!file) return "";

    const extension = file.name.split(".").pop().toLowerCase();
    const acceptedType = Object.hasOwn(ACCEPTED_FILE_TYPES, extension) && ACCEPTED_FILE_TYPES[extension];

    if (!acceptedType || file.type !== acceptedType) {
        return `Choose a ${supportedFileTypes} file.`;
    }
    if (file.size === 0) return "This file is empty. Choose a file with content.";
    if (file.size > MAX_FILE_SIZE) return "This file exceeds 10 MB. Choose a smaller file.";
    return "";
}

export default function UploadDocumentDialog({ initialFile, onClose, onUpload, fallbackFocusRef }) {
    const dialogRef = useModalDialog(true, fallbackFocusRef);
    const fileInputRef = useRef(null);
    const chooseFileRef = useRef(null);
    const titleId = useId();
    const descriptionId = useId();
    const [fileSelection, setFileSelection] = useState(() => {
        const error = getFileError(initialFile);
        return { file: error ? null : initialFile, error };
    });
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const { file: selectedFile, error } = fileSelection;

    const selectFiles = (files) => {
        if (isUploading || !files?.length) return;

        const file = files[0];
        const error = files.length > 1 ? "Choose one file at a time." : getFileError(file);
        setFileSelection({ file: error ? null : file, error });
    };

    const handleFileDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDraggingFile(false);
        selectFiles(event.dataTransfer.files);
    };

    const handleUpload = async (event) => {
        event.preventDefault();
        if (!selectedFile || isUploading) return;

        setFileSelection({ file: selectedFile, error: "" });
        setIsUploading(true);
        try {
            await onUpload(selectedFile);
            onClose();
        } catch (error) {
            console.error("Failed to upload document:", error);
            setFileSelection({
                file: selectedFile,
                error: "Couldn’t upload this file. Try again or choose another file.",
            });
            setIsUploading(false);
        }
    };

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onCancel={(event) => {
                event.preventDefault();
                if (!isUploading) onClose();
            }}
            onClick={(event) => {
                if (!isUploading && event.target === event.currentTarget) onClose();
            }}
            onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
            }}
            onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
            }}
            className="m-auto max-h-[calc(var(--workspace-height,100dvh)-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-0 text-gray-950 shadow-xl backdrop:bg-black/40"
        >
            <form onSubmit={handleUpload} className="p-6">
                <h2 id={titleId} className="text-lg font-semibold">Upload a document</h2>
                <p id={descriptionId} className="mt-2 text-sm leading-6 text-gray-600">
                    Add a file you can ask questions about once it’s processed.
                </p>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={fileInputAccept}
                    onChange={(event) => {
                        selectFiles(event.currentTarget.files);
                        event.currentTarget.value = "";
                    }}
                    className="hidden"
                />

                <button
                    ref={chooseFileRef}
                    type="button"
                    autoFocus
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => {
                        if (isUploading || !event.dataTransfer.types.includes("Files")) return;
                        setIsDraggingFile(true);
                    }}
                    onDragLeave={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) setIsDraggingFile(false);
                    }}
                    onDrop={handleFileDrop}
                    className={`${buttonClass} mt-5 flex w-full flex-col items-center gap-2 border-2 border-dashed px-4 py-5 enabled:hover:border-gray-500 enabled:hover:bg-gray-50 ${isDraggingFile ? "border-gray-700 bg-gray-100" : "border-gray-300"}`}
                >
                    <Upload size={20} aria-hidden="true" />
                    <span>{selectedFile ? "Choose another file" : "Choose a file or drag it here"}</span>
                    <span className="text-xs font-normal text-gray-600">{supportedFileTypes} · Up to 10 MB</span>
                </button>

                {selectedFile && (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                        <FileText size={20} className="shrink-0 text-gray-600" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-medium">{selectedFile.name}</p>
                            <p className="mt-1 text-xs text-gray-600">{formatFileSize(selectedFile.size)}</p>
                        </div>
                        <button
                            type="button"
                            aria-label="Remove selected file"
                            disabled={isUploading}
                            onClick={() => {
                                setFileSelection({ file: null, error: "" });
                                chooseFileRef.current?.focus();
                            }}
                            className={`${buttonClass} grid w-11 shrink-0 place-items-center enabled:hover:bg-gray-200`}
                        >
                            <X size={18} aria-hidden="true" />
                        </button>
                    </div>
                )}

                <div role="alert">
                    {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
                </div>
                <p role="status" className="sr-only">{isUploading && "Uploading document…"}</p>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isUploading}
                        className={`${buttonClass} border border-gray-300 bg-white px-4 enabled:hover:bg-gray-50`}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!selectedFile || isUploading}
                        className={`${buttonClass} inline-flex items-center justify-center gap-2 bg-gray-950 px-4 text-white enabled:hover:bg-gray-800`}
                    >
                        {isUploading && <LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true" />}
                        {isUploading ? "Uploading…" : "Upload"}
                    </button>
                </div>
            </form>
        </dialog>
    );
}
