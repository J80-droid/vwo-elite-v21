import { use } from "react";

// Mock API Promise (simulating network request)
// In a real app, this would be a cached resource or query
const settingsPromise = new Promise<{
  theme: "light" | "dark";
  notifications: boolean;
}>((resolve) => {
  setTimeout(() => {
    resolve({ theme: "dark", notifications: true });
  }, 1000);
});

export function useUserSettings() {
  // React 19: 'use' unwrap promise, suspending if pending
  const settings = use(settingsPromise);
  return settings;
}
