import { createFileRoute } from "@tanstack/react-router";
import { SourcesPage } from "@relay-sh/react/pages/sources";

export const Route = createFileRoute("/")({
  component: SourcesPage,
});
