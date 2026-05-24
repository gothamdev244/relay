import { createFileRoute } from "@tanstack/react-router";
import { ToolsPage } from "@relay-sh/react/pages/tools";

export const Route = createFileRoute("/tools")({
  component: ToolsPage,
});
