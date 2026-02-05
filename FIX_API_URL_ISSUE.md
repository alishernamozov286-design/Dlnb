# API URL Issue Fix - `/api/api/cars` → `/api/cars`

## Muammo
Browser'da `/api/api/cars` URL'iga request yuborilmoqda va 404 xatosi qaytmoqda.

## Sabab
- `api.config.ts` da `BASE_URL = '/api'`
- `CarsRepository.ts` da endpoint `'/api/cars'` edi
- Natijada: `/api` + `/api/cars` = `/api/api/cars` ❌

## Yechim
Endpoint'lardan `/api` prefiksini olib tashladik:

### 1. CarsRepository.ts
```typescript
protected getApiEndpoint(): string {
  return '/cars'; // BASE_URL already includes /api
}
```

### 2. SyncManager.ts
```typescript
private getEndpoint(collection: string): string {
  const endpoints: Record<string, string> = {
    cars: '/cars',
    debts: '/debts',
    tasks: '/tasks',
    services: '/services',
    spareParts: '/spare-parts'
  };

  return endpoints[collection] || `/${collection}`;
}
```

## Browser Cache Muammosi

Agar xatolik hali ham ko'rinayotgan bo'lsa, browser cache'da eski kod qolgan bo'lishi mumkin.

### Yechim:

1. **Vite Dev Server'ni Restart Qiling**:
   ```bash
   # Terminal'da Ctrl+C bosing
   # Keyin qayta ishga tushiring:
   npm run dev
   ```

2. **Browser'da Hard Refresh Qiling**:
   - **Windows/Linux**: `Ctrl + Shift + R` yoki `Ctrl + F5`
   - **Mac**: `Cmd + Shift + R`

3. **Yoki Browser Cache'ni To'liq Tozalang**:
   - Chrome: DevTools → Network → "Disable cache" checkbox
   - Yoki: Settings → Privacy → Clear browsing data

4. **Incognito/Private Window'da Sinab Ko'ring**:
   - Bu cache muammosini tezda aniqlash uchun

## Tekshirish

Browser DevTools → Network tab'da:
- ✅ To'g'ri: `GET http://localhost:8080/api/cars`
- ❌ Noto'g'ri: `GET http://localhost:8080/api/api/cars`

## Qo'shimcha

Agar muammo davom etsa:

1. `node_modules` va `dist` papkalarini o'chiring:
   ```bash
   rm -rf node_modules dist
   npm install
   npm run dev
   ```

2. Browser'ni to'liq yoping va qayta oching

3. Boshqa browser'da sinab ko'ring

---

**Status**: ✅ Code Fixed - Browser cache'ni tozalash kerak
**Date**: 2026-02-05
