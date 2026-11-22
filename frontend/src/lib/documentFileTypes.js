export const ACCEPTED_FILE_TYPES = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
export const fileInputAccept = Object.keys(ACCEPTED_FILE_TYPES).map((extension) => `.${extension}`).join(",");
export const supportedFileTypes = "PDF, DOCX, TXT, or XLSX";
