# Offline Transition Progress Bar Fix

## Muammo
Offline rejimga o'tganda modal 0% da qolib ketgan, progress bar to'lmagan.

## Sabab
1. Progress bar animatsiya to'g'ri ishlamagan
2. Dependency loop muammosi (`isVisible` state)
3. Interval to'g'ri tozalanmagan

## Yechim

### 1. Progress Animation - 1.5 sekund
**Fayl:** `frontend/src/components/OfflineTransitionModal.tsx`

**O'zgarishlar:**
```typescript
// Progress animation (0-100% in 1.5 seconds)
let currentProgress = 0;
const totalDuration = 1500; // 1.5 sekund
const updateInterval = 30; // 30ms har safar yangilanadi
const totalSteps = totalDuration / updateInterval; // 50 ta step
const progressPerStep = 100 / totalSteps; // Har step uchun progress (2%)

progressInterval = setInterval(() => {
  currentProgress += progressPerStep;
  
  // Progress 100% dan oshmasligi uchun
  if (currentProgress > 100) {
    currentProgress = 100;
  }
  
  setProgress(Math.floor(currentProgress));
  
  // Status messages
  if (currentProgress >= 30 && currentProgress < 40) {
    setStatus(t('Ma\'lumotlar yuklanmoqda...', language));
  }
  
  if (currentProgress >= 70 && currentProgress < 80) {
    setStatus(t('Tayyor bo\'lmoqda...', language));
  }
  
  if (currentProgress >= 100) {
    clearInterval(progressInterval);
    setProgress(100);
    setStatus(t('Tayyor!', language));
    
    // Auto-hide after 500ms
    hideTimeout = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 500);
  }
}, updateInterval);
```

### 2. Dependency Loop Fix
**Muammo:** `isVisible` state dependency loop yaratgan

**Yechim:** `lastOfflineState` flag qo'shildi
```typescript
let lastOfflineState = false;

const unsubscribe = networkManager.onStatusChange((networkStatus) => {
  const isCurrentlyOffline = !networkStatus.isOnline;
  
  // ONLINE → OFFLINE transition (faqat bir marta trigger bo'lishi uchun)
  if (isCurrentlyOffline && !lastOfflineState) {
    lastOfflineState = true;
    // ... progress animation
  } else if (!isCurrentlyOffline) {
    lastOfflineState = false;
  }
});
```

### 3. Interval Cleanup
**Muammo:** Interval to'g'ri tozalanmagan

**Yechim:**
```typescript
// Clear any existing intervals
if (progressInterval) {
  clearInterval(progressInterval);
  progressInterval = null;
}
if (hideTimeout) {
  clearTimeout(hideTimeout);
  hideTimeout = null;
}
```

### 4. CSS Transition
**Muammo:** Progress bar transition juda sekin

**Yechim:**
```tsx
<div 
  className="... transition-all duration-100 ease-linear"
  style={{ width: `${progress}%` }}
>
```

## Natija

### Timeline
1. **0ms:** Modal ko'rsatiladi
2. **0-1500ms:** Progress bar 0% → 100% (smooth animation)
   - 0-30%: "Offline rejimga o'tish boshlandi"
   - 30-70%: "Ma'lumotlar yuklanmoqda..."
   - 70-100%: "Tayyor bo'lmoqda..."
3. **1500ms:** Progress 100%, "Tayyor!" xabari
4. **2000ms:** Modal avtomatik yopiladi (500ms keyin)

### Xususiyatlar
- ✅ Progress bar smooth animation (30ms interval)
- ✅ 50 ta step (har biri 2%)
- ✅ Linear transition (100ms CSS)
- ✅ Dependency loop hal qilindi
- ✅ Interval to'g'ri tozalanadi
- ✅ Bir marta trigger bo'ladi

## Test qilish
1. VPS'da saytni oching
2. Internet o'chiring
3. Modal darhol ko'rinishi kerak
4. Progress bar 1.5 sekundda 0% → 100% to'lishi kerak
5. "Tayyor!" xabari ko'rinishi kerak
6. 500ms keyin modal yopilishi kerak
7. Offline rejim ochilishi kerak

## Xulosa
Progress bar endi to'g'ri ishlaydi - 1.5 sekundda 0% dan 100% ga smooth animation bilan to'ladi.
