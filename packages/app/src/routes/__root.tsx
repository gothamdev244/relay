import React from "react";
import { createRootRoute } from "@tanstack/react-router";
import { RelayProvider } from "@relay-sh/react/api/provider";
import { RelayPluginsProvider } from "@relay-sh/sdk/client";
import { Toaster } from "@relay-sh/react/components/sonner";
import { plugins as clientPlugins } from "virtual:relay/plugins-client";
import { Shell } from "../web/shell";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <RelayProvider>
      <RelayPluginsProvider plugins={clientPlugins}>
        <Shell />
        <Toaster />
      </RelayPluginsProvider>
    </RelayProvider>
  );
}
