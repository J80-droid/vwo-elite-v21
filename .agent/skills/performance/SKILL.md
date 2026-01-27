---
name: performance
description: Performance optimization standards including Lighthouse checks, bundle size budgets, and Core Web Vitals.
version: 1.0.0
triggers:
  - "when optimizing performance"
  - "when analyzing bundle size"
  - "when reviewing Lighthouse scores"
---

# Performance Standards

## 1. Core Web Vitals Targets

| Metric                         | Target  | Critical |
| ------------------------------ | ------- | -------- |
| LCP (Largest Contentful Paint) | < 2.5s  | < 4.0s   |
| FID (First Input Delay)        | < 100ms | < 300ms  |
| CLS (Cumulative Layout Shift)  | < 0.1   | < 0.25   |
| FCP (First Contentful Paint)   | < 1.8s  | < 3.0s   |
| TBT (Total Blocking Time)      | < 200ms | < 600ms  |

## 2. Bundle Size Budgets

- **Individual JS chunks:** Max 2MB (warn at 1.5MB)
- **Total initial bundle:** Max 500KB gzipped
- **Lazy-loaded features:** Use code splitting via `React.lazy()`

## 3. Optimization Checklist

- [ ] Use `React.lazy()` for route-level code splitting
- [ ] Implement virtualization for long lists (`react-window`)
- [ ] Optimize images (WebP, lazy loading, proper sizing)
- [ ] Minimize third-party scripts
- [ ] Use `useDeferredValue` for expensive computations

## 4. Electron-Specific Optimization

### Methodology

We follow a hierarchy of measurement: **Renderer (UI) -> Main (Backend) -> Startup (Cold Start)**.

### Tools & Commands

| Task | Command | Description |
| :--- | :--- | :--- |
| **Measure Startup** | `node scripts/measure-startup.js` | Launches app 5 times and averages "Time to Interaction" |
| **Analyze Bundles** | `npm run build` | Generates `stats.html` in build output to visualize dependency weight |
| **Trace IPC** | `await ipcRenderer.invoke('perf:trace-start')` | Records deep Chromium/Node.js traces for performance tuning |

### Lifecycle Markers

All entry points MUST be instrumented with the W3C User Timing API:

- `main.ts`: `performance.mark('app-start')` (Line 1)
- `main.ts`: `performance.mark('app-ready')` (Inside `whenReady`)
- `preload.ts`: `performance.mark('preload-start')`
- `renderer`: `performance.mark('renderer-init')` & `performance.mark('app-mount')`

### IPC Best Practices

- Heavy handlers (>50ms) MUST include `console.time('handler-name')`
- Use `perf:trace-start` / `perf:trace-stop` to wrap complex user flows debugging.

## 5. Lighthouse Automation

Run before every release:

```bash
npx lighthouse http://localhost:4173 --output=html --output-path=./lighthouse-report.html
```

> **Related Skills:** [deployment](../deployment/SKILL.md), [refactoring](../refactoring/SKILL.md)
