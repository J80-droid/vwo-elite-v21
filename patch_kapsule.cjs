const fs = require("fs");
const path = require("path");

const filePath = path.join(
  "node_modules",
  "react-kapsule",
  "dist",
  "react-kapsule.mjs",
);

if (!fs.existsSync(filePath)) {
  console.warn("File not found (may skip skip if using pnpm):", filePath);
  process.exit(0);
}

const content = fs.readFileSync(filePath, "utf8");
console.log("--- Original Content Start ---");
console.log(content.slice(0, 200));
console.log("--- Original Content End ---");

// Proposed fix: Change default import to namespace import + destructuring
// Pattern: import React, { forwardRef, ... } from 'react';
// Replacement: import * as React from 'react'; const { forwardRef, ... } = React;

const regex = /import React,\s*\{([^}]+)\}\s*from\s*['"]react['"];?/;
const match = content.match(regex);

if (match) {
  console.log("Match found!");
  const imports = match[1].split(",").map((s) => s.trim());
  console.log("Imports:", imports);

  // Fix: Use 'var' to avoid Temporal Dead Zone (TDZ) issues if bundler hoists usages
  const newContent = content.replace(
    regex,
    `import * as React from 'react'; var { ${imports.join(", ")} } = React;`,
  );

  fs.writeFileSync(filePath, newContent, "utf8");
  console.log("File patched successfully!");
} else if (content.includes("import * as React from 'react'") && content.includes("var { forwardRef")) {
  console.log("File is already patched appropriately. (Elite Status: OK)");
} else {
  console.log("Regex did not match and file doesn't look patched. Warning.");
}
