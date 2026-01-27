---
name: knowledge-react19
description: Best practices and new hooks for React 19.
version: 1.0.0
triggers:
  - "when writing React components"
  - "when fetching data"
  - "when handling forms"
---

# React 19 Standards

This project uses React 19. Discard patterns from React 16-18 where they have been superseded.

## 1. Data Fetching & Promises

❌ **Avoid:** `useEffect` for data fetching.
✅ **Use:** The `use` API for promises and Suspense.

```tsx
// Modern Pattern
import { use, Suspense } from 'react';

function Comments({ commentsPromise }) {
  // `use` unwraps the promise. Component suspends if pending.
  const comments = use(commentsPromise);
  return <div>{comments.map(...)}</div>;
}
```

## 2. Form Actions

❌ **Avoid:** Manual `onSubmit` handlers with `event.preventDefault()`.
✅ **Use:** React Server Actions (or client actions) with the `action` prop.

```tsx
// Modern Pattern
function Search() {
  function searchAction(formData) {
    const query = formData.get("query");
    makeApiCall(query);
  }

  return (
    <form action={searchAction}>
      <input name="query" />
      <button type="submit">Search</button>
    </form>
  );
}
```

## 3. State in Actions

✅ **Use:** `useActionState` (formerly useFormState) for handling form results/errors.
✅ **Use:** `useFormStatus` to show loading spinners inside forms without prop drilling.

## 4. Optimization

The React Compiler is active (assumed).

❌ **Stop** manually wrapping everything in `useMemo` or `useCallback` unless specifically profiling performance issues.

Let the compiler handle memoization.
