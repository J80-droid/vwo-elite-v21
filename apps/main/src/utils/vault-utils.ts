import fs from "fs";
import JSZip from "jszip";
import path from "path";

import { safeLog } from "./safe-logger";

/**
 * Recursively adds files from a directory to a JSZip instance.
 * @param zip The JSZip instance
 * @param rootPath The absolute path to the directory to zip
 * @param currentPath The relative path within the zip
 */
async function addDirectoryToZip(zip: JSZip, rootPath: string, currentPath = "") {
    const absolutePath = path.join(rootPath, currentPath);
    const items = fs.readdirSync(absolutePath);

    for (const item of items) {
        const itemRelativePath = path.join(currentPath, item);
        const itemAbsolutePath = path.join(rootPath, itemRelativePath);
        const stats = fs.statSync(itemAbsolutePath);

        if (stats.isDirectory()) {
            await addDirectoryToZip(zip, rootPath, itemRelativePath);
        } else {
            const content = fs.readFileSync(itemAbsolutePath);
            // JSZip uses forward slashes for internal paths regardless of OS
            zip.file(itemRelativePath.replace(/\\/g, "/"), content);
        }
    }
}

/**
 * Creates a .vwo-vault (zip) from the databases directory.
 */
export async function createVault(databasesPath: string): Promise<Buffer> {
    safeLog.log(`[Vault] Creating vault from: ${databasesPath}`);
    const zip = new JSZip();

    if (!fs.existsSync(databasesPath)) {
        throw new Error("Databases directory not found");
    }

    await addDirectoryToZip(zip, databasesPath);
    return await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

/**
 * Extracts a .vwo-vault (zip) to the databases directory.
 */
export async function extractVault(vaultBuffer: Buffer, targetPath: string) {
    safeLog.log(`[Vault] Extracting vault to: ${targetPath}`);
    const zip = await JSZip.loadAsync(vaultBuffer);

    // Ensure target path exists and is empty or we manage it
    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
    }

    // Extract each file
    for (const [relativePath, file] of Object.entries(zip.files)) {
        if (file.dir) {
            const dirPath = path.join(targetPath, relativePath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        } else {
            const content = await file.async("nodebuffer");
            const filePath = path.join(targetPath, relativePath);

            // Ensure parent directory exists (sometimes zip files don't have explicit dir entries)
            const parentDir = path.dirname(filePath);
            if (!fs.existsSync(parentDir)) {
                fs.mkdirSync(parentDir, { recursive: true });
            }

            fs.writeFileSync(filePath, content);
        }
    }
}
