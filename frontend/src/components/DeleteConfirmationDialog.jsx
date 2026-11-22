import { useId, useState } from "react";
import { useModalDialog } from "../hooks/useModalDialog";

const buttonClass = "min-h-11 rounded-lg px-4 text-sm font-semibold enabled:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-60";

export default function DeleteConfirmationDialog({ title, description, onCancel, onDelete }) {
    const dialogRef = useModalDialog();
    const titleId = useId();
    const descriptionId = useId();
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const handleDelete = async () => {
        if (isDeleting) return;

        setDeleteError("");
        setIsDeleting(true);

        try {
            await onDelete();
            onCancel();
        } catch (error) {
            console.error("Delete failed:", error);
            setDeleteError("Couldn’t delete this item. Please try again.");
            setIsDeleting(false);
        }
    };

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onCancel={(event) => {
                event.preventDefault();
                if (!isDeleting) onCancel();
            }}
            className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-gray-950 shadow-xl backdrop:bg-black/40"
        >
            <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
            <p id={descriptionId} className="mt-2 break-words text-sm leading-6 text-gray-600">
                {description}
            </p>
            <div role="alert">
                {deleteError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{deleteError}</p>}
            </div>
            <p role="status" className="sr-only">{isDeleting && "Deleting…"}</p>
            <div className="mt-6 flex justify-end gap-3">
                <button
                    type="button"
                    autoFocus
                    onClick={onCancel}
                    disabled={isDeleting}
                    className={`${buttonClass} border border-gray-300 bg-white enabled:hover:bg-gray-50`}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={`${buttonClass} bg-red-700 text-white enabled:hover:bg-red-800`}
                >
                    {isDeleting ? "Deleting…" : "Delete"}
                </button>
            </div>
        </dialog>
    );
}
