import { Maximize2, Minus, X } from "lucide-react";
import React, { useEffect, useState } from "react";

export const WindowControls: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check initial state
    if (window.vwoApi?.invoke) {
      window.vwoApi
        .invoke("window:is-maximized")
        .then((maximized: unknown) => setIsMaximized(!!maximized));
    }
  }, []);

  const handleMinimize = () => {
    window.vwoApi?.invoke("window:minimize");
  };

  const handleMaximize = () => {
    window.vwoApi?.invoke("window:maximize");
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.vwoApi?.invoke("window:close");
  };

  return (
    <div className="flex items-center gap-2 no-drag group">
      {/* Close - Red */}
      <button
        onClick={handleClose}
        className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] flex items-center justify-center hover:bg-[#FF5F56]/80 transition-all shadow-[0_0_10px_rgba(255,95,86,0.2)]"
        aria-label="Close"
      >
        <X
          size={8}
          className="text-[#4c0002] opacity-0 group-hover:opacity-100 transition-opacity font-bold"
          strokeWidth={4}
        />
      </button>

      {/* Minimize - Yellow */}
      <button
        onClick={handleMinimize}
        className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] flex items-center justify-center hover:bg-[#FFBD2E]/80 transition-all shadow-[0_0_10px_rgba(255,189,46,0.2)]"
        aria-label="Minimize"
      >
        <Minus
          size={8}
          className="text-[#5c3c00] opacity-0 group-hover:opacity-100 transition-opacity font-bold"
          strokeWidth={4}
        />
      </button>

      {/* Maximize - Green */}
      <button
        onClick={handleMaximize}
        className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] flex items-center justify-center hover:bg-[#27C93F]/80 transition-all shadow-[0_0_10px_rgba(39,201,63,0.2)]"
        aria-label="Maximize"
      >
        {isMaximized ? (
          <Maximize2
            size={6}
            className="text-[#004d0f] opacity-0 group-hover:opacity-100 transition-opacity font-bold"
            strokeWidth={4}
          />
        ) : (
          <Maximize2
            size={6}
            className="text-[#004d0f] opacity-0 group-hover:opacity-100 transition-opacity font-bold"
            strokeWidth={4}
          />
        )}
      </button>
    </div>
  );
};
