import { ArrowUpRight, Files, Upload } from "lucide-react";
import { Link } from "react-router-dom";

const exampleQuestions = [
    "Summarize the key points.",
    "What dates or deadlines are mentioned?",
    "What action items are mentioned?",
];

const actionClass = "inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900";

export default function ChatEmptyState({ onSelectQuestion }) {
    return (
        <section
            aria-labelledby="new-chat-heading"
            className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center py-6 text-center sm:py-10"
        >
            <div className="mb-5 grid size-12 place-items-center rounded-xl bg-gray-950 text-white">
                <Files className="size-5" aria-hidden="true" />
            </div>
            <h2 id="new-chat-heading" className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
                Ask your documents
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-600">
                Upload a document, then ask a question to get an answer with sources.
            </p>
            <Link
                to="/documents"
                state={{ openUploadDialog: true }}
                className={`${actionClass} mt-5 bg-gray-950 text-white hover:bg-gray-800`}
            >
                <Upload className="size-4" aria-hidden="true" />
                Upload a document
            </Link>

            <div className="mt-8 w-full">
                <p className="mb-3 text-sm font-medium text-gray-700">Try an example question</p>
                <ul className="flex flex-wrap justify-center gap-2">
                    {exampleQuestions.map((question) => (
                        <li key={question}>
                            <button
                                type="button"
                                onClick={() => onSelectQuestion(question)}
                                className={`${actionClass} cursor-pointer border border-gray-200 bg-white text-gray-800 hover:border-gray-400 hover:bg-gray-100`}
                            >
                                {question}
                                <ArrowUpRight className="size-4 shrink-0 text-gray-500" aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
