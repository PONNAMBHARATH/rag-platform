import { FileSpreadsheet, FileText } from "lucide-react";
import { ACCEPTED_FILE_TYPES } from "../lib/documentFileTypes";

const fileLabels = Object.fromEntries(
    Object.entries(ACCEPTED_FILE_TYPES).map(([extension, mimeType]) => [mimeType, extension.toUpperCase()])
);

const DocumentFileIcon = ({ fileType }) => {
    const fileLabel = Object.hasOwn(fileLabels, fileType) ? fileLabels[fileType] : "FILE";
    const Icon = fileType === ACCEPTED_FILE_TYPES.xlsx ? FileSpreadsheet : FileText;

    return (
        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-gray-100">
            <Icon size={20} className="text-gray-600" aria-hidden="true" />

            <span className="text-[8px] font-bold text-gray-500">
                {fileLabel}
            </span>
        </div>
    );
};

export default DocumentFileIcon;