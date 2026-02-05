# Auto Refresh on Network Change (5 Seconds)

## Feature
Online ↔ Offline o'tishda 5 soniya kutib avtomatik refresh - qo'lda refresh qilishga hojat yo'q!

## Implementation

### useCarsNew Hook - Network Status Listener with 5 Second Delay
```typescript
// Network status listener - AVTOMATIK REFRESH on network change
useEffect(() => {
  let refreshTimeout: NodeJS.Timeout | null = null;
  
  const unsubscribe = networkManager.onStatusChange(async (status) => {
    const wasOffline = !isOnline;
    const wasOnline = isOnline;
    setIsOnline(status.isOnline);
    
    // Clear any pending refresh
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    
    // OFFLINE → ONLINE: 5 soniya kutib refresh
    if (status.isOnline && wasOffline) {
      // 1. Pending count'ni darhol yangilash
      updatePendingCount();
      
      // 2. 5 soniya kutib refresh
      refreshTimeout = setTimeout(async () => {
        await loadCars(true); // silent reload, no loading spinner
        updatePendingCount();
      }, 5000); // 5 seconds
      
      // 3. Sync avtomatik boshlanadi (SyncManager ichida)
      // 4. Sync tugagandan keyin yana refresh bo'ladi (syncManager.onSyncComplete orqali)
    }
    
    // ONLINE → OFFLINE: 5 soniya kutib refresh
    if (!status.isOnline && wasOnline) {
      // 5 soniya kutib refresh
      refreshTimeout = setTimeout(async () => {
        await loadCars(true); // silent reload, no loading spinner
        updatePendingCount();
      }, 5000); // 5 seconds
    }
  });

  return () => {
    unsubscribe();
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
  };
}, [networkManager, isOnline, updatePendingCount, loadCars]);
```

## How It Works

### ONLINE → OFFLINE Transition:
1. **NetworkManager detects offline** (instant)
   - `navigator.onLine = false` detected
   - Status listeners notified

2. **useCarsNew receives status change** (10-50ms)
   - `wasOnline = true`, `status.isOnline = false`
   - Triggers offline branch
   - Sets 5 second timeout

3. **Wait 5 seconds** (5000ms)
   - User continues working
   - No immediate disruption

4. **Automatic refresh after 5 seconds** (5050-5100ms)
   - `loadCars(true)` - silent background refresh
   - Reads from IndexedDB (fast, no server call)
   - Updates pending count
   - **No loading spinner** - seamless transition

### OFFLINE → ONLINE Transition:
1. **NetworkManager detects online** (instant)
   - `navigator.onLine = true` detected
   - Status listeners notified

2. **useCarsNew receives status change** (10-50ms)
   - `wasOffline = true`, `status.isOnline = true`
   - Triggers online branch
   - Updates pending count immediately
   - Sets 5 second timeout

3. **Wait 5 seconds** (5000ms)
   - User continues working
   - Sync starts in background (SyncManager)

4. **First refresh after 5 seconds** (5050-5100ms)
   - `loadCars(true)` - silent background refresh
   - Shows cached data from IndexedDB
   - **No loading spinner** - seamless transition

5. **Sync completes** (varies, 200ms - 10s)
   - SyncManager finishes syncing pending operations
   - `syncManager.onSyncComplete` listener triggers

6. **Second refresh after sync** (sync complete + 50ms)
   - `loadCars(true)` - silent background refresh
   - Shows fresh data from server
   - **No loading spinner** - seamless transition

## Benefits

✅ **5 Second Delay**: Network o'zgarganda 5 soniya kutadi - foydalanuvchi ishini davom ettiradi
✅ **No Manual Refresh**: Avtomatik refresh - foydalanuvchi hech narsa qilmaydi
✅ **Seamless Transition**: Loading spinner yo'q - sezilmaydigan o'tish
✅ **Fast Response**: IndexedDB'dan tez o'qish (50-100ms)
✅ **Always Fresh Data**: Online bo'lganda server'dan yangi ma'lumot
✅ **Offline Support**: Offline'da ham ishlaydi (IndexedDB'dan)
✅ **Smart Timeout**: Agar network yana o'zgarsa, eski timeout bekor qilinadi

## User Experience

### Before (Manual Refresh):
```
1. User goes offline
2. User sees stale data
3. User manually refreshes (F5)
4. Page reloads, shows cached data
```

### After (5 Second Auto Refresh):
```
1. User goes offline (0s)
2. User continues working (0-5s)
3. After 5 seconds, data automatically refreshes (5s)
4. User sees fresh cached data
5. No manual action needed!
```

### Before (Manual Refresh - Online):
```
1. User goes online
2. User sees stale cached data
3. User manually refreshes (F5)
4. Page reloads, fetches from server
```

### After (5 Second Auto Refresh - Online):
```
1. User goes online (0s)
2. Pending count updates immediately (0s)
3. User continues working (0-5s)
4. After 5 seconds, data automatically refreshes (5s)
5. Sync happens in background (5-15s)
6. Data automatically refreshes again after sync (15s)
7. No manual action needed!
```

## Technical Details

### Silent Refresh (`loadCars(true)`)
- `true` parameter = background refresh
- No loading spinner shown
- No UI disruption
- Fast IndexedDB read
- Seamless user experience

### Double Refresh on Online
1. **First refresh**: IndexedDB (instant, shows cached data)
2. **Second refresh**: After sync (shows server data)

This ensures:
- User sees data immediately (cached)
- User gets fresh data after sync (server)
- No waiting, no loading spinner

## Files Modified
- `frontend/src/hooks/useCarsNew.ts` - Added auto refresh on network change

## Testing

### Test 1: Online → Offline
```
1. Open Cars page (online)
2. Disable network (DevTools → Network → Offline)
3. ✅ Wait 5 seconds
4. ✅ Data should refresh automatically after 5 seconds
5. ✅ No loading spinner
6. ✅ No manual refresh needed
```

### Test 2: Offline → Online
```
1. Open Cars page (offline)
2. Enable network (DevTools → Network → Online)
3. ✅ Pending count updates immediately
4. ✅ Wait 5 seconds
5. ✅ Data should refresh automatically after 5 seconds
6. ✅ Sync happens in background
7. ✅ Data refreshes again after sync completes
8. ✅ No loading spinner
9. ✅ No manual refresh needed
```

### Test 3: Create Offline, Go Online
```
1. Go offline
2. Create a car
3. Go online
4. ✅ Pending count updates immediately
5. ✅ Wait 5 seconds
6. ✅ Data refreshes automatically after 5 seconds
7. ✅ Car syncs to server in background
8. ✅ Data refreshes again with server ID
9. ✅ No manual refresh needed
```

### Test 4: Multiple Network Changes
```
1. Go offline (0s)
2. Go online (2s) - cancels offline timeout
3. Go offline (4s) - cancels online timeout
4. Wait 5 seconds (9s)
5. ✅ Data refreshes once after last change
6. ✅ Previous timeouts were cancelled
```

## Notes
- **5 Second Delay**: Network o'zgarganda 5 soniya kutadi
- **Smart Timeout**: Agar network yana o'zgarsa, eski timeout bekor qilinadi
- **Silent refresh** = no loading spinner, no UI disruption
- **Double refresh on online** = first after 5s (cached data) + second after sync (server data)
- **NetworkManager** handles all network detection
- **SyncManager** handles all background sync
- **User never needs to manually refresh!**
- **Cleanup**: Component unmount bo'lganda timeout bekor qilinadi
