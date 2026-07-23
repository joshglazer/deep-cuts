"use client";

import { formatDate, formatTime } from "@/lib/formatDate";
import { useHasMounted } from "@/lib/useHasMounted";
import { VStack } from "../atoms/Stack";
import { Text } from "../atoms/Text";

interface ListenEventTimestampProps {
  playedAt: string;
}

export function ListenEventTimestamp({ playedAt }: Readonly<ListenEventTimestampProps>) {
  const hasMounted = useHasMounted();

  // The server doesn't know the visitor's timezone, so the date/time can
  // only be localized once this renders in the browser.
  if (!hasMounted) {
    return null;
  }

  return (
    <VStack gap="sm" hAlign="end">
      <Text type="supporting" color="secondary" maxLines={1}>
        {formatDate(playedAt)}
      </Text>
      <Text type="supporting" color="secondary" maxLines={1}>
        {formatTime(playedAt)}
      </Text>
    </VStack>
  );
}
