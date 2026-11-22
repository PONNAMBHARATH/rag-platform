import { ArrowUp, LoaderCircle } from "lucide-react";
import { useId, useLayoutEffect } from "react";

export default function ChatComposer({
    inputRef,
    question,
    onQuestionChange,
    onSubmit,
    isLoadingConversation,
    isSending,
    sendError,
}) {
    const hintId = useId();
    const canSend = !isSending && !isLoadingConversation && Boolean(question.trim());
    const draft = isSending ? "" : question;

    useLayoutEffect(() => {
        const input = inputRef.current;
        input.style.height = "auto";
        input.style.height = `${input.scrollHeight}px`;
    }, [draft, inputRef]);

    const handleKeyDown = (event) => {
        if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229) {
            return;
        }

        event.preventDefault();
        if (!event.repeat && canSend) event.currentTarget.form.requestSubmit();
    };

    return (
        <footer className="shrink-0 border-t border-gray-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6">
            <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
                <div role="alert">
                    {sendError && (
                        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                            {sendError}
                        </p>
                    )}
                </div>
                <div className="flex items-end gap-2 rounded-2xl border border-gray-300 bg-white p-2 focus-within:border-gray-500 sm:gap-3 sm:p-3">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={draft}
                        onChange={(event) => onQuestionChange(event.target.value)}
                        onKeyDown={handleKeyDown}
                        aria-label="Question about your documents"
                        aria-describedby={hintId}
                        enterKeyHint="send"
                        readOnly={isSending}
                        placeholder="Ask a question about your documents…"
                        className="block max-h-[min(9rem,calc(var(--workspace-height,100dvh)*0.3))] min-h-11 min-w-0 flex-1 resize-none rounded-xl py-2.5 pl-2 pr-1 text-base leading-6 text-gray-950 outline-none placeholder:text-gray-600"
                    />
                    <button
                        type="submit"
                        disabled={!canSend}
                        aria-label={isSending ? "Sending" : "Send question"}
                        className="inline-flex h-11 w-20 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gray-950 text-sm font-semibold text-white enabled:cursor-pointer enabled:hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-50 sm:w-24"
                    >
                        {isSending ? (
                            <LoaderCircle size={16} aria-hidden="true" className="motion-safe:animate-spin" />
                        ) : (
                            <ArrowUp size={16} aria-hidden="true" />
                        )}
                        <span>{isSending ? "Sending" : "Send"}</span>
                    </button>
                </div>
                <p id={hintId} className="sr-only">
                    Enter to send · Shift+Enter for a new line
                </p>
                <p role="status" className="sr-only">{isSending && "Sending your question…"}</p>
            </form>
        </footer>
    );
}
