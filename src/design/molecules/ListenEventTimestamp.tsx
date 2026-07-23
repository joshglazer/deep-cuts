"use client";

import { useSyncExternalStore } from "react";
import { formatDate, formatTime } from "@/lib/formatDate";
import { VStack } from "../atoms/Stack";
import { Text } from "../atoms/Text";

interface ListenEventTimestampProps {
  playedAt: string;
}

function subscribe() {
  return () => {};
}

// The server doesn't know the visitor's timezone, so the date/time can only
// be localized once this renders in the browser; reporting "not mounted yet"
// on the server (and on the client's first render, before hydration) avoids
// a mismatch between the server's timezone and the visitor's.
function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

export function ListenEventTimestamp({ playedAt }: Readonly<ListenEventTimestampProps>) {
  const hasMounted = useHasMounted();

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
