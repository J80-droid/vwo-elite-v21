---
name: visualization
description: Generates Mermaid.js diagrams to explain complex flows, state machines, or architecture.
version: 1.0.0
triggers:
  - "when explaining complex logic"
  - "when documenting architecture"
  - "when visualizing data flow"
---

# Visualization Protocol

**RULE:** When explaining abstract concepts, logic flows, or database relationships, YOU MUST generate a Mermaid diagram.

## Supported Types

1. **Flowcharts:** For logic/process (e.g., Auth flow).
2. **Sequence Diagrams:** For API interactions.
3. **ER Diagrams:** For data structures.
4. **State Diagrams:** For UI state machines.

## Syntax Standard

Always wrap mermaid code in a markdown block:

```mermaid
graph TD
    A[Start] -->|Valid| B(Process)
    A -->|Invalid| C[Error]
    B --> D{Database}
```

## Examples

### State Machine (UI)

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading: Fetch Data
    Loading --> Success: 200 OK
    Loading --> Error: 500 Fail
```

### Data Flow (API)

```mermaid
sequenceDiagram
    User->>+UI: Clicks Save
    UI->>+API: POST /data
    API-->>-UI: 201 Created
    UI-->>-User: Show Toast
```

### Component Hierarchy

```mermaid
graph TB
    App --> Router
    Router --> Layout
    Layout --> Sidebar
    Layout --> MainContent
    MainContent --> FeatureModule
```

> **Related Skills:** [documentation](../documentation/SKILL.md), [architecture-decisions](../architecture-decisions/SKILL.md)
