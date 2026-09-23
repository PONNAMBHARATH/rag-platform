const cleanText = (text) => {
    if (!text) {
        return "";
    }

    return text
        // Normalize line endings
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")

        // Replace tabs with spaces
        .replace(/\t+/g, " ")

        // Remove trailing spaces from each line
        .replace(/[ \t]+$/gm, "")

        // Reduce multiple spaces
        .replace(/[ ]{2,}/g, " ")

        // Reduce excessive blank lines
        .replace(/\n{3,}/g, "\n\n")

        // Remove whitespace at beginning/end
        .trim();
};

module.exports = {
    cleanText,
};