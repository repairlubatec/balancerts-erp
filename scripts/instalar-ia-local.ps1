$ErrorActionPreference = "Stop"

Write-Host "BALANCERTS.ERP — preparação de IA local gratuita" -ForegroundColor Cyan

$ollama = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollama) {
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) {
    Write-Error "Ollama não está instalado e o Gestor de Pacotes do Windows não está disponível. Instale o Ollama manualmente e execute este script novamente."
  }
  Write-Host "A instalar Ollama através do Gestor de Pacotes do Windows..." -ForegroundColor Yellow
  winget install --id Ollama.Ollama --exact --accept-source-agreements --accept-package-agreements
  $ollama = Get-Command ollama -ErrorAction SilentlyContinue
  if (-not $ollama) {
    Write-Error "A instalação terminou, mas o comando ollama ainda não está disponível. Feche e reabra o PowerShell e execute novamente."
  }
}

Write-Host "A descarregar o modelo gratuito qwen2.5:3b..." -ForegroundColor Yellow
ollama pull qwen2.5:3b

Write-Host "A verificar o serviço local..." -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "http://127.0.0.1:11434/api/tags" -UseBasicParsing -TimeoutSec 5
  if ($response.StatusCode -ne 200) { throw "HTTP $($response.StatusCode)" }
  Write-Host "Ollama está disponível em http://127.0.0.1:11434" -ForegroundColor Green
} catch {
  Write-Warning "O modelo foi preparado, mas o serviço local ainda não respondeu. Execute 'ollama serve' e teste novamente no Balancerts IA."
}

Write-Host "Concluído. No ERP, abra Sistema > Balancerts IA, mantenha IA local activa e prima Testar IA local." -ForegroundColor Green
