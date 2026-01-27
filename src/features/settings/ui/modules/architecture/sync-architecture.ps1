# VWO Elite // Intelligent Architecture Sync Script
# This script scans src/features and ensures ArchitectureSettings data is up to date with real codebase metadata.

$ErrorActionPreference = "Stop"

$DataPath = "src/features/settings/ui/modules/architecture/data.ts"
$FeaturesPath = "src/features"

# Curated Elite Neon Palette
$ElitePalette = @(
    "#00FFFF", # Cyan
    "#39FF14", # Neon Green
    "#BC13FE", # Proto Purple
    "#FF00FF", # Magenta
    "#00E5FF", # Arctic Blue
    "#FFFF00", # Pure Yellow
    "#FF3131", # Radioactive Red
    "#00F5D4", # Turquoise
    "#FF9E00", # Amber
    "#7B61FF"  # Royal Indigo
)

Write-Host "[SYNC] Scanning features for Elite Architecture Map..." -ForegroundColor Cyan

# 1. Get all features
$Features = Get-ChildItem -Path $FeaturesPath -Directory | Select-Object -ExpandProperty Name
$FeatureCount = $Features.Count
Write-Host "   -> Found $FeatureCount features in $FeaturesPath" -ForegroundColor Gray

# 2. Read current data
$Content = Get-Content -Path $DataPath -Raw

# 3. Process features
$ColorIndex = 0
foreach ($Feature in $Features) {
    # Check if this feature is already in the map
    $EscapedFeature = [regex]::Escape($Feature)
    $InMap = $Content -match "`"id`":\s*`"$EscapedFeature`""
    
    # Discovery: Find relevant files
    $Files = @()
    $FeatureDir = Join-Path $FeaturesPath $Feature
    $FoundFiles = Get-ChildItem -Path $FeatureDir -Recurse -File -Include "*.tsx", "*.ts" | 
    Where-Object { $_.Name -match "Stage|Engine|Sim|Viewer|Controller|Store|FAB|Browser|Lab|Hub" } |
    Select-Object -First 3 -ExpandProperty Name
    
    if ($FoundFiles) {
        $Files = $FoundFiles
    }
    else {
        # Fallback to index or main layout if found
        $MainFiles = Get-ChildItem -Path $FeatureDir -Recurse -File -Include "index.ts", "*Layout.tsx" | Select-Object -First 3 -ExpandProperty Name
        $Files = $MainFiles
    }

    $FilesString = ($Files | ForEach-Object { "`"$_`"" }) -join ", "
    $PascalName = $Feature.Substring(0, 1).ToUpper() + $Feature.Substring(1)
    $Color = $ElitePalette[$ColorIndex % $ElitePalette.Count]

    if (-not $InMap) {
        Write-Host "   [NEW] Feature '$Feature' detected. Injecting real data..." -ForegroundColor Yellow
        
        $NewNode = "    { id: `"$Feature`", name: `"$PascalName`", type: `"feature`", position: [0, 6, 0], color: `"$Color`", description: `"Intelligent discovery of the $PascalName module and its core subsystems.`", files: [$FilesString] },"
        
        if ($Content -match "// Tier 2") {
            $Content = $Content -replace "// Tier 2", "$NewNode`n    // Tier 2"
        }
        else {
            $Content = $Content -replace "];", "$NewNode`n];"
        }
        Write-Host "   + Added $Feature with $(($Files).Count) source files." -ForegroundColor Green
    }
    else {
        # Optional: Update existing files array if it's a placeholder (files: [])
        if ($FilesString -and $Content -match "`"id`":\s*`"$EscapedFeature`".*files:\s*\[\]") {
            Write-Host "   [UPDATE] Mapping files for existing feature '$Feature'..." -ForegroundColor Cyan
            $Content = [regex]::Replace($Content, "(`"id`":\s*`"$EscapedFeature`".*files:\s*)\[\]", "`$1[$FilesString]")
            Write-Host "   + Updated $Feature with files: $FilesString" -ForegroundColor Gray
        }
    }
    $ColorIndex++
}

# 4. Save updated data
Set-Content -Path $DataPath -Value $Content
Write-Host "[SYNC] Elite Architecture Map synchronized successfully!" -ForegroundColor Green
