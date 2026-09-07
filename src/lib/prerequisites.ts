import { db, challenges } from '@/db';

/**
 * Checks whether setting `candidatePrerequisiteId` as the prerequisite for `targetChallengeId`
 * would introduce a circular dependency (e.g. A -> B -> A).
 */
export async function hasPrerequisiteCycle(
  targetChallengeId: string,
  candidatePrerequisiteId: string
): Promise<boolean> {
  if (!targetChallengeId || !candidatePrerequisiteId) return false;
  if (targetChallengeId === candidatePrerequisiteId) return true;

  const allChallenges = await db
    .select({ id: challenges.id, prerequisiteId: challenges.prerequisiteId })
    .from(challenges);

  const prereqMap = new Map<string, string | null>();
  for (const c of allChallenges) {
    prereqMap.set(c.id, c.prerequisiteId);
  }

  // Walk the chain starting from candidatePrerequisiteId
  let current: string | null | undefined = candidatePrerequisiteId;
  const visited = new Set<string>([targetChallengeId]);

  while (current) {
    if (visited.has(current)) {
      return true; // Cycle detected!
    }
    visited.add(current);
    current = prereqMap.get(current);
  }

  return false;
}
