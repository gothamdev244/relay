import { createFileRoute } from "@tanstack/react-router";
import { SecretsPage } from "@relay-sh/react/pages/secrets";

export const Route = createFileRoute("/secrets")({
  component: SecretsPage,
});
