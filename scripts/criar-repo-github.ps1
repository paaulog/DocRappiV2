# Cria um repositório novo no GitHub a partir desta pasta e envia o branch atual.
# Pré-requisito: gh auth login (uma vez nesta máquina)
#
# Uso:
#   .\scripts\criar-repo-github.ps1 -NomeRepo "meu-repo-docs"
#
# Se já existir remote "origin" e quiser trocar, use -RemoverOrigin

param(
  [Parameter(Mandatory = $true)]
  [string] $NomeRepo,
  [switch] $RemoverOrigin
)

$ErrorActionPreference = "Stop"
$gh = "${env:ProgramFiles}\GitHub CLI\gh.exe"
if (-not (Test-Path $gh)) {
  Write-Error "GitHub CLI não encontrado em $gh. Instale: winget install GitHub.cli"
}

& $gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Faça login no GitHub (abra o navegador e autorize):" -ForegroundColor Yellow
  Write-Host "  & `"$gh`" auth login" -ForegroundColor Cyan
  exit 1
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

if ($RemoverOrigin) {
  git remote remove origin 2>$null
}

$hasOrigin = git remote get-url origin 2>$null
if ($hasOrigin -and -not $RemoverOrigin) {
  Write-Error "Já existe 'origin'. Passe -RemoverOrigin para remover e criar um remoto novo, ou ajuste manualmente (git remote -v)."
}

Write-Host "Criando repositório $NomeRepo e fazendo push..." -ForegroundColor Green
& $gh repo create $NomeRepo --public --source=. --remote=origin --push

if ($LASTEXITCODE -eq 0) {
  Write-Host "Pronto. Abra: https://github.com/$( & $gh api user -q .login )/$NomeRepo" -ForegroundColor Green
}
