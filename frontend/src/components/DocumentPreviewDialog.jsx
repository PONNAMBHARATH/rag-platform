import { useEffect, useId, useState } from "react";
import { Download } from "lucide-react";
import { getDocumentPreview } from "../../services/document.service";
import { useModalDialog } from "../hooks/useModalDialog";
import { ACCEPTED_FILE_TYPES } from "../lib/documentFileTypes";

const actionClass = "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-semibold text-gray-900 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-60";
const TEXT_PREVIEW_BYTES = 50_000;

function SpreadsheetPreview({ sheets }) {
    const [sheetIndex, setSheetIndex] = useState(0);
    const sheet = sheets[sheetIndex];

    return (
        <>
            <label className="flex flex-wrap items-center gap-2 text-sm font-medium">
                Worksheet
                <select value={sheetIndex} onChange={(event) => setSheetIndex(Number(event.target.value))} className="max-w-full rounded-lg border border-gray-300 bg-white px-3 py-2">
                    {sheets.map(({ sheetName }, index) => <option key={sheetName} value={index}>{sheetName}</option>)}
                </select>
            </label>
            <p className="my-3 text-xs text-gray-600">
                Showing {sheet.rows.length} of {sheet.rowCount} data rows, up to 20 columns. Long values may be shortened.
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200" tabIndex={0} role="region" aria-label={`${sheet.sheetName} data`}>
                <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th scope="col" className="px-3 py-2">Row</th>
                            {sheet.columns.map(([number, label]) => <th scope="col" key={number} className="min-w-28 px-3 py-2">{label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {sheet.rows.map(({ rowNumber, values }) => (
                            <tr key={rowNumber} className="border-t border-gray-200">
                                <th scope="row" className="px-3 py-2 text-gray-600">{rowNumber}</th>
                                {sheet.columns.map(([number]) => <td key={number} className="max-w-72 wrap-anywhere px-3 py-2">{values[number]}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default function DocumentPreviewDialog({ document, onClose }) {
    const dialogRef = useModalDialog();
    const titleId = useId();
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [downloadError, setDownloadError] = useState("");
    const [downloading, setDownloading] = useState(false);
    const isPdf = document.file_type === ACCEPTED_FILE_TYPES.pdf;
    const isText = document.file_type === ACCEPTED_FILE_TYPES.txt;
    const { id, file_name: fileName } = document;

    useEffect(() => {
        const controller = new AbortController();
        let objectUrl;
        const load = async () => {
            try {
                const data = await getDocumentPreview(id, { signal: controller.signal, binary: isPdf || isText });
                const preview = isText
                    ? { text: await data.slice(0, TEXT_PREVIEW_BYTES).text(), truncated: data.size > TEXT_PREVIEW_BYTES }
                    : isPdf ? {} : data;

                if (controller.signal.aborted) return;
                if (isPdf || isText) objectUrl = URL.createObjectURL(data);
                setResult({ ...preview, objectUrl });
            } catch (requestError) {
                if (!controller.signal.aborted) setError(requestError.message || "Couldn’t load the preview.");
            }
        };
        load();
        return () => {
            controller.abort();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [id, isPdf, isText]);

    const downloadOriginal = async () => {
        if (downloading) return;
        setDownloading(true);
        setDownloadError("");
        try {
            const blob = await getDocumentPreview(id, { download: true });
            if (!dialogRef.current?.open) return;
            const url = URL.createObjectURL(blob);
            const link = window.document.createElement("a");
            link.href = url;
            link.download = fileName;
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
        } catch (requestError) {
            setDownloadError(requestError.message || "Couldn’t download the file.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-4xl rounded-2xl border border-gray-200 bg-white p-0 text-gray-900 shadow-xl backdrop:bg-black/40"
        >
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
                <h2 id={titleId} className="min-w-0 flex-1 wrap-anywhere text-base font-semibold">{fileName}</h2>
                <button type="button" autoFocus onClick={onClose} className={actionClass}>Close</button>
            </div>
            <div className="p-4">
                <div className="mb-3 flex flex-wrap gap-2">
                    {result?.objectUrl ? (
                        <a href={result.objectUrl} download={fileName} className={actionClass}><Download size={16} aria-hidden="true" /> Download original</a>
                    ) : (
                        <button type="button" onClick={downloadOriginal} disabled={downloading} className={actionClass}>
                            <Download size={16} aria-hidden="true" /> {downloading ? "Downloading…" : "Download original"}
                        </button>
                    )}
                    {isPdf && result?.objectUrl && (
                        <a href={result.objectUrl} target="_blank" rel="noopener noreferrer" className={actionClass}>Open PDF in new tab</a>
                    )}
                </div>
                {downloadError && <p role="alert" className="mb-3 text-sm text-red-800">{downloadError}</p>}
                {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
                {!result && !error && (
                    <div role="status" className="mx-auto max-w-xs space-y-3 py-8">
                        <p className="text-center text-sm text-gray-600">Preparing preview…</p>
                        <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                            <div className="h-full w-1/3 rounded-full bg-slate-700 motion-safe:animate-[preview-loading_1.4s_ease-in-out_infinite_alternate]" />
                        </div>
                    </div>
                )}
                {isPdf && result?.objectUrl && <iframe src={result.objectUrl} title={`PDF preview: ${fileName}`} className="h-[58dvh] w-full rounded-lg border border-gray-200" />}
                {result?.text !== undefined && (
                    <>
                        {result.truncated && <p className="mb-2 text-sm text-gray-600">Preview shortened. Download the original to see the full document.</p>}
                        <pre className="max-h-[55dvh] overflow-auto whitespace-pre-wrap wrap-anywhere rounded-lg bg-gray-50 p-4 text-sm">{result.text || "No text to preview."}</pre>
                    </>
                )}
                {result?.sheets?.length > 0 && <SpreadsheetPreview sheets={result.sheets} />}
            </div>
        </dialog>
    );
}
