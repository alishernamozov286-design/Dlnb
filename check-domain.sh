#!/bin/bash

# ============================================
# Domain VPS Checker
# ============================================
# Check which VPS a domain is pointing to

DOMAIN="dalnoboyshop.biznesjon.uz"

echo "🔍 Checking domain: $DOMAIN"
echo "============================================"
echo ""

# 1. DNS A Record (IP address)
echo "📡 DNS A Record (IP Address):"
if command -v nslookup >/dev/null 2>&1; then
    nslookup $DOMAIN | grep -A1 "Name:" | grep "Address:" | tail -1
elif command -v dig >/dev/null 2>&1; then
    dig +short $DOMAIN A
elif command -v host >/dev/null 2>&1; then
    host $DOMAIN | grep "has address"
else
    echo "⚠️  Install nslookup, dig, or host command"
fi

echo ""

# 2. Ping to get IP
echo "🏓 Ping Test:"
if command -v ping >/dev/null 2>&1; then
    ping -c 1 $DOMAIN 2>/dev/null | grep "PING" | awk '{print $3}' | tr -d '()'
else
    echo "⚠️  Ping not available"
fi

echo ""

# 3. Full DNS info
echo "📋 Full DNS Information:"
if command -v dig >/dev/null 2>&1; then
    dig $DOMAIN ANY +noall +answer
elif command -v nslookup >/dev/null 2>&1; then
    nslookup -type=ANY $DOMAIN
else
    echo "⚠️  Install dig or nslookup for detailed info"
fi

echo ""

# 4. HTTP/HTTPS Check
echo "🌐 HTTP/HTTPS Check:"
if command -v curl >/dev/null 2>&1; then
    echo "HTTP Status:"
    curl -I -s -o /dev/null -w "  Status: %{http_code}\n  IP: %{remote_ip}\n" http://$DOMAIN --connect-timeout 5 2>/dev/null || echo "  ❌ Cannot connect via HTTP"
    
    echo ""
    echo "HTTPS Status:"
    curl -I -s -o /dev/null -w "  Status: %{http_code}\n  IP: %{remote_ip}\n" https://$DOMAIN --connect-timeout 5 2>/dev/null || echo "  ❌ Cannot connect via HTTPS"
else
    echo "⚠️  Install curl for HTTP checks"
fi

echo ""

# 5. Traceroute (optional)
echo "🗺️  Network Path (first 5 hops):"
if command -v traceroute >/dev/null 2>&1; then
    traceroute -m 5 $DOMAIN 2>/dev/null | head -6
elif command -v tracert >/dev/null 2>&1; then
    tracert -h 5 $DOMAIN 2>/dev/null | head -8
else
    echo "⚠️  Traceroute not available"
fi

echo ""
echo "============================================"
echo "✅ Check complete!"
echo ""
echo "💡 To check if this is YOUR VPS:"
echo "   1. Note the IP address above"
echo "   2. SSH to your VPS: ssh user@YOUR_VPS_IP"
echo "   3. Run: curl ifconfig.me"
echo "   4. Compare the IPs"
echo ""
