$cores = @(
    "snes9x",
    "nestopia",
    "mgba",
    "gambatte",
    "genesis_plus_gx",
    "pcsx_rearmed",
    "mupen64plus_next",
    "fbalpha",
    "stella"
)

$baseUrl = "https://cdn.jsdelivr.net/npm/@emulatorjs/cores/dist"
$destDir = "C:\Users\peternoia\Desktop\playnowemulator-firebase\public\emulatorjs\cores"

Write-Host "Baixando cores do EmulatorJS..." -ForegroundColor Cyan

foreach ($core in $cores) {
    $url = "$baseUrl/$core.js"
    $output = "$destDir\$core.js"
    
    Write-Host "Baixando $core..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $url -OutFile $output
        $size = (Get-Item $output).Length / 1MB
        Write-Host "OK - $([math]::Round($size, 2)) MB" -ForegroundColor Green
    } catch {
        Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nConcluido!" -ForegroundColor Green
