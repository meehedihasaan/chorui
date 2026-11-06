import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password / Chorui" },
      { name: "description", content: "Choose a new password for your account." },
      { property: "og:title", content: "Reset password / Chorui" },
      {
        property: "og:description",
        content: "Choose a new password for your account."
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRecovery =
    typeof window !== "undefined" &&
    window.location.hash.includes("type=recovery");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Password updated. You can now sign in with your new password.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-main-background text-light-primary dark:text-dark-primary">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-main-sidebar-background p-8"
      >
        <h1 className="text-2xl font-bold">Set a new password</h1>
        {isRecovery ? (
          <p className="text-sm text-light-secondary dark:text-dark-secondary">
            Pick a strong password for your account.
          </p>
        ) : (
          <p className="text-sm text-light-secondary dark:text-dark-secondary">
            This page works with a password reset link from your email.
          </p>
        )}
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="New password"
          className="rounded-md border border-light-border bg-main-background px-4 py-3 outline-none focus:ring-2 focus:ring-main-accent dark:border-dark-border"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-solid py-2"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
        {error && (
          <p className="text-sm text-accent-red" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-main-accent" role="status">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
