import { useNavigationStore } from "@shared/model/navigationStore";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import React from "react";
import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router-dom";

export const ErrorPage: React.FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const { sidebarOpen } = useNavigationStore();

  let errorMessage: string;
  let errorTitle: string;

  if (isRouteErrorResponse(error)) {
    // router-dom specific errors (404, etc)
    errorTitle = `${error.status} ${error.statusText}`;
    errorMessage =
      error.data?.message ||
      "De pagina die je zoekt bestaat niet of is verplaatst.";
  } else if (error instanceof Error) {
    // Generic JS errors
    errorTitle = "Applicatie Fout";
    errorMessage = error.message;
  } else {
    errorTitle = "Onbekende Fout";
    errorMessage = "Er is iets onverwachts misgegaan.";
  }

  return (
    <div
      className={`
            min-h-screen bg-obsidian-950 text-white flex items-center justify-center p-6
            ${sidebarOpen ? "md:pl-64" : "md:pl-20"} transition-all duration-300
        `}
    >
      <div className="max-w-md w-full bg-obsidian-900 border border-red-500/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold mb-2 text-white">{errorTitle}</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">{errorMessage}</p>

          <div className="flex w-full gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Opnieuw
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 bg-electric hover:bg-electric-glow text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-electric/20 flex items-center justify-center gap-2"
            >
              <Home size={18} />
              Dashboard
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 w-full">
            <p className="text-xs text-slate-600 font-mono">
              ERROR_CODE:{" "}
              {isRouteErrorResponse(error) ? error.status : "RUNTIME_EXCEPTION"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
