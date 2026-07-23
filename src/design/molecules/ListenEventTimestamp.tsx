"use client";

import { useEffect, useState } from "react";
import { formatDate, formatTime } from "@/lib/formatDate";
import { VStack } from "../atoms/Stack";
import { Text } from "../atoms/Text";

interface ListenEventTimestampProps {
  playedAt: string;
}

export function ListenEventTimestamp({ playedAt }: Readonly<ListenEventTimestampProps>) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // The server doesn't know the visitor's timezone, so the date/time can only
  // be localized once this renders in the browser; rendering nothing until
  // then avoids a hydration mismatch between the server's timezone and the
  // visitor's.
  if (!isMounted) {
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
