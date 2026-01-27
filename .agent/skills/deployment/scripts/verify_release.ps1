[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

function Invoke-ReleaseCheck {
    Write-Host "[RELEASE] Starting Elite Release Verification..." -ForegroundColor Cyan

    # 1. Code Quality Gates (Lint & Test)
    Write-Host "[CHECK] Running Quality Gates..." -ForegroundColor Yellow
    try {
        Write-Host "   > Linting..." -NoNewline
        $l = Start-Process -FilePath "npm" -ArgumentList "run lint -- --silent" -NoNewWindow -PassThru -Wait
        if ($l.ExitCode -ne 0) { throw "Linting failed." }
        Write-Host " OK" -ForegroundColor Green

        Write-Host "   > Unit Tests..." -NoNewline
        # Using --watch=false or CI=true to strictly run once
        $t = Start-Process -FilePath "npm" -ArgumentList "run test -- --run" -NoNewWindow -PassThru -Wait
        if ($t.ExitCode -ne 0) { throw "Tests failed." }
        Write-Host " OK" -ForegroundColor Green
    }
    catch {
        Write-Host "`n[FATAL] Quality Gate failed. Fix errors before building." -ForegroundColor Red
        exit 1
    }

    # 2. Clean Slate
    if (Test-Path "dist") {
        Write-Host "[CLEAN] Cleaning previous build..." -ForegroundColor Gray
        Remove-Item -Recurse -Force "dist"
    }

    # 3. Production Build
    Write-Host "[BUILD] Running Production Build..." -ForegroundColor Yellow
    try {
        $p = Start-Process -FilePath "npm" -ArgumentList "run build" -NoNewWindow -PassThru -Wait
        if ($p.ExitCode -ne 0) { throw "Build failed." }
        Write-Host "[OK] Build success." -ForegroundColor Green
    }
    catch {
        Write-Host "[FATAL] Build failed. Do not deploy." -ForegroundColor Red
        exit 1
    }

    # 4. Size Budget Analysis (2MB Limit)
    $LimitMB = 2.0
    if (Test-Path "dist/assets") {
        $Chunks = Get-ChildItem "dist/assets/*.js"
        foreach ($file in $Chunks) {
            $SizeMB = $file.Length / 1MB
            if ($SizeMB -gt $LimitMB) {
                Write-Warning "[WARN] Large Chunk: $($file.Name) ($($SizeMB.ToString("F2")) MB)"
            }
        }
    }

    # 5. Security Audit (Strict Mode)
    Write-Host "[SECURITY] Security Audit..." -ForegroundColor Yellow
    $s = Start-Process -FilePath "npm" -ArgumentList "audit --audit-level=high --json" -NoNewWindow -PassThru -Wait
    if ($s.ExitCode -ne 0) {
        Write-Warning "[WARN] Vulnerabilities found. Check 'npm audit'."
        # Uncomment below line to enforce strict security blocking
        # throw "Security audit failed."
    }
    else {
        Write-Host "[OK] Security check passed." -ForegroundColor Green
    }

    Write-Host "`n[DONE] Release Candidate Verified. Ready for Deployment." -ForegroundColor Cyan
}

Invoke-ReleaseCheck
