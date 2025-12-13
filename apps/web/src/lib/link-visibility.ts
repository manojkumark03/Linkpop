import type { Prisma } from '@prisma/client';

type LinkWithMetadata = {
  status: 'ACTIVE' | 'HIDDEN' | 'ARCHIVED';
  deletedAt: Date | null;
  metadata: Prisma.JsonValue;
};

export function isLinkVisible(link: LinkWithMetadata, now = new Date()): boolean {
  if (link.deletedAt) return false;
  if (link.status !== 'ACTIVE') return false;

  if (!link.metadata || typeof link.metadata !== 'object') return true;

  const schedule = (link.metadata as Record<string, any>).schedule as
    | { startsAt?: string; endsAt?: string }
    | undefined;

  if (!schedule) return true;

  const startsAt = schedule.startsAt ? new Date(schedule.startsAt) : null;
  const endsAt = schedule.endsAt ? new Date(schedule.endsAt) : null;

  if (startsAt && !Number.isNaN(startsAt.getTime()) && now < startsAt) return false;
  if (endsAt && !Number.isNaN(endsAt.getTime()) && now > endsAt) return false;

  return true;
}
