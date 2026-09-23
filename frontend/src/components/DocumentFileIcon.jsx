import { FileText } from "lucide-react";

const DocumentFileIcon = ({ fileType }) => {
    const getFileType = () => {
        if (fileType === "application/pdf") {
            return "PDF";
        }

        if (
            fileType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            return "DOCX";
        }

        if (fileType === "text/plain") {
            return "TXT";
        }

        return "FILE";
    };

    return (
        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-gray-100">
            <FileText size={20} className="text-gray-600" />

            <span className="text-[8px] font-bold text-gray-500">
                {getFileType()}
            </span>
        </div>
    );
};

export default DocumentFileIcon;