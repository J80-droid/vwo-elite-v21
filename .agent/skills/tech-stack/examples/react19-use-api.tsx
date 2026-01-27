/**
 * Example: React 19 `use` API for Data Fetching
 *
 * This demonstrates the modern pattern for fetching data in React 19.
 * DO NOT use useEffect for data fetching.
 */

import { Suspense, use } from "react";

// Create a cached resource (in real app, use TanStack Query or similar)
const createResource = <T,>(promise: Promise<T>) => {
  let status: "pending" | "success" | "error" = "pending";
  let result: T;
  let error: Error;

  const suspender = promise.then(
    (data) => {
      status = "success";
      result = data;
    },
    (err) => {
      status = "error";
      error = err;
    },
  );

  return {
    read(): T {
      if (status === "pending") throw suspender;
      if (status === "error") throw error;
      return result;
    },
  };
};

// Example: API call wrapped in a resource
const userResource = createResource(
  fetch("/api/user").then((res) => res.json()),
);

// Component that uses the resource
function UserProfile() {
  // React 19: `use` unwraps the resource, suspending if pending
  const user = use(userResource.read());

  return (
    <div className="p-4 rounded-lg bg-white/5">
      <h2 className="text-lg font-semibold">{user.name}</h2>
      <p className="text-slate-400">{user.email}</p>
    </div>
  );
}

// Parent component with Suspense boundary
export function UserProfilePage() {
  return (
    <Suspense fallback={<div className="animate-pulse">Loading user...</div>}>
      <UserProfile />
    </Suspense>
  );
}
