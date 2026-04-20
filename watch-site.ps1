$ErrorActionPreference = 'Continue'
$path = Split-Path -Parent $MyInvocation.MyCommand.Path
$debounceSeconds = 45

Write-Host "REVAI auto-deploy watcher"
Write-Host "Watching: $path"
Write-Host "Debounce: $debounceSeconds seconds after last edit"
Write-Host "Close this window to stop."
Write-Host ""

$global:lastChange = $null

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $path
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$action = {
    $file = $Event.SourceEventArgs.FullPath
    if ($file -match '\\\.git\\' -or $file -match '~\$' -or $file -match '\.tmp$' -or $file -match '\.swp$' -or $file -match '\.crdownload$') { return }
    $global:lastChange = Get-Date
    Write-Host "[$(Get-Date -Format HH:mm:ss)] change: $(Split-Path -Leaf $file)"
}

$handlers = @()
$handlers += Register-ObjectEvent $watcher 'Changed' -Action $action
$handlers += Register-ObjectEvent $watcher 'Created' -Action $action
$handlers += Register-ObjectEvent $watcher 'Deleted' -Action $action
$handlers += Register-ObjectEvent $watcher 'Renamed' -Action $action

try {
    while ($true) {
        Start-Sleep -Seconds 5
        if ($global:lastChange -ne $null) {
            $elapsed = ((Get-Date) - $global:lastChange).TotalSeconds
            if ($elapsed -ge $debounceSeconds) {
                $global:lastChange = $null
                Write-Host "[$(Get-Date -Format HH:mm:ss)] Debounce elapsed, pushing..."
                Push-Location $path
                try {
                    git add -A 2>&1 | Out-Null
                    $status = git status --porcelain 2>&1
                    if ($status) {
                        $msg = "Auto: site update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
                        git commit -m $msg 2>&1 | Out-Host
                        git push origin main 2>&1 | Out-Host
                        Write-Host "[$(Get-Date -Format HH:mm:ss)] Pushed. Live in ~1 min."
                    } else {
                        Write-Host "[$(Get-Date -Format HH:mm:ss)] Nothing to commit."
                    }
                } finally {
                    Pop-Location
                }
            }
        }
    }
} finally {
    $handlers | ForEach-Object { Unregister-Event -SourceIdentifier $_.Name -ErrorAction SilentlyContinue }
    $watcher.Dispose()
}
