import type { ReactNode } from "react";
import { Heading } from "../atoms/Heading";
import { HStack, VStack } from "../atoms/Stack";
import { Text } from "../atoms/Text";

interface FeatureHighlightProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function FeatureHighlight({
  icon,
  title,
  description,
}: Readonly<FeatureHighlightProps>) {
  return (
    <VStack gap="sm" hAlign="center">
      <HStack hAlign="center" vAlign="center" className="h-11 w-11 shrink-0 rounded-full bg-accent-muted">
        {icon}
      </HStack>
      <Heading level={3} justify="center">{title}</Heading>
      <Text type="supporting" justify="center">{description}</Text>
    </VStack>
  );
}
