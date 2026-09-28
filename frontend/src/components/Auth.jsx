import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signIn,
  signInWithGoogle,
  signUp,
} from "../../services/auth.service";

function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        navigate("/chat", { replace: true });
      } else {
        await signUp(email, password);

        setMessage(
          "Registration successful. Check your email if confirmation is required."
        );
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setMessage("");
    setLoadingProvider("google");

    try {
      await signInWithGoogle();
    } catch (error) {
      setError(error.message);
      setLoadingProvider("");
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-center text-2xl font-semibold text-gray-900">
          RAG Platform
        </h1>

        <p className="mt-2 text-center text-sm text-gray-500">
          {isLogin ? "Sign in to your account" : "Create your account"}
        </p>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || Boolean(loadingProvider)}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt=""
              aria-hidden="true"
              className="size-5"
            />
            {loadingProvider === "google"
              ? "Connecting to Google..."
              : "Continue with Google"}
          </button>
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-medium uppercase text-gray-400">
            Or use email
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || Boolean(loadingProvider)}
            className="w-full rounded-lg bg-black py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : isLogin
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setMessage("");
            }}
            className="text-sm font-medium text-gray-700 hover:text-black"
          >
            {isLogin
              ? "Don't have an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;