# VWO Elite // Master Architecture Sync & 3D Layout Engine
# -----------------------------------------------------------------------------
# Goals:
# 1. Dependency Discovery: Scan imports to find real links between modules.
# 2. Force-Directed Layout: Calculate optimal 3D positions (repulsion/attraction).
# 3. Path Mapping: Link nodes to real source files for live loading.

$ErrorActionPreference = "Stop"

$DataPath = "src/features/settings/ui/modules/architecture/data.ts"
$SrcPath = "src"

Write-Host "[MASTER-SYNC] Initializing Next-Level Architecture Engine..." -ForegroundColor Cyan

# --- 1. CONFIGURATION ---
$ElitePalette = @("#00FFFF", "#39FF14", "#BC13FE", "#FF00FF", "#00E5FF", "#FFFF00", "#FF3131", "#00F5D4", "#FF9E00", "#7B61FF")
$Tiers = @{
    "feature"   = 6
    "api"       = -6
    "shared"    = -8
    "lib"       = -6
    "type"      = -6
    "component" = -8
}

# --- 2. DISCOVERY & DEPENDENCY PARSING ---
Write-Host "   -> Scanning for modules and parsing dependencies..." -ForegroundColor Gray

$Modules = @{} # id -> properties
$Links = @()   # (from, to)

