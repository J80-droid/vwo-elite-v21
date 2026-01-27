---
name: testing
description: Vitest testing patterns, coverage thresholds, and test-driven development standards.
version: 1.0.0
triggers:
  - "when writing tests"
  - "when verifying functionality"
  - "when debugging"
---

# Testing Standards

## 1. Coverage Thresholds

| Metric     | Minimum | Target |
| ---------- | ------- | ------ |
| Statements | 70%     | 85%    |
| Branches   | 65%     | 80%    |
| Functions  | 70%     | 85%    |
| Lines      | 70%     | 85%    |

## 2. Test Structure (AAA Pattern)

```typescript
describe("ComponentName", () => {
  it("should perform expected behavior", () => {
    // Arrange
    const props = { value: "test" };

    // Act
    const { result } = renderHook(() => useMyHook(props));

    // Assert
    expect(result.current).toBe("expected");
  });
});
```

## 3. Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Describe blocks: Component or function name
- It blocks: `should <expected behavior> when <condition>`

## 4. Testing Priorities

1. **Critical paths:** Authentication, payments, data mutations
2. **Business logic:** Hooks, utilities, state management
3. **UI components:** Interactive elements, forms
4. **Edge cases:** Error states, empty states, loading states

## 5. Commands

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Run specific file
npm run test -- src/features/auth/
```

> **Related Skills:** [project-conventions](../project-conventions/SKILL.md), [debugging](../../.gemini/antigravity/skills/debugging/SKILL.md)
