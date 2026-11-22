import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  signIn,
  signInWithGoogle,
  signUp,
} from "../../services/auth.service";

import AuthCard from "./AuthCard";
import { DeveloperFooter } from "./DeveloperCredit";
import PasswordField from "./PasswordField";
import { buttonClass, focusClass, inputClass, labelClass, primaryButtonClass } from "./authStyles";

function Auth() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const emailInputRef = useRef(null);
  const [isLogin, setIsLogin] = useState(true);
  const [pendingAction, setPendingAction] = useState(null);
  const [authError, setAuthError] = useState("");
  const [confirmation, setConfirmation] = useState(state?.passwordReset ? "Password updated. Sign in with your new password." : "");
  const isPending = pendingAction !== null;

  const submitLabel = isLogin ? "Sign in" : "Create account";
  const submitStatus = isLogin ? "Signing in…" : "Creating account…";
  const googleStatus = "Opening Google sign-in…";

  const clearFeedback = () => {
    setAuthError("");
    setConfirmation("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isPending) return;

    const fields = new FormData(event.currentTarget);
    const email = fields.get("email").trim();
    const password = fields.get("password");

    clearFeedback();
    setPendingAction("email");

    try {
      if (isLogin) {
        await signIn(email, password);
        navigate("/chat", { replace: true });
        return;
      }

      const { session } = await signUp(email, password);
      if (session) {
        navigate("/chat", { replace: true });
      } else {
        setConfirmation("Check your inbox for a confirmation link, then return here to sign in.");
      }
    } catch (error) {
      setAuthError(error.message || "Something went wrong. Please try again.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isPending) return;

    clearFeedback();
    setPendingAction("google");

    try {
      await signInWithGoogle();
    } catch {
      setAuthError("Google sign-in couldn’t start. Try again or sign in with email.");
      setPendingAction(null);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    clearFeedback();
  };

  return (
    <AuthCard
      title={isLogin ? "Sign in to RAG Platform" : "Create your account"}
      description="Upload documents and ask questions with cited answers."
      footer={<DeveloperFooter />}
    >
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isPending}
        className={`${buttonClass} border border-gray-300 bg-white text-gray-900 enabled:hover:bg-gray-50`}
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt=""
          className="size-5"
        />
        {pendingAction === "google" ? googleStatus : "Continue with Google"}
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-sm text-gray-600">or use email</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="auth-email" className={labelClass}>Email address</label>
          <input
            ref={emailInputRef}
            id="auth-email"
            name="email"
            type="email"
            autoComplete={isLogin ? "username" : "email"}
            autoCapitalize="none"
            spellCheck={false}
            required
            readOnly={isPending}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>

        <PasswordField
          key={isLogin ? "sign-in" : "sign-up"}
          label="Password"
          name="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          minLength={isLogin ? undefined : 6}
          readOnly={isPending}
          hint={isLogin ? undefined : "Use at least 6 characters."}
        />

        {isLogin && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => navigate("/forgot-password", { state: { email: emailInputRef.current.value } })}
            className={`min-h-11 rounded-sm text-sm font-semibold text-gray-950 underline underline-offset-4 enabled:cursor-pointer disabled:opacity-60 ${focusClass}`}
          >
            Forgot password?
          </button>
        )}

        <div role="alert" className={authError ? undefined : "sr-only"}>
          {authError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-5 text-red-800">
              {authError}
            </p>
          )}
        </div>

        <div role="status" className="sr-only">
          {pendingAction === "google" && googleStatus}
          {pendingAction === "email" && submitStatus}
        </div>
        <div role="status" className={confirmation ? undefined : "sr-only"}>
          {confirmation && (
            <p className="rounded-xl bg-green-50 px-4 py-3 text-sm leading-5 text-green-900">
              {confirmation}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={primaryButtonClass}
        >
          {pendingAction === "email" ? submitStatus : submitLabel}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2 text-sm text-gray-600">
        <span>{isLogin ? "New to RAG Platform?" : "Already have an account?"}</span>
        <button
          type="button"
          onClick={switchMode}
          disabled={isPending}
          className={`min-h-11 rounded-sm font-semibold text-gray-950 underline decoration-gray-400 underline-offset-4 enabled:cursor-pointer enabled:hover:decoration-current disabled:cursor-not-allowed disabled:opacity-60 ${focusClass}`}
        >
          {isLogin ? "Create an account" : "Sign in"}
        </button>
      </div>
    </AuthCard>
  );
}

export default Auth;
