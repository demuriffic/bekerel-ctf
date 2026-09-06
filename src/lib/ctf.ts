import { db, ctfSettings } from '@/db';
import { eq } from 'drizzle-orm';
import { initDb } from '@/db/migrate';

export interface CtfStatus {
  hasStarted: boolean;
  hasEnded: boolean;
  isPaused: boolean;
  isActive: boolean;
  startTime: string | null;
  endTime: string | null;
}

export async function getCtfStatus(): Promise<CtfStatus> {
  await initDb();
  const [settings] = await db.select().from(ctfSettings).where(eq(ctfSettings.id, 1)).limit(1);

  if (!settings) {
    return {
      hasStarted: true,
      hasEnded: false,
      isPaused: false,
      isActive: true,
      startTime: null,
      endTime: null,
    };
  }

  const now = new Date();
  const start = settings.startTime ? new Date(settings.startTime) : null;
  const end = settings.endTime ? new Date(settings.endTime) : null;
  const isPaused = Boolean(settings.isPaused);

  const hasStarted = start ? now >= start : true;
  const hasEnded = end ? now > end : false;
  const isActive = hasStarted && !hasEnded && !isPaused;

  return {
    hasStarted,
    hasEnded,
    isPaused,
    isActive,
    startTime: start ? start.toISOString() : null,
    endTime: end ? end.toISOString() : null,
  };
}
