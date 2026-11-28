const ExcelJS = require("exceljs");
const yauzl = require("yauzl");

const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX_EXPANDED_BYTES = 32 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 512;
const MAX_WORKSHEETS = 20;
const MAX_ROWS = 10_000;
const MAX_CELLS = 100_000;
const MAX_TEXT_LENGTH = 1_000_000;

const validateWorkbookArchive = (buffer) => new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (error, archive) => {
        if (error) {
            reject(error);
            return;
        }

        const fail = (archiveError) => {
            archive.close();
            reject(archiveError);
        };

        if (archive.entryCount > MAX_ARCHIVE_ENTRIES) {
            fail(new Error("The workbook contains too many archive entries."));
            return;
        }

        let expandedBytes = 0;
        archive.on("error", fail);
        archive.once("end", resolve);
        archive.on("entry", (entry) => {
            expandedBytes += entry.uncompressedSize;
            if (expandedBytes > MAX_EXPANDED_BYTES) {
                fail(new Error("The workbook exceeds the expanded size limit."));
                return;
            }

            archive.openReadStream(entry, (streamError, stream) => {
                if (streamError) {
                    fail(streamError);
                    return;
                }

                // yauzl validates each reported entry size as the stream is read.
                stream.once("error", fail);
                stream.once("end", () => archive.readEntry());
                stream.resume();
            });
        });
        archive.readEntry();
    });
});

const getCellText = (cell) => {
    const value = cell.type === ExcelJS.ValueType.Formula ? cell.result : cell.value;
    if (value instanceof Date) return value.toISOString();
    if (cell.type === ExcelJS.ValueType.Formula) {
        return value == null ? "" : String(value.error ?? value).replace(/\s+/g, " ").trim();
    }

    return cell.text.replace(/\s+/g, " ").trim();
};

const extractXlsxText = async (buffer, { includePreview = false } = {}) => {
    await validateWorkbookArchive(buffer);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    if (workbook.worksheets.length > MAX_WORKSHEETS) {
        throw new Error("The workbook exceeds the worksheet limit.");
    }

    const worksheets = [];
    const previewSheets = [];
    const lines = [];
    let rowCount = 0;
    let cellCount = 0;
    let textLength = 0;

    for (const worksheet of workbook.worksheets) {
        if (worksheet.state !== "visible") continue;

        const rows = [];
        const previewRows = [];
        const previewColumns = new Map();
        let headers;
        worksheet.eachRow((row, rowNumber) => {
            rowCount++;
            if (rowCount > MAX_ROWS) throw new Error("The workbook exceeds the row limit.");

            const cells = [];
            row.eachCell((cell, columnNumber) => {
                cellCount++;
                if (cellCount > MAX_CELLS) throw new Error("The workbook exceeds the cell limit.");

                const value = getCellText(cell);
                if (value) cells.push({ columnNumber, label: cell.address.replace(/\d+$/, ""), value });
            });

            if (!cells.length) return;
            if (!headers) {
                headers = new Map(cells.map(({ columnNumber, value }) => [columnNumber, value]));
                return;
            }

            const values = cells.map(({ columnNumber, label, value }) => `${headers.get(columnNumber) || label}: ${value}`);
            const text = values.join(" | ");
            const line = `Sheet: ${worksheet.name} | Row ${rowNumber} | ${text}`;
            textLength += line.length + 1;
            if (textLength > MAX_TEXT_LENGTH) throw new Error("The workbook exceeds the extracted text limit.");
            lines.push(line);
            rows.push({ rowNumber, text });
            if (includePreview && previewRows.length < 50) {
                const valuesByColumn = {};
                for (const { columnNumber, label, value } of cells) {
                    if (!previewColumns.has(columnNumber) && previewColumns.size < 20) {
                        previewColumns.set(columnNumber, (headers.get(columnNumber) || label).slice(0, 120));
                    }
                    if (previewColumns.has(columnNumber)) valuesByColumn[columnNumber] = value.slice(0, 240);
                }
                previewRows.push({ rowNumber, values: valuesByColumn });
            }
        });
        if (rows.length) {
            worksheets.push({ sheetName: worksheet.name, rows });
            if (includePreview) {
                previewSheets.push({
                    sheetName: worksheet.name,
                    columns: [...previewColumns].sort(([left], [right]) => left - right),
                    rows: previewRows,
                    rowCount: rows.length,
                });
            }
        }
    }

    if (!lines.length) throw new Error("No Excel data rows found after the header rows.");
    return { text: lines.join("\n"), worksheets, ...(includePreview && { previewSheets }) };
};

module.exports = { XLSX_MIME_TYPE, extractXlsxText };
