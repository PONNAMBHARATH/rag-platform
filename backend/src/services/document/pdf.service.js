const { PDFParse } = require("pdf-parse");

const extractPdfText = async (buffer) => {
    const parser = new PDFParse({
        data: buffer,
    });

    try {
        const result = await parser.getText();

        return {
            text: result.text,
        };
    } finally {
        await parser.destroy();
    }
};

module.exports = {
    extractPdfText,
};