# Discover Features
$FeatureFolders = Get-ChildItem -Path (Join-Path $SrcPath "features") -Directory
foreach ($f in $FeatureFolders) {
    $id = $f.Name
    $files = Get-ChildItem -Path $f.FullName -Recurse -File -Include "*.tsx", "*.ts" | 
    Where-Object { $_.Name -match "Stage|Engine|Sim|Viewer|Controller|Store|Context|Hub|Layout" } |
    Select-Object -First 5
             
    $Modules[$id] = @{
        id          = $id
        name        = $id.Substring(0, 1).ToUpper() + $id.Substring(1)
        type        = "feature"
        files       = $files | ForEach-Object { $_.FullName.Replace($PWD.Path, "").TrimStart("\").Replace("\", "/") }
        description = "Feature module: $id"
        color       = $ElitePalette[($Modules.Count) % $ElitePalette.Count]
        pos         = @(0.0, $Tiers["feature"], 0.0)
    }

    # Parse Imports for connections
    $fFiles = Get-ChildItem -Path $f.FullName -Recurse -File -Include "*.tsx", "*.ts"
    foreach ($file in $fFiles) {
        $content = Get-Content -Path $file.FullName -Raw
        # Match @features/xyz or ../../xyz
        $matches = [regex]::Matches($content, "@features/([a-z0-9-]+)")
        foreach ($m in $matches) {
            $target = $m.Groups[1].Value
            if ($target -ne $id) { $Links += , @($id, $target) }
        }
    }
}

# Discover Core Layer (Shared, Entities, etc. as fixed nodes if missing)
$CoreNodes = @("api", "shared", "entities", "app")
foreach ($c in $CoreNodes) {
    if (-not $Modules.ContainsKey($c)) {
        $type = if ($c -eq "api") { "api" } else { "shared" }
        $Modules[$c] = @{
            id          = $c
            name        = $c.ToUpper()
            type        = $type
            files       = @()
            description = "Core system layer: $c"
            color       = "#FFFFFF"
            pos         = @(0.0, $Tiers[$type], 0.0)
        }
    }
}

# --- 3. FORCE-DIRECTED LAYOUT (3D) ---
Write-Host "   -> Running 3D Force-Directed Layout simulation..." -ForegroundColor Gray

$Iterations = 50
$K = 4.0 # Spring constant
$Repulsion = 40.0
$Damping = 0.9

# Initial random spread
foreach ($key in $Modules.Keys) {
    $Modules[$key].pos[0] = (Get-Random -Minimum -100 -Maximum 100) / 10.0
    $Modules[$key].pos[2] = (Get-Random -Minimum -100 -Maximum 100) / 10.0
}

for ($i = 0; $i -lt $Iterations; $i++) {
    $forces = @{}
    foreach ($key in $Modules.Keys) { $forces[$key] = @(0.0, 0.0) }

    # Repulsion
    $keys = $Modules.Keys | Get-Random -Count $Modules.Count # Shuffle for better distribution
    foreach ($u_id in $keys) {
        foreach ($v_id in $keys) {
            if ($u_id -eq $v_id) { continue }
            $dx = $Modules[$u_id].pos[0] - $Modules[$v_id].pos[0]
            $dz = $Modules[$u_id].pos[2] - $Modules[$v_id].pos[2]
            $distSq = ($dx * $dx) + ($dz * $dz) + 0.01
            $force = $Repulsion / $distSq
            $forces[$u_id][0] += ($dx / [Math]::Sqrt($distSq)) * $force
            $forces[$u_id][1] += ($dz / [Math]::Sqrt($distSq)) * $force
        }
    }

    # Attraction
    foreach ($link in $Links) {
        $u_id = $link[0]; $v_id = $link[1]
        if (-not $Modules.ContainsKey($u_id) -or -not $Modules.ContainsKey($v_id)) { continue }
        $dx = $Modules[$v_id].pos[0] - $Modules[$u_id].pos[0]
        $dz = $Modules[$v_id].pos[2] - $Modules[$u_id].pos[2]
        $dist = [Math]::Sqrt(($dx * $dx) + ($dz * $dz)) + 0.01
        $force = ($dist * $dist) / $K
        $forces[$u_id][0] += ($dx / $dist) * $force
        $forces[$u_id][1] += ($dz / $dist) * $force
        $forces[$v_id][0] -= ($dx / $dist) * $force
        $forces[$v_id][1] -= ($dz / $dist) * $force
    }

    # Apply forces
    foreach ($key in $Modules.Keys) {
        $Modules[$key].pos[0] += $forces[$key][0] * 0.1 * $Damping
        $Modules[$key].pos[2] += $forces[$key][1] * 0.1 * $Damping
        # Bound
        if ($Modules[$key].pos[0] -gt 15) { $Modules[$key].pos[0] = 15 }
        if ($Modules[$key].pos[0] -lt -15) { $Modules[$key].pos[0] = -15 }
        if ($Modules[$key].pos[2] -gt 15) { $Modules[$key].pos[2] = 15 }
        if ($Modules[$key].pos[2] -lt -15) { $Modules[$key].pos[2] = -15 }
    }
}

# --- 4. DATA GENERATION ---
Write-Host "   -> Generating $DataPath..." -ForegroundColor Green

$ArchNodes = @()
foreach ($key in $Modules.Keys) {
    $m = $Modules[$key]
    $posStr = "[$([Math]::Round($m.pos[0], 2)), $($m.pos[1]), $([Math]::Round($m.pos[2], 2))]"
    $filesStr = ($m.files | ForEach-Object { "`"$_`"" }) -join ", "
    $ArchNodes += "    { id: `"$($m.id)`", name: `"$($m.name)`", type: `"$($m.type)`", position: $posStr, color: `"$($m.color)`", description: `"$($m.description)`", files: [$filesStr] }"
}

$ConnectionsStrings = @()
$UniqueLinks = $Links | Select-Object -Unique | ForEach-Object { "    [`"$($_[0])`", `"$($_[1])`"]" }

$Output = @"
export interface ArchNode {
    id: string;
    name: string;
    type: "feature" | "shared" | "component" | "api" | "lib" | "type";
    position: [number, number, number];
    color: string;
    description: string;
    files?: string[];
    children?: ArchNode[];
}

export const ARCHITECTURE_DATA: ArchNode[] = [
$(($ArchNodes -join ",`n"))
];

export const CONNECTIONS: [string, string][] = [
$(($UniqueLinks -join ",`n"))
];
"@

Set-Content -Path $DataPath -Value $Output
Write-Host "[MASTER-SYNC] Execution Complete. Architecture is now alive." -ForegroundColor Green
