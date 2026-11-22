import { Info, LogOut } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "../../services/auth.service";
import { useAuth } from "../context/AuthContext";
import { AboutPlatformDialog } from "./DeveloperCredit";

const accountActionClass = "mt-1 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-gray-800 enabled:cursor-pointer enabled:hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60";
const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900";

function getGooglePhoto(metadata, identity) {
    const urls = [identity?.picture, identity?.avatar_url, metadata?.avatar_url, metadata?.picture];
    for (const value of urls) {
        if (typeof value !== "string") continue;

        try {
            const url = new URL(value);
            if (url.protocol === "https:" && !url.username && !url.password) return url.href;
        } catch {
            continue;
        }
    }

    return null;
}

export default function AccountMenu() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const menuId = useId();
    const accountRef = useRef(null);
    const triggerRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [signOutError, setSignOutError] = useState("");
    const [failedPhotoUrl, setFailedPhotoUrl] = useState(null);

    const email = user?.email;
    const metadata = user?.user_metadata;
    const googleIdentity = user?.identities?.find(({ provider }) => provider === "google");
    const googleProfile = googleIdentity?.identity_data;
    const profileName = [metadata?.full_name, metadata?.name, googleProfile?.full_name, googleProfile?.name].find(
        (value) => typeof value === "string" && value.trim(),
    )?.trim();
    const accountName = profileName || email?.split("@")[0] || "Your account";
    const initials = accountName.split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase();
    const isGoogleAccount = Boolean(googleIdentity) || user?.app_metadata?.provider === "google";
    const photoUrl = isGoogleAccount ? getGooglePhoto(metadata, googleProfile) : null;

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event) => {
            if (!accountRef.current?.contains(event.target)) setIsOpen(false);
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [isOpen]);

    const handleSignOut = async () => {
        if (isSigningOut) return;

        setSignOutError("");
        setIsSigningOut(true);
        try {
            await signOut();
            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Logout failed:", error);
            setSignOutError("Couldn’t log out. Please try again.");
            setIsSigningOut(false);
        }
    };

    return (
        <div
            ref={accountRef}
            onBlur={(event) => {
                if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
            }}
            onKeyDown={(event) => {
                if (!isOpen || event.key !== "Escape") return;
                event.preventDefault();
                event.stopPropagation();
                setIsOpen(false);
                triggerRef.current?.focus();
            }}
            className="relative shrink-0"
        >
            <button
                ref={triggerRef}
                type="button"
                aria-label={`Account options for ${accountName}`}
                aria-expanded={isOpen}
                aria-controls={isOpen ? menuId : undefined}
                onClick={() => setIsOpen(!isOpen)}
                className={`grid size-11 cursor-pointer place-items-center rounded-full bg-slate-800 text-sm font-semibold text-white hover:bg-slate-700 aria-expanded:bg-slate-700 ${focusClass}`}
            >
                {photoUrl && photoUrl !== failedPhotoUrl ? (
                    <img
                        key={photoUrl}
                        src={photoUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={() => setFailedPhotoUrl(photoUrl)}
                        className="size-full rounded-full object-cover"
                    />
                ) : (
                    <span aria-hidden="true">{initials}</span>
                )}
            </button>

            {isOpen && (
                <section
                    id={menuId}
                    aria-label="Account"
                    className="absolute top-full right-0 z-20 mt-2 max-h-[55dvh] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg"
                >
                    <div className="border-b border-gray-200 px-3 py-3">
                        <h2 className="text-xs font-medium text-gray-600">Signed in as</h2>
                        <p className="mt-1 text-sm font-semibold text-gray-950 wrap-anywhere">{accountName}</p>
                        {email && <p className="mt-1 text-xs text-gray-600 wrap-anywhere">{email}</p>}
                    </div>
                    <button
                        type="button"
                        aria-haspopup="dialog"
                        onClick={() => {
                            triggerRef.current?.focus({ preventScroll: true });
                            setIsOpen(false);
                            setIsAboutOpen(true);
                        }}
                        className={`${accountActionClass} ${focusClass}`}
                    >
                        <Info size={17} aria-hidden="true" />
                        About RAG Platform
                    </button>
                    <button
                        type="button"
                        disabled={isSigningOut}
                        onClick={handleSignOut}
                        className={`${accountActionClass} ${focusClass}`}
                    >
                        <LogOut size={17} aria-hidden="true" />
                        {isSigningOut ? "Logging out…" : "Log out"}
                    </button>
                    {signOutError && <p role="alert" className="px-3 py-2 text-xs text-red-800">{signOutError}</p>}
                </section>
            )}
            {isAboutOpen && (
                <AboutPlatformDialog onClose={() => setIsAboutOpen(false)} returnFocusRef={triggerRef} />
            )}
        </div>
    );
}
