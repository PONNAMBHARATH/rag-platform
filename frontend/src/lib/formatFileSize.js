export function formatFileSize(bytes) {
    if (!bytes) {
        return "0 B";
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    const kb = bytes / 1024;

    if (kb < 1024) {
        return `${Math.round(kb)} KB`;
    }

    return `${(kb / 1024).toFixed(1)} MB`;
}
