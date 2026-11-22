import { ArrowUpRight } from "lucide-react";
import { useId } from "react";
import { useModalDialog } from "../hooks/useModalDialog";

const developerName = "Bharath Ponnam";
const developerLinkedIn = "https://in.linkedin.com/in/bharath-kumar-ponnam-432127207";
const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900";

function DeveloperLink({ children }) {
    return (
        <a
            href={developerLinkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 rounded-sm font-semibold text-gray-800 underline decoration-gray-400 underline-offset-4 hover:text-gray-950 ${focusClass}`}
        >
            {children}
            <ArrowUpRight size={14} aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
        </a>
    );
}

export function DeveloperFooter() {
    return (
        <footer className="text-center text-xs text-gray-600">
            <DeveloperLink>Built by {developerName}</DeveloperLink>
        </footer>
    );
}

export function AboutPlatformDialog({ onClose, returnFocusRef }) {
    const dialogRef = useModalDialog(true, returnFocusRef);
    const titleId = useId();
    const copyrightYear = new Date().getFullYear();

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 text-gray-950 shadow-xl backdrop:bg-black/40"
        >
            <h2 id={titleId} className="text-lg font-semibold">About RAG Platform</h2>
            <p className="mt-3 text-sm leading-6 text-gray-700">
                Designed and developed by <strong className="text-gray-950">{developerName}</strong>.
                {" "}Feel free to reach out with questions or feedback.
            </p>
            <p className="mt-3 text-sm">
                <DeveloperLink>Connect on LinkedIn</DeveloperLink>
            </p>
            <p className="mt-5 border-t border-gray-200 pt-4 text-xs text-gray-600">
                © {copyrightYear} {developerName}. All rights reserved.
            </p>
            <div className="mt-5 flex justify-end">
                <button
                    type="button"
                    autoFocus
                    onClick={onClose}
                    className={`min-h-11 cursor-pointer rounded-lg border border-gray-300 px-4 text-sm font-semibold hover:bg-gray-50 ${focusClass}`}
                >
                    Close
                </button>
            </div>
        </dialog>
    );
}
