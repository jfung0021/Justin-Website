$ErrorActionPreference = 'Stop'
$blogRoot = Split-Path -Parent $PSScriptRoot
try {
    $blogNode = Get-Command node -ErrorAction SilentlyContinue
    $blogNodePath = if ($blogNode) { $blogNode.Source } else { Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' }
    if (-not (Test-Path -LiteralPath $blogNodePath)) { throw 'Node.js could not be found. Install Node.js LTS, then open the writing desk again.' }
    $blogLogs = Join-Path $blogRoot '.editor-runtime'
    New-Item -ItemType Directory -Path $blogLogs -Force | Out-Null
    $blogIdentity = 'http://127.0.0.1:4318/health'
    try { $blogRunning = Invoke-RestMethod -Uri $blogIdentity -TimeoutSec 2 } catch { $blogRunning = $null }
    if (-not $blogRunning) {
        $blogArgs = '"' + (Join-Path $PSScriptRoot 'server.mjs') + '"'
        Start-Process -FilePath $blogNodePath -ArgumentList $blogArgs -WorkingDirectory $blogRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $blogLogs 'server.log') -RedirectStandardError (Join-Path $blogLogs 'error.log') | Out-Null
        for ($blogAttempt = 0; $blogAttempt -lt 30; $blogAttempt++) {
            Start-Sleep -Milliseconds 500
            try { $blogRunning = Invoke-RestMethod -Uri $blogIdentity -TimeoutSec 2; break } catch {}
        }
    }
    if (-not $blogRunning) { throw "The writing desk could not start. Details are in $blogLogs\error.log" }
    $blogHash = [System.Security.Cryptography.SHA256]::Create()
    $blogExpected = ([BitConverter]::ToString($blogHash.ComputeHash([Text.Encoding]::UTF8.GetBytes($blogRoot)))).Replace('-','').ToLowerInvariant()
    if ($blogRunning.identity -ne $blogExpected) { throw 'Another writing desk is using this address. Close it before opening this notebook.' }
    Start-Process 'http://127.0.0.1:4318'
} catch {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show($_.Exception.Message, 'Alpha! Maybe. — Could not open') | Out-Null
}
