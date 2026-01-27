---
description: How to add or edit translations using the i18next architecture
---

# Adding Translations

This project uses `i18next` with modular JSON files for translations.

## Folder Structure

```text
src/locales/
├── nl/  (Dutch - Primary)
├── en/  (English)
├── es/  (Spanish)
└── fr/  (French)
```

## Steps to Add a New Translation Key

1. **Identify the namespace** (usually corresponds to the feature name, e.g., `physics`, `math`, `settings`).
2. **Edit the JSON file** in all supported language folders (`nl`, `en`, `es`, `fr`, etc.):
   - `src/locales/nl/<feature>.json`
   - `src/locales/en/<feature>.json`

3. **Use the key in code**:

   ```typescript
   const { t } = useTranslation(); // or useTranslation('namespace')
   t("feature:key.path"); // With namespace prefix
   ```

## Example: Adding a new button label to Physics

1. Add to `src/locales/nl/physics.json`:

   ```json
   { "controls": { "launch": "Lancering" } }
   ```

2. Repeat for other languages.
3. Use in component: `t('physics:controls.launch')`

## Core Namespaces

| Namespace | Purpose                             |
| :-------- | :---------------------------------- |
| common    | Shared UI: buttons, errors, loading |
| nav       | Navigation menu labels              |
| settings  | Settings & Preferences              |
| dashboard | Dashboard widgets & text            |

## Feature Namespaces

Most features have their own namespace matching their folder name:

- `physics`
- `chemistry`
- `math` (or `calculus`)
- `biology`
- `threed-studio`
- `ai-lab`
- ...and so on.
