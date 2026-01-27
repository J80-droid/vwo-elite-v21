import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export const SomtodayCallback: React.FC = () => {
  const location = useLocation();
  // Compute initial state from URL params (synchronously)
  const [authResult] = useState(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (error) {
      return {
        status: "error" as const,
        message: `Fout bij verbinden: ${error}`,
      };
    }
    if (code && state) {
      return { status: "pending" as const, code, state };
    }
    return {
      status: "error" as const,
      message: "Ongeldige parameters ontvangen.",
    };
  });

  const [status, setStatus] = useState<"processing" | "success" | "error">(
    authResult.status === "pending" ? "processing" : authResult.status,
  );
  const [message, setMessage] = useState(
    authResult.status === "pending"
      ? "Verbinden met Somtoday..."
      : authResult.message,
  );

  useEffect(() => {
    if (authResult.status !== "pending") return;

    // Send to opener
    if (window.opener) {
      window.opener.postMessage(
        {
          type: "SOMTODAY_AUTH_CODE",
          code: authResult.code,
          state: authResult.state,
        },
        window.location.origin,
      );

      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: auth callback must update state after postMessage
      setStatus("success");
      setMessage("Succesvol verbonden! Je kunt dit venster sluiten.");

      // Close after brief delay
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      setStatus("error");
      setMessage(
        "Kon het hoofdvenster niet vinden. Sluit dit venster en probeer het opnieuw.",
      );
    }
  }, [authResult]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-obsidian-950 text-white p-6">
      <div className="bg-obsidian-900 border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="flex justify-center mb-6">
          {status === "processing" && (
            <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          )}
          {status === "success" && (
            <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
          )}
          {status === "error" && (
            <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold mb-2">Somtoday Elite</h2>
        <p
          className={`text-sm ${status === "error" ? "text-red-300" : "text-slate-400"}`}
        >
          {message}
        </p>

        {status === "error" && (
          <button
            onClick={() => window.close()}
            className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors"
          >
            Venster sluiten
          </button>
        )}
      </div>
    </div>
  );
};
