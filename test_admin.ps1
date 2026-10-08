$body = @{ email = "admin@examcentre.com"; password = "Admin@1234" } | ConvertTo-Json
try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
    $json = $r.Content | ConvertFrom-Json
    Write-Host ("Login OK -> role: " + $json.role + " | email: " + $json.email) -ForegroundColor Green
} catch {
    Write-Host ("Login FAILED: " + $_.Exception.Message) -ForegroundColor Red
    try {
        $err = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host ("Detail: " + $err.detail) -ForegroundColor Yellow
    } catch {}
}
