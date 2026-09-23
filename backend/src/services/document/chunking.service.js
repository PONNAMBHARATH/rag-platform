const chunkText = (text, chunkSize = 500, overlap = 50) => {
    const words = text.split(/\s+/);

    const chunks = [];

    let start = 0;

    while (start < words.length) {
        const end = start + chunkSize;

        const chunkWords = words.slice(start, end);

        chunks.push({
            text: chunkWords.join(" "),
            chunkIndex: chunks.length,
        });

        start += chunkSize - overlap;
    }

    return chunks;
};

module.exports = {
    chunkText,
};