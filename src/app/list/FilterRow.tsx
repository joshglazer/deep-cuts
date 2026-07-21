import type { ReactNode } from "react";
import { HStack } from "@/design/atoms/Stack";
import { Text } from "@/design/atoms/Text";

interface FilterRowProps {
  label: string;
  children: ReactNode;
}

// The label sits outside the control, in a fixed-width column, so the
// controls line up with each other across rows.
export function FilterRow({ label, children }: Readonly<FilterRowProps>) {
  return (
    <HStack gap="sm" vAlign="center">
      <Text type="label" as="label" textWrap="nowrap" className="w-20 shrink-0">
        {label}
      </Text>
      {children}
    </HStack>
  );
}
