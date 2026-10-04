param([Parameter(Mandatory=$true)][string]$Uri, [Parameter(Mandatory=$true)][string]$OutFile)
$ErrorActionPreference = 'Stop'
$registryUri = [Uri]$Uri
if ($registryUri.Scheme -ne 'https' -or $registryUri.Host -ne 'registry.npmjs.org' -or $registryUri.UserInfo -or $registryUri.Query -or $registryUri.Fragment) { throw 'Only public official npm registry reads allowed.' }
$projectRoot = Split-Path -Parent $PSScriptRoot
$targetPath = [IO.Path]::GetFullPath($OutFile)
$downloadRoot = Join-Path $projectRoot '.npm-downloads'
if (-not $targetPath.StartsWith($downloadRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Download destination outside project cache.' }
Invoke-WebRequest -Uri $registryUri.AbsoluteUri -OutFile $targetPath -TimeoutSec 30 -MaximumRedirection 0
