interface RateLimitRecord {
  timestamps: number[];
}

const attemptsMap = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of attemptsMap.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < 60000);
      if (record.timestamps.length === 0) {
        attemptsMap.delete(key);
      }
    }
  }, 300000);
}

/**
 * Check and record flag submission attempt
 * Limit: default 10 submissions per 60 seconds per user/challenge
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  let record = attemptsMap.get(key);

  if (!record) {
    record = { timestamps: [] };
    attemptsMap.set(key, record);
  }

  // Filter out timestamps older than window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= maxAttempts) {
    const oldestTimestamp = record.timestamps[0];
    const resetInMs = Math.max(0, windowMs - (now - oldestTimestamp));
    return {
      allowed: false,
      remaining: 0,
      resetInMs,
    };
  }

  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: maxAttempts - record.timestamps.length,
    resetInMs: windowMs,
  };
}
