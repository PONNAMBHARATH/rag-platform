const buildContext = (results) => {
    return results
        .map((result, index) => {
            const { payload } = result;
            const location = payload.spreadsheetLocation;
            const spreadsheetContext = location
                ? `Worksheet: ${location.sheetName}\nRows: ${location.startRow}–${location.endRow}\n`
                : "";

            return `Source ${index + 1}
File: ${payload.fileName}
Chunk: ${payload.chunkIndex}
${spreadsheetContext}Content:
${payload.text}`;
        })
        .join("\n\n");
};

module.exports = {
    buildContext,
};