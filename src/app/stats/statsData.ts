import { dataClient } from "@/lib/amplify-server";

export interface TrendStat {
  count: number;
  previousCount: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  isFuture: boolean;
}

export interface StatsData {
  totalStreams: number;
  thisWeek: TrendStat;
  thisMonth: TrendStat;
  streakDays: number;
  heatmap: HeatmapDay[];
}

const HEATMAP_WEEKS = 52;

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function sumRange(dailyCounts: Map<string, number>, startKey: string, endKey: string): number {
  let total = 0;
  for (const [dateKey, count] of dailyCounts) {
    if (dateKey >= startKey && dateKey <= endKey) total += count;
  }
  return total;
}

// A streak counts as "alive" through today even before today's first stream
// lands, so it only reads as broken once a full day has passed with nothing
// played — otherwise it would flicker to 0 every morning before your first
// listen of the day.
function computeStreak(dailyCounts: Map<string, number>, todayKey: string): number {
  let anchor = todayKey;
  if (!dailyCounts.has(anchor)) {
    anchor = addDays(anchor, -1);
    if (!dailyCounts.has(anchor)) return 0;
  }

  let streak = 0;
  let cursor = anchor;
  while (dailyCounts.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function levelFor(count: number, thresholds: readonly number[]): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= thresholds[0]) return 1;
  if (count <= thresholds[1]) return 2;
  if (count <= thresholds[2]) return 3;
  return 4;
}

function buildHeatmap(dailyCounts: Map<string, number>, todayKey: string): HeatmapDay[] {
  const todayDayOfWeek = new Date(`${todayKey}T00:00:00Z`).getUTCDay();
  const mostRecentSunday = addDays(todayKey, -todayDayOfWeek);
  const startKey = addDays(mostRecentSunday, -7 * (HEATMAP_WEEKS - 1));

  const days: { date: string; count: number; isFuture: boolean }[] = [];
  let cursor = startKey;
  for (let i = 0; i < HEATMAP_WEEKS * 7; i++) {
    const isFuture = cursor > todayKey;
    days.push({ date: cursor, count: isFuture ? 0 : (dailyCounts.get(cursor) ?? 0), isFuture });
    cursor = addDays(cursor, 1);
  }

  // Quartile buckets over days that actually had plays, so intensity scales
  // to this user's own listening volume rather than a fixed count like
  // GitHub's commit-graph thresholds.
  const nonZeroCounts = days.map((day) => day.count).filter((count) => count > 0);
  nonZeroCounts.sort((a, b) => a - b);
  const thresholds = [0.25, 0.5, 0.75].map(
    (p) => nonZeroCounts[Math.min(nonZeroCounts.length - 1, Math.floor(p * nonZeroCounts.length))] ?? 0
  );

  return days.map((day) => ({
    ...day,
    level: levelFor(day.count, thresholds),
  }));
}

export async function getStats(spotifyUserId: string): Promise<StatsData> {
  const { data: allEvents } =
    await dataClient.models.ListenEvent.listListenEventBySpotifyUserIdAndSpotifyAlbumId({
      spotifyUserId,
    });
  const events = allEvents.filter((event) => !event.excludedAt);

  const dailyCounts = new Map<string, number>();
  for (const event of events) {
    const dateKey = event.playedAt.slice(0, 10);
    dailyCounts.set(dateKey, (dailyCounts.get(dateKey) ?? 0) + 1);
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const [year, month] = todayKey.split("-").map(Number);

  // Week/month trends compare period-to-date against the same number of
  // days into the previous period, rather than a full previous period —
  // otherwise checking stats early in a week/month always looks like a
  // decline relative to the previous period's full total.
  const dayOfWeek = new Date(`${todayKey}T00:00:00Z`).getUTCDay();
  const weekStartKey = addDays(todayKey, -dayOfWeek);
  const daysIntoWeek = dayOfWeek + 1;
  const previousWeekStartKey = addDays(weekStartKey, -7);
  const previousWeekEndKey = addDays(previousWeekStartKey, daysIntoWeek - 1);

  const monthStartKey = `${todayKey.slice(0, 7)}-01`;
  const daysIntoMonth = Number(todayKey.slice(8, 10));
  const previousMonthEndDate = new Date(Date.UTC(year, month - 1, 0));
  const previousMonthStartKey = previousMonthEndDate.toISOString().slice(0, 8) + "01";
  const daysInPreviousMonth = previousMonthEndDate.getUTCDate();
  const previousMonthEndKey = addDays(
    previousMonthStartKey,
    Math.min(daysIntoMonth, daysInPreviousMonth) - 1
  );

  return {
    totalStreams: events.length,
    thisWeek: {
      count: sumRange(dailyCounts, weekStartKey, todayKey),
      previousCount: sumRange(dailyCounts, previousWeekStartKey, previousWeekEndKey),
    },
    thisMonth: {
      count: sumRange(dailyCounts, monthStartKey, todayKey),
      previousCount: sumRange(dailyCounts, previousMonthStartKey, previousMonthEndKey),
    },
    streakDays: computeStreak(dailyCounts, todayKey),
    heatmap: buildHeatmap(dailyCounts, todayKey),
  };
}
