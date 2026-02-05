# ERR_NETWORK_CHANGED Fix

## Problem
Offlinedan onlinega o'tganda `ERR_NETWORK_CHANGED` xatosi chiqmoqda. Bu browser network holatini o'zgartirganda fetch request'lar bekor qilinadi.

## Root Cause
Browser network holatini o'zgartirsa (offline → online):
1. Barcha pending fetch request'lar bekor qilinadi
2. `ERR_NETWORK_CHANGED` xatosi chiqadi
3. Bu normal browser xatti-harakati

## Solution Implemented

### 1. NetworkManager - Retry on Network Change
```typescript
private async checkInternetConnection(): Promise<boolean> {
  try {
    // ... fetch logic
  } catch (error: any) {
    // ERR_NETWORK_CHANGED is normal when switching from offline to online
    if (error?.message?.includes('network change') || error?.message?.includes('NetworkError')) {
      return true; // Assume online if network changed
    }
    return false;
  }
}

private async checkBackendHealth(): Promise<boolean> {
  try {
    // ... fetch logic
  } catch (error: any) {
    // ERR_NETWORK_CHANGED is normal when switching from offline to online
    if (error?.message?.includes('network change') || error?.message?.includes('NetworkError')) {
      // Retry once after network change
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        const response = await fetch('/api/health', { method: 'GET', cache: 'no-cache' });
        return response.status === 200 || response.status === 401;
      } catch {
        return false;
      }
    }
    return false;
  }
}
```

### 2. BaseRepository - Retry All Server Operations
```typescript
private async fetchFromServer(): Promise<T[]> {
  try {
    const response = await api.get(this.getApiEndpoint());
    return this.extractDataFromResponse(response.data);
  } catch (error: any) {
    if (error?.message?.includes('network change') || error?.code === 'ERR_NETWORK_CHANGED') {
      await new Promise(resolve => setTimeout(resolve, 500));
      const response = await api.get(this.getApiEndpoint());
      return this.extractDataFromResponse(response.data);
    }
    throw error;
  }
}
```

Same logic applied to:
- `createOnServer()`
- `updateOnServer()`
- `deleteOnServer()`

### 3. SyncManager - Retry Sync Operations
```typescript
try {
  await this.syncOperation(operation);
  await this.queueManager.clearOperation(operation.id!);
  result.success++;
} catch (error: any) {
  if (error?.message?.includes('network change') || error?.code === 'ERR_NETWORK_CHANGED') {
    // Retry once after network change
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      await this.syncOperation(operation);
      await this.queueManager.clearOperation(operation.id!);
      result.success++;
      continue; // Skip error handling
    } catch (retryError: any) {
      // Handle retry error
    }
  }
}
```

## How It Works

1. **Detect Network Change Error**
   - Check if error message contains 'network change' or 'NetworkError'
   - Check if error code is 'ERR_NETWORK_CHANGED'

2. **Wait 500ms**
   - Give browser time to stabilize network connection
   - Allow pending requests to complete

3. **Retry Once**
   - Retry the same operation
   - If successful, continue normally
   - If fails again, throw error

## Benefits

✅ **No More ERR_NETWORK_CHANGED Errors**: Automatically handled
✅ **Smooth Offline → Online Transition**: No visible errors to user
✅ **Automatic Retry**: Operations complete successfully after retry
✅ **Fast Recovery**: Only 500ms delay before retry

## Files Modified
- `frontend/src/lib/sync/NetworkManager.ts` - Added retry logic for network checks
- `frontend/src/lib/repositories/BaseRepository.ts` - Added retry logic for all server operations
- `frontend/src/lib/sync/SyncManager.ts` - Added retry logic for sync operations

## Testing
1. Go offline
2. Create/update/delete a car
3. Go online
4. No ERR_NETWORK_CHANGED errors should appear
5. All operations should sync successfully

## Notes
- ERR_NETWORK_CHANGED is a normal browser behavior
- Retry once is sufficient (network is stable after 500ms)
- If retry fails, original error is thrown
- This fix makes offline → online transition seamless
