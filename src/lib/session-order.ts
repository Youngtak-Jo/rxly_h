type SessionListSortable = {
  id: string
  title: string | null
  startedAt: string | Date
  updatedAt?: string | Date | null
}

export const EXAMPLE_SESSION_TITLE_PREFIX = "Example ·"

export function isExampleSessionTitle(title: string | null | undefined): boolean {
  return title?.startsWith(EXAMPLE_SESSION_TITLE_PREFIX) ?? false
}

export function isExampleSession(
  session: Pick<SessionListSortable, "title">
): boolean {
  return isExampleSessionTitle(session.title)
}

function toTimestamp(value: string | Date | null | undefined): number {
  if (!value) return 0

  const timestamp =
    value instanceof Date ? value.getTime() : new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

export function compareSessionsForList(
  left: SessionListSortable,
  right: SessionListSortable
): number {
  const leftIsExample = isExampleSession(left)
  const rightIsExample = isExampleSession(right)

  if (leftIsExample !== rightIsExample) {
    return leftIsExample ? 1 : -1
  }

  const startedAtDiff = toTimestamp(right.startedAt) - toTimestamp(left.startedAt)
  if (startedAtDiff !== 0) {
    return startedAtDiff
  }

  const updatedAtDiff = toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt)
  if (updatedAtDiff !== 0) {
    return updatedAtDiff
  }

  return left.id.localeCompare(right.id)
}

export function sortSessionsForList<T extends SessionListSortable>(
  sessions: T[]
): T[] {
  return [...sessions].sort((left, right) => compareSessionsForList(left, right))
}
