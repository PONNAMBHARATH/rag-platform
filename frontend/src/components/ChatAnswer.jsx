import { Check, ChevronDown, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownPlugins = [remarkGfm];
const markdownComponents = {
    table: ({ children }) => (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse text-left text-sm">{children}</table>
        </div>
    ),
};

function AnswerSources({ sources }) {
    if (!sources?.length) return null;

    return (
        <details className="group mt-4 border-t border-gray-200 pt-3">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-gray-900 [&::-webkit-details-marker]:hidden">
                Sources ({sources.length})
                <ChevronDown size={16} aria-hidden="true" className="group-open:rotate-180" />
            </summary>
            <ol className="mt-2 space-y-2">
                {sources.map((source, index) => (
                    <li key={index} className="flex gap-2 rounded-lg bg-gray-50 p-3">
                        <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-md bg-gray-200 text-xs font-semibold text-gray-800">
                            {index + 1}
                        </span>
                        <div className="min-w-0 wrap-anywhere">
                            <p className="text-sm font-medium text-gray-900">{source.fileName || "Untitled document"}</p>
                            {source.spreadsheetLocation && (
                                <p className="mt-1 text-xs font-medium text-gray-600">
                                    {source.spreadsheetLocation.sheetName} · {source.spreadsheetLocation.startRow === source.spreadsheetLocation.endRow
                                        ? `row ${source.spreadsheetLocation.startRow}`
                                        : `rows ${source.spreadsheetLocation.startRow}–${source.spreadsheetLocation.endRow}`}
                                </p>
                            )}
                            {source.snippet && <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-gray-700">{source.snippet}</p>}
                        </div>
                    </li>
                ))}
            </ol>
        </details>
    );
}

export default function ChatAnswer({ content, sources }) {
    const [copyStatus, setCopyStatus] = useState("");
    const resetCopyTimer = useRef(null);

    useEffect(() => () => window.clearTimeout(resetCopyTimer.current), []);

    const handleCopy = async () => {
        window.clearTimeout(resetCopyTimer.current);
        try {
            await navigator.clipboard.writeText(content);
            setCopyStatus("copied");
            resetCopyTimer.current = window.setTimeout(() => setCopyStatus(""), 2000);
        } catch {
            setCopyStatus("failed");
        }
    };

    return (
        <div className="max-w-full min-w-0 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-800 sm:max-w-[85%]">
            <div className="chat-answer-content wrap-anywhere text-sm leading-6 sm:text-base sm:leading-7">
                <Markdown skipHtml disallowedElements={["img"]} remarkPlugins={markdownPlugins} components={markdownComponents}>
                    {content}
                </Markdown>
            </div>
            <AnswerSources sources={sources} />
            <div className="mt-2 flex flex-wrap items-center gap-x-2">
                <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-gray-900"
                >
                    {copyStatus === "copied" ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    {copyStatus === "copied" ? "Copied" : "Copy answer"}
                </button>
                <span role="status" className={copyStatus === "failed" ? "text-xs text-red-800" : "sr-only"}>
                    {copyStatus === "copied" && "Answer copied to clipboard."}
                    {copyStatus === "failed" && "Couldn’t copy the answer. Try selecting the text to copy it."}
                </span>
            </div>
        </div>
    );
}
