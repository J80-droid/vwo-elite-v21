/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
    forbidden: [
        /* -------------------------------------------------------------------------
           1. SECURITY: RENDERER MAG GEEN NODE.JS MODULES GEBRUIKEN
           Voorkomt dat je per ongeluk 'fs' of 'child_process' in React gebruikt.
           Dit houdt de bundle klein en de app veilig (Context Isolation).
           ------------------------------------------------------------------------- */
        {
            name: 'no-node-in-renderer',
            severity: 'error',
            comment: 'SECURITY: De renderer mag geen Node.js built-ins gebruiken.',
            from: { path: '^(apps/renderer|src)' },
            to: {
                dependencyTypes: ['core'], // 'core' = Node.js built-ins (fs, path, os)
                // Uitzondering: 'path' wordt soms gebruikt voor string manipulatie,
                // maar idealiter doe je dit ook niet. Voor "Elite" status: blokkeren.
            },
        },
        {
            name: 'no-renderer-ui-in-main',
            severity: 'error',
            comment: 'SECURITY: De main process mag geen UI-gerelateerde code importeren.',
            from: { path: '^apps/main' },
            to: {
                path: '^src/(app|pages|widgets|features|entities|styles|components|ui|hooks|contexts|stores)|src/shared/(components|ui|hooks|contexts|stores|styles)',
            },
        },

        /* -------------------------------------------------------------------------
           2. ISOLATION: RENDERER MAG GEEN BACKEND LOGICA IMPORTEREN
           De frontend mag nooit direct bij de database of native modules.
           Alles moet via IPC (vwoApi) lopen.
           ------------------------------------------------------------------------- */
        {
            name: 'no-main-in-renderer',
            severity: 'error',
            comment: 'ARCHITECTUUR: Renderer mag geen Main-code importeren. Gebruik IPC.',
            from: { path: '^(apps/renderer|src)' },
            to: { path: '^apps/main' },
        },

        /* -------------------------------------------------------------------------
           3. SHARED PURITY
           Shared packages mogen nergens van afhangen, behalve van elkaar.
           ------------------------------------------------------------------------- */
        {
            name: 'shared-must-be-pure',
            severity: 'error',
            comment: 'CLEAN CODE: Shared code mag niet afhangen van app-specifieke logica.',
            from: { path: '^packages/' },
            to: { path: '^(apps/|src/)' },
        },

        /* -------------------------------------------------------------------------
           4. NO CIRCULAR DEPENDENCIES
           De doodsteek voor stabiliteit.
           ------------------------------------------------------------------------- */
        {
            name: 'no-circular',
            severity: 'warn', // Gemasterd naar warn voor baseline, herstel volgt.
            comment: 'STABILITEIT: Circulaire afhankelijkheden gedetecteerd.',
            from: {},
            to: { circular: true },
        },

        /* -------------------------------------------------------------------------
           5. PRELOAD SPECIFICS
           Preload is de brug en mag geen zware dependencies hebben.
           ------------------------------------------------------------------------- */
        {
            name: 'preload-isolation',
            severity: 'error',
            comment: 'ARCHITECTUUR: Preload moet lichtgewicht zijn.',
            from: { path: '^apps/preload' },
            to: { path: '^(apps/renderer|src/(app|pages|widgets|features|entities|styles|components|ui))' },
        },
    ],

    options: {
        /* Gebruik de TypeScript config om paden en aliassen op te lossen */
        tsConfig: {
            fileName: 'tsconfig.json', // Zorg dat dit verwijst naar je root tsconfig
        },
        /* Scan ook op files die niet gecommit zijn (veiligheid voor dev) */
        includeOnly: '^apps|^packages|^src',
        exclude: 'node_modules|dist|out',
        tsPreCompilationDeps: true, // Belangrijk voor TypeScript imports
    },
};
