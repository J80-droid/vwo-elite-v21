# Skill Validation Script
# Validates that all SKILL.md files in .agent/skills have valid YAML frontmatter

$ErrorActionPreference = "Stop"

function Invoke-SkillValidation {
    Write-Host "[VALIDATE] Scanning .agent/skills for SKILL.md files..." -ForegroundColor Cyan
    
    $skillFiles = Get-ChildItem -Path ".agent/skills" -Recurse -Filter "SKILL.md"
    $errors = @()
    $warnings = @()
    
    foreach ($file in $skillFiles) {
        $content = Get-Content $file.FullName -Raw
        $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
        
        # Check for YAML frontmatter
        if ($content -notmatch "^---") {
            $errors += "Missing YAML frontmatter: $relativePath"
            continue
        }
        
        # Check for required fields
        if ($content -notmatch "name:") {
            $errors += "Missing 'name' field: $relativePath"
        }
        if ($content -notmatch "description:") {
            $errors += "Missing 'description' field: $relativePath"
        }
        
        # Check for recommended fields (warnings)
        if ($content -notmatch "version:") {
            $warnings += "Missing 'version' field: $relativePath"
        }
        if ($content -notmatch "triggers:") {
            $warnings += "Missing 'triggers' field: $relativePath"
        }
        
        Write-Host "   [OK] $relativePath" -ForegroundColor Gray
    }
    
    Write-Host ""
    
    # Report warnings
    if ($warnings.Count -gt 0) {
        Write-Host "[WARN] Recommendations:" -ForegroundColor Yellow
        foreach ($warn in $warnings) {
            Write-Host "   - $warn" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    
    # Report errors
    if ($errors.Count -gt 0) {
        Write-Host "[FAIL] Validation Errors:" -ForegroundColor Red
        foreach ($err in $errors) {
            Write-Host "   - $err" -ForegroundColor Red
        }
        exit 1
    }
    
    Write-Host "[DONE] All $($skillFiles.Count) skills validated successfully!" -ForegroundColor Green
}

Invoke-SkillValidation
