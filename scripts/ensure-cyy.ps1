$ErrorActionPreference = "Stop"

function Write-Step($Message) {
  Write-Host "[cyy-mall] $Message"
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Error "Node.js is required. Install Node.js 18+ first."
}

$nodeVersionText = (& node --version).Trim()
$major = [int]($nodeVersionText.TrimStart("v").Split(".")[0])
if ($major -lt 18) {
  Write-Error "Node.js 18+ is required. Current version: $nodeVersionText"
}
Write-Step "Node.js $nodeVersionText"

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
  Write-Error "npm is required but was not found in PATH."
}

function Add-NpmGlobalBinToPath {
  $prefix = (& npm config get prefix).Trim()
  if (-not $prefix) {
    return
  }

  if ((Test-Path -LiteralPath $prefix) -and (($env:PATH -split [IO.Path]::PathSeparator) -notcontains $prefix)) {
    $env:PATH = "$prefix$([IO.Path]::PathSeparator)$env:PATH"
    Write-Step "Added npm global bin to PATH for this process: $prefix"
  }
}

Add-NpmGlobalBinToPath

$cyy = Get-Command cyy -ErrorAction SilentlyContinue
if (-not $cyy) {
  Write-Step "cyy not found; installing cyymall-cli globally with npm."
  npm install -g cyymall-cli
  Add-NpmGlobalBinToPath
} else {
  Write-Step "cyy found at $($cyy.Source)"
}

$cyy = Get-Command cyy -ErrorAction SilentlyContinue
if (-not $cyy) {
  Write-Error "cyy is still not available after install. Check npm global bin directory in PATH."
}

$version = (& cyy --version).Trim()
Write-Step "cyy version $version"
Write-Step "Ready. Run 'cyy --help' for commands."
