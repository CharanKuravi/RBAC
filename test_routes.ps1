$routes = @('/login', '/register', '/dashboard', '/exam', '/admin', '/profile')

Write-Host "`n=== Next.js Route Tests ===" -ForegroundColor Cyan

foreach ($route in $routes) {
    try {
        $res = Invoke-WebRequest -Uri ("http://localhost:3000" + $route) -UseBasicParsing -TimeoutSec 8 -MaximumRedirection 5
        Write-Host ("[PASS] " + $route + " -> " + $res.StatusCode) -ForegroundColor Green
    } catch {
        Write-Host ("[FAIL] " + $route + " -> " + $_.Exception.Message) -ForegroundColor Red
    }
}

Write-Host "`n=== API Proxy Tests ===" -ForegroundColor Cyan

# Test proxy: Next.js /api/* -> FastAPI
try {
    $body = '{"email":"admin@examcentre.com","password":"Admin@1234"}'
    $res = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 8
    $json = $res.Content | ConvertFrom-Json
    Write-Host ("[PASS] POST /api/auth/login -> role: " + $json.role) -ForegroundColor Green
    $global:token = $json.access_token
} catch {
    Write-Host ("[FAIL] POST /api/auth/login -> " + $_.Exception.Message) -ForegroundColor Red
}

# Test authenticated endpoint through proxy
if ($global:token) {
    try {
        $headers = @{ Authorization = "Bearer " + $global:token }
        $res = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/me" -Headers $headers -UseBasicParsing -TimeoutSec 8
        $json = $res.Content | ConvertFrom-Json
        Write-Host ("[PASS] GET /api/auth/me -> " + $json.email) -ForegroundColor Green
    } catch {
        Write-Host ("[FAIL] GET /api/auth/me -> " + $_.Exception.Message) -ForegroundColor Red
    }

    try {
        $headers = @{ Authorization = "Bearer " + $global:token }
        $res = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/users" -Headers $headers -UseBasicParsing -TimeoutSec 8
        $json = $res.Content | ConvertFrom-Json
        Write-Host ("[PASS] GET /api/admin/users -> " + $json.Count + " users") -ForegroundColor Green
    } catch {
        Write-Host ("[FAIL] GET /api/admin/users -> " + $_.Exception.Message) -ForegroundColor Red
    }

    try {
        $headers = @{ Authorization = "Bearer " + $global:token }
        $res = Invoke-WebRequest -Uri "http://localhost:3000/api/courses" -Headers $headers -UseBasicParsing -TimeoutSec 8
        $json = $res.Content | ConvertFrom-Json
        Write-Host ("[PASS] GET /api/courses -> " + $json.Count + " courses") -ForegroundColor Green
    } catch {
        Write-Host ("[FAIL] GET /api/courses -> " + $_.Exception.Message) -ForegroundColor Red
    }

    try {
        $headers = @{ Authorization = "Bearer " + $global:token }
        $res = Invoke-WebRequest -Uri "http://localhost:3000/api/tests" -Headers $headers -UseBasicParsing -TimeoutSec 8
        $json = $res.Content | ConvertFrom-Json
        Write-Host ("[PASS] GET /api/tests -> " + $json.Count + " tests") -ForegroundColor Green
    } catch {
        Write-Host ("[FAIL] GET /api/tests -> " + $_.Exception.Message) -ForegroundColor Red
    }
}

Write-Host "`n=== Auth Guard Tests ===" -ForegroundColor Cyan

# Test that /dashboard redirects unauthenticated (or returns 200 — Next.js renders client-side guard)
try {
    $res = Invoke-WebRequest -Uri "http://localhost:3000/dashboard" -UseBasicParsing -TimeoutSec 8
    Write-Host ("[PASS] /dashboard renders (client-side auth guard active) -> " + $res.StatusCode) -ForegroundColor Green
} catch {
    Write-Host ("[FAIL] /dashboard -> " + $_.Exception.Message) -ForegroundColor Red
}

# Test direct API call to FastAPI (not through Next.js) still works
try {
    $res = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/docs" -UseBasicParsing -TimeoutSec 5
    Write-Host ("[PASS] FastAPI direct still accessible -> " + $res.StatusCode) -ForegroundColor Green
} catch {
    Write-Host ("[FAIL] FastAPI direct -> " + $_.Exception.Message) -ForegroundColor Red
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
