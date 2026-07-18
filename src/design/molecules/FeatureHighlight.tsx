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
    <VStack gap="sm">
      <HStack hAlign="center" vAlign="center" className="h-11 w-11 rounded-full bg-accent-muted">
        {icon}
      </HStack>
      <VStack gap="sm">
        <Heading level={3}>{title}</Heading>
        <Text type="supporting">{description}</Text>
      </VStack>
    </VStack>
  );
}
