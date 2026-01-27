import { useEffect } from "react";

/**
 * Hook to forcefully remove the Three.js XR/VR button that sometimes
 * persists even when VR mode is off, cluttering the Elite UI.
 */
export const useGodSlayer = () => {
  useEffect(() => {
    const interval = setInterval(() => {
      const button =
        document.querySelector(".enve-xr-button") ||
        document.querySelector('button[title*="VR"]') ||
        document.querySelector('button[title*="XR"]');

      if (button) {
        button.remove();
        // We keep the interval for a bit to ensure it doesn't pop back in during late renders
      }
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 10000); // Stop after 10 seconds of trying

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);
};
