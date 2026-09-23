const buildContext = (results) => {
    return results
        .map((result, index) => {
            const { payload } = result;

            return `Source ${index + 1}
File: ${payload.fileName}
Chunk: ${payload.chunkIndex}
Content:
${payload.text}`;
        })
        .join("\n\n");
};

module.exports = {
    buildContext,
};