param(
  [int]$Port = 9222
)

$ErrorActionPreference = 'Stop'

$package = Get-AppxPackage | Where-Object {
  $_.Name -match 'Codex' -or $_.PackageFamilyName -match 'Codex'
} | Select-Object -First 1

if (-not $package) {
  throw 'Codex AppX package was not found. Install Codex Desktop first.'
}

$candidates = @(
  (Join-Path $package.InstallLocation 'app\Codex.exe'),
  (Join-Path $package.InstallLocation 'Codex.exe')
)

$exe = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $exe) {
  throw "Codex.exe was not found under $($package.InstallLocation)."
}

$running = Get-Process -Name 'Codex' -ErrorAction SilentlyContinue
if ($running) {
  Write-Warning 'Codex is already running. Fully quit it before using this launcher, otherwise the debug port may not be enabled.'
}

Write-Host "Starting Codex with local CDP on 127.0.0.1:$Port"
Start-Process -FilePath $exe -ArgumentList @(
  "--remote-debugging-address=127.0.0.1",
  "--remote-debugging-port=$Port"
)

Write-Host 'Codex launched. Now run one of:'
Write-Host '  npm run dev -- --theme wechat'
Write-Host '  npm run dev -- --theme qq'
