import { Files } from "lucide-react";

export default function AuthCard({ title, description, footer, children }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-gray-50 px-4 py-8 sm:py-12">
      <section
        aria-labelledby="auth-heading"
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9"
      >
        <header className="mb-7">
          <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-gray-950 text-white">
            <Files className="size-5" aria-hidden="true" />
          </div>
          <h1 id="auth-heading" className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            {description}
          </p>
        </header>

        {children}
      </section>
      {footer}
    </main>
  );
}
