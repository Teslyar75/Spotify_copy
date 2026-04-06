# Останавливает процессы, занимающие указанные TCP-порты (типично — старые uvicorn / Vite).
# Использование: .\scripts\clear-dev-ports.ps1
#            или .\scripts\clear-dev-ports.ps1 -Ports 8000,5173

param(
    [int[]] $Ports = @(8000, 3000, 3001)
)

$ErrorActionPreference = "SilentlyContinue"
foreach ($port in $Ports) {
    for ($i = 0; $i -lt 12; $i++) {
        $procIds = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess -Unique
        if (-not $procIds) { break }
        foreach ($procId in $procIds) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Milliseconds 250
    }
}
