#!/bin/bash

# ============================================
# Secure Password & Secret Generator
# ============================================
# This script generates secure passwords and secrets for production

echo "🔐 Secure Password & Secret Generator"
echo "============================================"
echo ""
echo "Copy these values to your .env.production file:"
echo ""

# Check if openssl is available
if ! command -v openssl >/dev/null 2>&1; then
    echo "❌ Error: openssl not found!"
    echo "   Install it: sudo apt install openssl"
    exit 1
fi

# Generate MongoDB password (32 characters)
echo "# MongoDB Root Password (32 characters)"
echo "MONGO_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)"
echo ""

# Generate JWT Secret (64 characters)
echo "# JWT Secret (64 characters)"
echo "JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')"
echo ""

# Generate additional secrets if needed
echo "# Additional Secrets (optional)"
echo "SESSION_SECRET=$(openssl rand -base64 32 | tr -d '\n')"
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo ""

echo "============================================"
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "============================================"
echo "1. Never commit these secrets to git"
echo "2. Store them securely (password manager)"
echo "3. Use different secrets for each environment"
echo "4. Rotate secrets periodically"
echo "5. Never share secrets in plain text"
echo ""
