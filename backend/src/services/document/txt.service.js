const extractTxtText = (buffer) => {
    return {
        text: buffer.toString("utf-8"),
    };
};

module.exports = {
    extractTxtText,
};