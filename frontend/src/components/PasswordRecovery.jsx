import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { requestPasswordReset, updatePassword, signOut } from "../../services/auth.service";
import AuthCard from "./AuthCard";
import PasswordField from "./PasswordField";
import { focusClass, inputClass, labelClass, primaryButtonClass } from "./authStyles";

const recoveryLinkClass = `inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-gray-950 underline underline-offset-4 ${focusClass}`;

function RecoveryFeedback({ error, confirmation }) {
  return (
    <>
      <div role="alert" className={error ? "rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" : "sr-only"}>
        {error}
      </div>
      <div role="status" className={confirmation ? "rounded-xl bg-green-50 px-4 py-3 text-sm text-green-900" : "sr-only"}>
        {confirmation}
      </div>
    </>
  );
}

export function ForgotPassword() {
  const { state } = useLocation();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSending) return;

    const email = new FormData(event.currentTarget).get("email").trim();
    setIsSending(true);
    setError("");
    setConfirmation("");
    try {
      await requestPasswordReset(email);
      setConfirmation("If an account exists for that address, you’ll receive a reset link. Check your spam folder if it doesn’t arrive.");
    } catch (requestError) {
      setError(requestError.status === 429
        ? "Too many requests. Wait a moment before trying again."
        : "Couldn’t send a reset link right now. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthCard title="Reset your password" description="Enter the email address you use to sign in.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className={labelClass} htmlFor="recovery-email">Email address</label>
          <input
            id="recovery-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={typeof state?.email === "string" ? state.email : ""}
            required
            readOnly={isSending}
            className={inputClass}
          />
        </div>
        <RecoveryFeedback error={error} confirmation={confirmation} />
        <button className={primaryButtonClass} disabled={isSending}>
          {isSending ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <Link to="/login" className={`${recoveryLinkClass} mt-3`}>Back to sign in</Link>
    </AuthCard>
  );
}

export function ResetPassword({ isRecoverySession }) {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if ((!isRecoverySession && !passwordUpdated) || isSaving) return;

    const values = new FormData(event.currentTarget);
    const password = values.get("password");
    if (!passwordUpdated && password !== values.get("confirmPassword")) {
      setError("The passwords don’t match.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      if (!passwordUpdated) {
        await updatePassword(password);
        setPasswordUpdated(true);
      }
      if (isRecoverySession) await signOut({ scope: "local" });
      navigate("/login", { replace: true, state: { passwordReset: true } });
    } catch (resetError) {
      setError(resetError.message || "Couldn’t finish resetting your password. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const cancelRecovery = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setError("");
    try {
      await signOut({ scope: "local" });
      navigate("/login", { replace: true });
    } catch {
      setError("Couldn’t end this reset session. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isRecoverySession && !passwordUpdated) {
    return (
      <AuthCard title="Reset link unavailable" description="This link may have expired or already been used. Request a new link to reset your password.">
        <Link to="/forgot-password" className={primaryButtonClass}>Request a new link</Link>
        <Link to="/login" className={`${recoveryLinkClass} mt-3`}>Back to sign in</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={passwordUpdated ? "Password updated" : "Set a new password"}
      description={passwordUpdated ? "Return to sign-in to use your new password." : "Choose a new password for your account."}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {!passwordUpdated && (
          <>
            <PasswordField label="New password" name="password" autoComplete="new-password" minLength={6} readOnly={isSaving} hint="Use at least 6 characters." />
            <PasswordField label="Confirm new password" name="confirmPassword" autoComplete="new-password" minLength={6} readOnly={isSaving} />
          </>
        )}
        <RecoveryFeedback error={error} />
        <button className={primaryButtonClass} disabled={isSaving}>
          {isSaving ? "Please wait…" : passwordUpdated ? "Return to sign in" : "Update password"}
        </button>
      </form>
      {!passwordUpdated && (
        <button type="button" onClick={cancelRecovery} disabled={isSaving} className={`${recoveryLinkClass} mt-3 enabled:cursor-pointer disabled:opacity-60`}>
          Cancel and return to sign in
        </button>
      )}
    </AuthCard>
  );
}
