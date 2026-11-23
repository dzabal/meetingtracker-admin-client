param(
    [string]$BaseUrl = "http://127.0.0.1:8000",
    [string]$OutputPath = ".\docs\admin-api\openapi-admin-v1.json"
)

$ErrorActionPreference = "Stop"

$health = Invoke-RestMethod -Method Get -Uri "$BaseUrl/health"
Write-Host "Health OK:" ($health | ConvertTo-Json -Compress)

$outputDirectory = Split-Path -Parent $OutputPath
if ($outputDirectory) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}

Invoke-WebRequest `
    -Method Get `
    -Uri "$BaseUrl/openapi.json" `
    -OutFile $OutputPath

python -m json.tool $OutputPath | Out-Null

$openApi = Get-Content $OutputPath -Raw | ConvertFrom-Json
$adminPaths = @(
    $openApi.paths.PSObject.Properties |
    Where-Object { $_.Name -like "/api/admin/v1/*" }
)

Write-Host "OpenAPI exportado:" (Resolve-Path $OutputPath)
Write-Host "Rutas administrativas:" $adminPaths.Count
Write-Host "Título:" $openApi.info.title
Write-Host "Versión OpenAPI:" $openApi.openapi
