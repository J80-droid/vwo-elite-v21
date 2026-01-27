[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

function Invoke-SecurityScan {
    Write-Host "[RED-TEAM] Starting Elite Security Scanner v2.0..." -ForegroundColor Cyan

    $RootPath = Get-Location
    
    # 1. Scope Definition (Whitelist Strategy)
    # Only scan files that actually contain logic or configuration.
    # This immediately eliminates PDFs, Images, Binaries, etc.
    $TargetExtensions = @(".ts", ".tsx", ".js", ".jsx", ".json", ".env", ".yml", ".yaml", ".ps1", ".md", ".toml")
    
    # Directories to completely ignore
    $ExcludeDirs = @("node_modules", ".git", "dist", "build", "coverage", ".agent", "public")

    # 2. Define Threat Signatures
    $Signatures = @{
        "AWS Access Key"     = "AKIA[0-9A-Z]{16}"
        "Private Key"        = "-----BEGIN .* PRIVATE KEY-----"
        "OpenAI API Key"     = "sk-[a-zA-Z0-9]{20}T3BlbkFJ"
        "Generic Secret"     = "Authorization:\s*Bearer\s+[a-zA-Z0-9_\-\.]{20,}"
        "Insecure HTTP"      = "http://(?!localhost|127\.0\.0\.1|www\.w3\.org|schemas\.|xmlns)" 
        "Hardcoded Password" = "password\s*=\s*['`"][a-zA-Z0-9@#$%^&*]{6,}['`"]"
    }

    $VulnerabilitiesFound = 0
    $FilesScanned = 0

    # 3. Smart File Collection
    $Files = Get-ChildItem -Path $RootPath -Recurse -File | Where-Object {
        $file = $_
        
        # Check Directory Exclusion
        $isExcludedDir = $false
        foreach ($dir in $ExcludeDirs) {
            if ($file.FullName -match "[\\/]$([Regex]::Escape($dir))[\\/]") { 
                $isExcludedDir = $true; break 
            }
        }

        # Check Extension Whitelist
        $isTargetExt = $TargetExtensions -contains $file.Extension

        # Return True if it's a target extension AND not in an excluded dir
        $isTargetExt -and -not $isExcludedDir
    }

    Write-Host "   Scanning $($Files.Count) source files..." -ForegroundColor Gray

    foreach ($file in $Files) {
        $FilesScanned++
        try {
            $Content = Get-Content $file.FullName -ErrorAction Stop
        }
        catch {
            Write-Warning "   Skipping unreadable file: $($file.Name)"
            continue
        }

        $LineNum = 0
        foreach ($line in $Content) {
            $LineNum++
            
            # Check for specific suppression flag (// nosec or # nosec)
            if ($line -match "//\s*nosec" -or $line -match "#\s*nosec") { continue }

            foreach ($name in $Signatures.Keys) {
                if ($line -match $Signatures[$name]) {
                    
                    # Context Check: Reduce noise for HTTP
                    if ($name -eq "Insecure HTTP") {
                        if ($line -match "xmlns=" -or $line -match 'schema') { continue }
                    }

                    Write-Host "[THREAT] $name" -ForegroundColor Red
                    Write-Host "   File: $($file.FullName):$LineNum" -ForegroundColor Gray
                    
                    # Truncate match for display
                    $MatchVal = [Regex]::Match($line, $Signatures[$name]).Value
                    if ($MatchVal.Length -gt 50) { $MatchVal = $MatchVal.Substring(0, 47) + "..." }
                    
                    Write-Host "   Match: $MatchVal" -ForegroundColor DarkGray
                    $VulnerabilitiesFound++
                }
            }
        }
    }

    # 4. Critical Files Check
    $CriticalFiles = @(".env", ".env.local", ".env.production", "id_rsa")
    foreach ($crit in $CriticalFiles) {
        if (Test-Path "$RootPath/$crit") {
            $GitIgnore = Get-Content ".gitignore" -ErrorAction SilentlyContinue
            if ($null -eq $GitIgnore -or $GitIgnore -notmatch [Regex]::Escape($crit)) {
                Write-Warning "[RISK] '$crit' exists and matches no entry in .gitignore"
            }
        }
    }

    # 5. Final Verdict
    if ($VulnerabilitiesFound -gt 0) {
        Write-Host "`n[FAIL] Security Scan FAILED. Found $VulnerabilitiesFound potential vulnerabilities." -ForegroundColor Red
        exit 1
    }
    else {
        Write-Host "`n[OK] Target System Secure. Scanned $FilesScanned files." -ForegroundColor Green
    }
}

Invoke-SecurityScan
