import { createFileRoute } from "@tanstack/react-router";
import { PoliciesPage } from "@relay-sh/react/pages/policies";

export const Route = createFileRoute("/policies")({
  component: () => <PoliciesPage />,
});
