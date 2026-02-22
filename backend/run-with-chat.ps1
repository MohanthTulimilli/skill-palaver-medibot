# Run backend with chat API enabled.
# 1. Copy .env.chat.example to .env.chat
# 2. Edit .env.chat and add your Groq API key (get one free at console.groq.com)
# 3. Run: .\run-with-chat.ps1

$envFile = Join-Path $PSScriptRoot ".env.chat"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim().Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
    Write-Host "Chat API key loaded from .env.chat" -ForegroundColor Green
} else {
    Write-Host "No .env.chat found. Copy .env.chat.example to .env.chat and add GROQ_API_KEY" -ForegroundColor Yellow
}

Set-Location $PSScriptRoot
mvn spring-boot:run
