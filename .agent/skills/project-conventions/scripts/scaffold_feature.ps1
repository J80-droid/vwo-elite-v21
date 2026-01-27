$ErrorActionPreference = "Stop"

function Invoke-FeatureScaffold {
  param (
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  $FeatureName = $Name.ToLower()
  $BasePath = "src/features/$FeatureName"

  Write-Host "[SCAFFOLD] Scaffolding Elite Feature: $FeatureName" -ForegroundColor Cyan

  if (Test-Path $BasePath) {
    Write-Warning "Feature '$FeatureName' already exists at $BasePath"
    return
  }

  # 1. Create Directory Structure (Domain-Driven Design)
  $Dirs = @(
    "$BasePath/ui/modules",
    "$BasePath/ui/components",
    "$BasePath/logic/hooks",
    "$BasePath/logic/stores",
    "$BasePath/core/engine",
    "$BasePath/core/types"
  )

  foreach ($dir in $Dirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "   + Created $dir" -ForegroundColor Gray
  }

  # 2. Create Public API (Barrel File)
  # Using PascalCase for the export
  $PascalName = $FeatureName.Substring(0, 1).ToUpper() + $FeatureName.Substring(1)
    
  $IndexContent = @"
// Public API for feature: $FeatureName
export * from './ui/modules/Main${PascalName}Layout';
export * from './core/types';
"@
  Set-Content -Path "$BasePath/index.ts" -Value $IndexContent

  # 3. Create Main Layout Component
  $LayoutName = "Main${PascalName}Layout"
  $LayoutContent = @"
export const $LayoutName = () => {
  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-white">
      <header className="p-4 border-b border-white/10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          $PascalName Module
        </h1>
      </header>
      <main className="flex-1 relative overflow-hidden">
        {/* Elite 3D Stage or Dashboard goes here */}
        <div className="absolute inset-0 grid place-items-center text-slate-500">
          Initialize $PascalName Engine...
        </div>
      </main>
    </div>
  );
};
"@
  Set-Content -Path "$BasePath/ui/modules/${LayoutName}.tsx" -Value $LayoutContent

  Write-Host "Feature '$FeatureName' successfully scaffolded!" -ForegroundColor Green
    
  # 4. Developer Experience Optimization
  $ImportLine = "import { $LayoutName } from './features/$FeatureName';"
    
  # Simple clipboard attempt
  Set-Clipboard -Value $ImportLine -ErrorAction SilentlyContinue
    
  Write-Host "Import line: $ImportLine" -ForegroundColor Cyan
  Write-Host "   -> Next step: Paste import in App.tsx and add Route." -ForegroundColor Yellow
}

# Checking for arguments
if ($args.Count -gt 0) {
  Invoke-FeatureScaffold -Name $args[0]
}
else {
  Write-Host "Usage: .\scaffold_feature.ps1 <FeatureName>" -ForegroundColor Red
}
