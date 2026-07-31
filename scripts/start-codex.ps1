param(
  [int]$Port = 9335,
  [int]$WaitSeconds = 20
)

$ErrorActionPreference = 'Stop'

if ($Port -lt 1024 -or $Port -gt 65535) {
  throw 'Port must be between 1024 and 65535.'
}

function Test-LocalPortInUse([int]$TargetPort) {
  try {
    $listener = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction Stop
    return $null -ne $listener
  } catch {
    return $false
  }
}

function Test-CdpReady([int]$TargetPort) {
  try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:$TargetPort/json/version" -TimeoutSec 1
    return $null -ne $response
  } catch {
    return $false
  }
}

$packages = Get-AppxPackage | Where-Object {
  $_.Name -match '^OpenAI\.Codex$' -or
  $_.PackageFamilyName -match '^OpenAI\.Codex_' -or
  $_.Name -match 'Codex'
} | Sort-Object Version -Descending

$package = $packages | Select-Object -First 1
if (-not $package) {
  throw 'The official Codex AppX/MSIX package was not found for the current user.'
}

$installRoot = [IO.Path]::GetFullPath($package.InstallLocation)
$candidates = @(
  (Join-Path $installRoot 'app\ChatGPT.exe'),
  (Join-Path $installRoot 'ChatGPT.exe'),
  (Join-Path $installRoot 'app\Codex.exe'),
  (Join-Path $installRoot 'Codex.exe')
)

$exe = $candidates | Where-Object { Test-Path $_ -PathType Leaf } | Select-Object -First 1
if (-not $exe) {
  throw "No supported Codex/ChatGPT desktop executable was found under $installRoot."
}

$resolvedExe = [IO.Path]::GetFullPath($exe)
if (-not $resolvedExe.StartsWith($installRoot, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'Refusing to launch an executable outside the validated Codex package.'
}

$running = Get-Process -Name 'Codex','ChatGPT' -ErrorAction SilentlyContinue
if ($running) {
  Write-Warning 'Codex/ChatGPT is already running. Fully quit it before starting a themed session.'
  Write-Warning 'An existing instance can cause Chromium to ignore the requested debugging port.'
}

if (Test-LocalPortInUse $Port) {
  if (Test-CdpReady $Port) {
    Write-Warning "Port $Port already exposes a CDP endpoint. Reuse it only if it belongs to this Codex session."
  } else {
    throw "Port $Port is already in use by another process. Choose another port with -Port."
  }
}

$args = @(
  '--remote-debugging-address=127.0.0.1',
  "--remote-debugging-port=$Port"
)

Write-Host "Codex package : $($package.Name) $($package.Version)"
Write-Host "Executable    : $resolvedExe"
Write-Host "Starting local CDP on 127.0.0.1:$Port"
Write-Host 'Using the validated package executable directly so current OWL builds receive raw Chromium arguments.'

$process = Start-Process -FilePath $resolvedExe -ArgumentList $args -PassThru

$deadline = (Get-Date).AddSeconds($WaitSeconds)
do {
  if ($process.HasExited) {
    throw "Codex exited before CDP became ready. Exit code: $($process.ExitCode)"
  }

  if (Test-CdpReady $Port) {
    Write-Host "CDP is ready: http://127.0.0.1:$Port"
    Write-Host ''
    Write-Host 'Apply a theme:'
    Write-Host "  `$env:CODEX_CDP_URL='http://127.0.0.1:$Port'"
    Write-Host '  npm run dev -- --theme wechat'
    Write-Host '  # or'
    Write-Host '  npm run dev -- --theme qq'
    exit 0
  }

  Start-Sleep -Milliseconds 350
} while ((Get-Date) -lt $deadline)

throw @"
Codex started, but no CDP endpoint appeared on 127.0.0.1:$Port within $WaitSeconds seconds.
Recent Store builds can change how launch arguments reach the Chromium renderer.
Do not modify WindowsApps. Check the current Codex version and this project's compatibility notes before trying another launch method.
"@
