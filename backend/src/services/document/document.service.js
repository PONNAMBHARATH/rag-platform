const { extractPdfText } = require("./pdf.service");
const { extractDocxText } = require("./docx.service");
const { extractTxtText } = require("./txt.service");

const extractDocumentText = async (file) => {
    if (file.mimetype === "application/pdf") {
        return extractPdfText(file.buffer);
    }

    if (
        file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
        return extractDocxText(file.buffer);
    }

    if (file.mimetype === "text/plain") {
        return extractTxtText(file.buffer);
    }

    throw new Error("Unsupported document type");
};

module.exports = {
    extractDocumentText,
};