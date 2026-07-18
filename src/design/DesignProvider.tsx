"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import { Theme } from "@astryxdesign/core/theme";
import { LinkProvider } from "@astryxdesign/core/Link";
import { spotifyTheme } from "./theme/spotify";

interface DesignProviderProps {
  children: ReactNode;
}

export function DesignProvider({ children }: Readonly<DesignProviderProps>) {
  return (
    <Theme theme={spotifyTheme} mode="system">
      <LinkProvider component={NextLink}>{children}</LinkProvider>
    </Theme>
  );
}
