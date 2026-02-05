# Production VPS Deployment Guide - Multiple Sites

Bu guide VPS serverda bir nechta saytlarni unique portlarda deploy qilish uchun.

## 🎯 Port Strategy

Har bir sayt uchun 3 ta unique port kerak:
- **Frontend Port**: 8001, 8002, 8003, ...
- **Backend Port**: 4001, 4002, 4003, ...
- **MongoDB Port**: 27018, 27019, 27020, ...

## 📋 Prerequisites

```bash
# VPS'da Docker va Docker Compose o'rnatilgan bo'lishi kerak
docker --version
docker-compose --version

# Agar yo'q bo'lsa:
curl -fsSL https://get.docker.com 