import { useState } from "react";
import { signIn, signUp } from "../../services/auth.service";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-white text-center">
          RAG Platform
        </h1>

        <p className="mt-2 text-center text-slate-400">
          {isLogin ? "Sign in to your account" : "Create your account"}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block mb-2 text-sm text-slate-300">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-slate-300">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}

          {message && (
            <p className="text-sm text-green-400">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
            className="text-sm text-blue-400 hover:text-blue-300"
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