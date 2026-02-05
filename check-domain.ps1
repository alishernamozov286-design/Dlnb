# ============================================
# Domain VPS Checker (PowerShell)
# ============================================
# Check which VPS a domain is pointing to

$DOMAIN = "dalnoboyshop.biznesjon.uz"

Write-Host "🔍 Checking domain: $DOMAIN" -ForegroundColor Cyan
Write-Host "============================================"
Write-Host ""

# 1. DNS A Record (IP address)
Write-Host "📡 DNS A Record (IP Address):" -ForegroundColor Yellow
try {
    $dnsResult = Resolve-DnsName -Name $DOMAIN -Type A -ErrorAction Stop
    foreach ($record in $dnsResult) {
        if ($record.Type -eq "A") {
            Write-Host "  IP: $($record.IPAddress)" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "  ❌ Cannot resolve DNS" -ForegroundColor Red
}

Write-Host ""

# 2. Ping Test
Write-Host "🏓 Ping Test:" -ForegroundColor Yellow
try {
    $pingResult = Test-Connection -ComputerName $DOMAIN -Count 1 -ErrorAction Stop
    Write-Host "  IP: $($pingResult.IPV4Address)" -ForegroundColor Green
    Write-Host "  Response Time: $($pingResult.ResponseTime)ms" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Cannot ping domain" -ForegroundColor Red
}

Write-Host ""

# 3. Full DNS Information
Write-Host "📋 Full DNS Information:" -ForegroundColor Yellow
try {
    $allRecords = Resolve-DnsName -Name $DOMAIN -ErrorAction Stop
    foreach ($record in $allRecords) {
        Write-Host "  Type: $($record.Type), Value: $($record.IPAddress)$($record.NameHost)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ❌ Cannot get DNS records" -ForegroundColor Red
}

Write-Host ""

# 4. HTTP/HTTPS Check
Write-Host "🌐 HTTP/HTTPS Check:" -ForegroundColor Yellow

# HTTP Check
Write-Host "  HTTP Status:" -ForegroundColor Cyan
try {
    $httpResponse = Invoke-WebRequest -Uri "http://$DOMAIN" -Method Head -TimeoutSec 5 -ErrorAction Stop
    Write-Host "    Status: $($httpResponse.StatusCode) $($httpResponse.StatusDescription)" -ForegroundColor Green
} catch {
    Write-Host "    ❌ Cannot connect via HTTP" -ForegroundColor Red
}

# HTTPS Check
Write-Host "  HTTPS Status:" -ForegroundColor Cyan
try {
    $httpsResponse = Invoke-WebRequest -Uri "https://$DOMAIN" -Method Head -TimeoutSec 5 -ErrorAction Stop
    Write-Host "    Status: $($httpsResponse.StatusCode) $($httpsResponse.StatusDescription)" -ForegroundColor Green
} catch {
    Write-Host "    ❌ Cannot connect via HTTPS" -ForegroundColor Red
}

Write-Host ""

# 5. Traceroute
Write-Host "🗺️  Network Path (first 5 hops):" -ForegroundColor Yellow
try {
    $traceResult = Test-NetConnection -ComputerName $DOMAIN -TraceRoute -Hops 5 -ErrorAction Stop
    Write-Host "  Target IP: $($traceResult.RemoteAddress)" -ForegroundColor Green
    Write-Host "  Hops:" -ForegroundColor Cyan
    foreach ($hop in $traceResult.TraceRoute) {
        Write-Host "    → $hop" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⚠️  Traceroute not available or failed" -ForegroundColor Yellow
}

Write-Host ""

# 6. WHOIS Information (if available)
Write-Host "📝 Additional Info:" -ForegroundColor Yellow
try {
    $ip = (Resolve-DnsName -Name $DOMAIN -Type A -ErrorAction Stop)[0].IPAddress
    Write-Host "  Resolved IP: $ip" -ForegroundColor Green
    
    # Try to get geolocation info
    try {
        $geoInfo = Invoke-RestMethod -Uri "http://ip-api.com/json/$ip" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "  Location: $($geoInfo.city), $($geoInfo.country)" -ForegroundColor Cyan
        Write-Host "  ISP: $($geoInfo.isp)" -ForegroundColor Cyan
        Write-Host "  Organization: $($geoInfo.org)" -ForegroundColor Cyan
    } catch {
        Write-Host "  ⚠️  Geolocation info not available" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Cannot get additional info" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Check complete!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 To check if this is YOUR VPS:" -ForegroundColor Yellow
Write-Host "   1. Note the IP address above"
Write-Host "   2. SSH to your VPS: ssh user@YOUR_VPS_IP"
Write-Host "   3. Run on VPS: curl ifconfig.me"
Write-Host "   4. Compare the IPs"
Write-Host ""
Write-Host "🔧 Quick Commands:" -ForegroundColor Yellow
Write-Host "   Check your VPS IP: ssh user@vps_ip 'curl -s ifconfig.me'"
Write-Host "   Check domain IP:   nslookup $DOMAIN"
Write-Host ""
