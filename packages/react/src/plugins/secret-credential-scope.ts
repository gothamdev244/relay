import type { ScopeId } from "@relay-sh/sdk/shared";

import type { SecretPickerSecret } from "./secret-picker";

export const secretsForCredentialTarget = (
  secrets: readonly SecretPickerSecret[],
  targetScope: ScopeId,
): readonly SecretPickerSecret[] =>
  secrets.filter((secret) => secret.scopeId === String(targetScope));
