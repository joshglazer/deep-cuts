import type { HeatmapDay } from "./statsData";
import { Card } from "@/design/atoms/Card";
import { HStack, VStack } from "@/design/atoms/Stack";
import { Text } from "@/design/atoms/Text";

interface ActivityHeatmapProps {
  days: HeatmapDay[];
}

// Level 0 stays transparent rather than a filled color, so it reads as an
// empty cell against the Card's own background (light or dark) instead of
// needing a hardcoded white that would look wrong in dark mode.
const LEVEL_CLASSES: Record<HeatmapDay["level"], string> = {
  0: "bg-transparent",
  1: "bg-accent-bg/25",
  2: "bg-accent-bg/45",
  3: "bg-accent-bg/70",
  4: "bg-accent-bg",
};

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function chunkIntoWeeks(days: HeatmapDay[]): HeatmapDay[][] {
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

function monthLabel(week: HeatmapDay[], previousWeek: HeatmapDay[] | undefined): string {
  const month = week[0].date.slice(0, 7);
  const previousMonth = previousWeek?.[0]?.date.slice(0, 7);
  if (month === previousMonth) return "";
  return MONTH_FORMATTER.format(new Date(`${week[0].date}T00:00:00Z`));
}

export function ActivityHeatmap({ days }: Readonly<ActivityHeatmapProps>) {
  const weeks = chunkIntoWeeks(days);

  return (
    <Card>
      <VStack gap="sm">
        <Text type="supporting">Listening activity</Text>
        <div className="overflow-x-auto">
          <HStack gap="sm" className="w-fit">
            {weeks.map((week, index) => (
              <VStack key={week[0].date} gap="sm" className="w-3">
                <Text type="supporting" size="2xs" className="h-4 whitespace-nowrap">
                  {monthLabel(week, weeks[index - 1])}
                </Text>
                <VStack gap="sm">
                  {week.map((day) =>
                    day.isFuture ? (
                      <div key={day.date} className="h-3 w-3" />
                    ) : (
                      <div
                        key={day.date}
                        title={`${day.count} ${day.count === 1 ? "song" : "songs"} streamed on ${DAY_FORMATTER.format(new Date(`${day.date}T00:00:00Z`))}`}
                        className={`h-3 w-3 rounded-sm border border-border ${LEVEL_CLASSES[day.level]}`}
                      />
                    )
                  )}
                </VStack>
              </VStack>
            ))}
          </HStack>
        </div>
      </VStack>
    </Card>
  );
}
