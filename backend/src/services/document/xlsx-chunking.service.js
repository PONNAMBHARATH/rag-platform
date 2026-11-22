// Use the sentence encoder's published input budget, including special tokens.
const MAX_EMBEDDING_TOKENS = 256;

const chunkWorkbookRows = (worksheets, tokenizer) => {
    const chunks = [];
    const tokenLimit = Math.min(MAX_EMBEDDING_TOKENS, tokenizer.model_max_length ?? Infinity);
    const fits = (text) => tokenizer.encode(text).length <= tokenLimit;

    for (const { sheetName, rows } of worksheets) {
        const heading = `Sheet: ${sheetName}\n`;
        let text = heading;
        let startRow;
        let endRow;

        const addChunk = (content, firstRow, lastRow) => {
            chunks.push({
                text: content,
                chunkIndex: chunks.length,
                spreadsheetLocation: { sheetName, startRow: firstRow, endRow: lastRow },
            });
        };

        for (const row of rows) {
            const rowLabel = `Row ${row.rowNumber} | `;
            const rowText = rowLabel + row.text;
            const candidate = startRow === undefined ? heading + rowText : `${text}\n${rowText}`;

            if (fits(candidate)) {
                text = candidate;
                startRow ??= row.rowNumber;
                endRow = row.rowNumber;
                continue;
            }

            if (startRow !== undefined) addChunk(text, startRow, endRow);
            if (fits(heading + rowText)) {
                text = heading + rowText;
                startRow = endRow = row.rowNumber;
                continue;
            }

            // Keep the sheet and row citation on every segment of an unusually wide row.
            const prefix = heading + rowLabel;
            const characters = Array.from(row.text);
            let start = 0;
            while (start < characters.length) {
                let min = start + 1;
                let max = Math.min(characters.length, start + tokenLimit * 8);
                let end = start;
                while (min <= max) {
                    const middle = Math.floor((min + max) / 2);
                    if (fits(prefix + characters.slice(start, middle).join(""))) {
                        end = middle;
                        min = middle + 1;
                    } else {
                        max = middle - 1;
                    }
                }

                if (end === start) throw new Error("An Excel row label exceeds the embedding input limit.");
                addChunk(prefix + characters.slice(start, end).join(""), row.rowNumber, row.rowNumber);
                start = end;
            }

            text = heading;
            startRow = endRow = undefined;
        }

        if (startRow !== undefined) addChunk(text, startRow, endRow);
    }

    return chunks;
};

module.exports = { chunkWorkbookRows };
