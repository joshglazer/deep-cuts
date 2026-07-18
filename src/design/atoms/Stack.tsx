import {
  HStack as AstryxHStack,
  VStack as AstryxVStack,
  type HStackProps as AstryxHStackProps,
  type VStackProps as AstryxVStackProps,
} from "@astryxdesign/core/Stack";

export { StackItem, type StackItemProps } from "@astryxdesign/core/Stack";

/** Preset gap sizes, mapped to the theme's spacing scale below. */
export type StackGap = "sm" | "md" | "lg";

const GAP_SCALE = { sm: 2, md: 4, lg: 6 } as const;

export interface HStackProps extends Omit<AstryxHStackProps, "gap"> {
  gap?: StackGap;
}

export function HStack({ gap, ...props }: Readonly<HStackProps>) {
  return <AstryxHStack gap={gap && GAP_SCALE[gap]} {...props} />;
}
HStack.displayName = "HStack";

export interface VStackProps extends Omit<AstryxVStackProps, "gap"> {
  gap?: StackGap;
}

export function VStack({ gap, ...props }: Readonly<VStackProps>) {
  return <AstryxVStack gap={gap && GAP_SCALE[gap]} {...props} />;
}
VStack.displayName = "VStack";
