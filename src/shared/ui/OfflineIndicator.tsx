import { WifiOff } from "lucide-react";
import React, { useEffect, useState } from "react";

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-red-500/90 text-white text-xs font-bold py-1 text-center backdrop-blur-sm flex items-center justify-center gap-2">
      <WifiOff size={12} /> Offline Modus Active - Features beperkt
    </div>
  );
};
