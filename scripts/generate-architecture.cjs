const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "../src");
const OUTPUT_FILE = path.resolve(
  __dirname,
  "../src/features/settings/ui/modules/architecture/live-data.json",
);

console.log("--- VWO ELITE ARCHITECTURE SCANNER ---");
console.log("Scanning root:", ROOT_DIR);

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.match(/\.(tsx|ts|js|jsx)$/)) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(ROOT_DIR);
console.log(`Found ${allFiles.length} source files.`);

// Nodes map: "type:name" -> Node
const nodes = {};
const connections = [];

// Helper to get node ID from path
function getNodeFromPath(filePath) {
  const relative = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
  const parts = relative.split("/");

  // src/features/<name>
  if (parts[0] === "features" && parts[1]) {
    return { id: `feature:${parts[1]}`, type: "feature", name: parts[1] };
  }
  // src/shared/<name> (like api, model, ui)
  if (parts[0] === "shared" && parts[1]) {
    const name = parts[1];
    let type = "shared"; // Default (Core)

    if (name === "api") type = "api";
    if (name === "ui" || name === "components") type = "component";
    if (name === "lib" || name === "utils" || name === "hooks") type = "lib";
    if (name === "types") type = "type";

    return { id: `shared:${name}`, type: type, name: name };
  }

  return null;
}

// 1. Build Nodes
allFiles.forEach((file) => {
  const nodeInfo = getNodeFromPath(file);
  if (nodeInfo) {
    if (!nodes[nodeInfo.id]) {
      nodes[nodeInfo.id] = {
        id: nodeInfo.name, // Use simple name as ID for frontend compatibility
        name: nodeInfo.name,
        type: nodeInfo.type,
        position: [0, 0, 0], // Placeholder
        color: nodeInfo.type === "feature" ? "#3b82f6" : "#eab308",
        description: `Auto-scanned ${nodeInfo.type} module`,
        files: [],
      };
    }
    nodes[nodeInfo.id].files.push(path.relative(ROOT_DIR, file));
  }
});

// 2. Build Connections (Imports)
allFiles.forEach((file) => {
  const sourceNode = getNodeFromPath(file);
  if (!sourceNode) return;

  const content = fs.readFileSync(file, "utf-8");
  const importRegex = /import\s+.*\s+from\s+['"](.*)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];

    // Resolve alias (simple heuristic)
    let targetId = null;

    if (importPath.startsWith("@features/")) {
      const featureName = importPath.split("/")[1];
      targetId = `feature:${featureName}`;
    } else if (importPath.startsWith("@shared/")) {
      const sharedName = importPath.split("/")[1];
      targetId = `shared:${sharedName}`;
    }

    // Add connection if both exist and different
    if (
      targetId &&
      nodes[targetId] &&
      nodes[sourceNode.id] &&
      targetId !== sourceNode.id
    ) {
      // Avoid duplicates
      const from = nodes[sourceNode.id].id;
      const to = nodes[targetId].id;

      // Check if reverse exists (undirected graph visual) or duplicate
      const exists = connections.some((c) => c[0] === from && c[1] === to);
      if (!exists) {
        connections.push([from, to]);
      }
    }
  }
});

const output = {
  nodes: Object.values(nodes),
  connections: connections,
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log(
  `Generated ${output.nodes.length} nodes and ${connections.length} connections.`,
);
console.log("Saved to:", OUTPUT_FILE);
console.log("--- SCAN COMPLETE ---");
