const mammoth = require("mammoth");

const extractDocxText = async (buffer) => {
    const result = await mammoth.extractRawText({
        buffer,
    });

    return {
        text: result.value,
    };
};

module.exports = {
    extractDocxText,
};