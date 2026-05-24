import { ConditionType, type Condition } from "fumadb/query";
import type { AnyTable } from "fumadb/schema";

import { StorageError } from "./fuma-runtime";

export const relayScopePolicyName = "relay.scope";
export const relayUnscopedPolicyName = "relay.unscoped";
const unscopedRelayTables = new Set(["blob"]);

export interface RelayScopePolicyContext {
  readonly allowedScopeIds: ReadonlySet<string>;
}

export type RelayScopePolicyAccess = "read" | "write" | "delete";
export type RelayScopeValue = string | null | undefined;
export type RelayScopeTargetColumn = "scope_id" | "source_scope_id";

export interface RelayScopeTarget {
  readonly column: RelayScopeTargetColumn;
  readonly value: string;
}

export const hasRelayScopePolicy = (table: AnyTable): boolean =>
  table.policies.some((policy) => policy.name === relayScopePolicyName);

const scopePolicyViolation = (message: string): never => {
  // oxlint-disable-next-line relay/no-try-catch-or-throw -- boundary: FumaDB table policy callbacks are promise callbacks, not Effect effects
  throw new StorageError({ message, cause: undefined });
};

export function assertRelayScopePolicyTable(table: AnyTable, tableKey?: string): void {
  const tableName = table.ormName || tableKey || table.names.sql;
  const scopedPolicy = table.policies.find((policy) => policy.name === relayScopePolicyName);
  if (
    scopedPolicy?.onRead &&
    scopedPolicy.onCreate &&
    scopedPolicy.onUpdate &&
    scopedPolicy.onDelete
  ) {
    return;
  }

  const unscopedPolicy = table.policies.find(
    (policy) => policy.name === relayUnscopedPolicyName,
  );
  if (unscopedPolicy && unscopedRelayTables.has(tableName)) return;

  scopePolicyViolation(`Storage table "${tableName}" is missing an relay scope policy.`);
}

const requireRelayScopeContext = (
  tableName: string,
  access: RelayScopePolicyAccess,
  context: RelayScopePolicyContext | undefined,
): RelayScopePolicyContext => {
  if (context) return context;
  return scopePolicyViolation(
    `Storage ${access} on table "${tableName}" is missing relay scope context.`,
  );
};

export const isRelayScopeAllowed = (
  tableName: string,
  access: RelayScopePolicyAccess,
  value: RelayScopeValue,
  context: RelayScopePolicyContext | undefined,
): boolean => {
  const scopeContext = requireRelayScopeContext(tableName, access, context);
  return typeof value === "string" && scopeContext.allowedScopeIds.has(value);
};

export const relayScopeIds = (
  tableName: string,
  access: RelayScopePolicyAccess,
  context: RelayScopePolicyContext | undefined,
): string[] => [...requireRelayScopeContext(tableName, access, context).allowedScopeIds];

const findScopeTarget = (
  condition: Condition | undefined,
  columns: readonly RelayScopeTargetColumn[],
): RelayScopeTarget | null => {
  if (!condition) return null;
  if (condition.type === ConditionType.Compare) {
    const column = columns.find((name) => condition.a.ormName === name);
    if (!column || condition.operator !== "=" || typeof condition.b !== "string") return null;
    return { column, value: condition.b };
  }
  if (condition.type !== ConditionType.And) return null;

  for (const item of condition.items) {
    const target = findScopeTarget(item, columns);
    if (target) return target;
  }
  return null;
};

export const requireRelayScopeTarget = (
  tableName: string,
  access: Extract<RelayScopePolicyAccess, "write" | "delete">,
  where: Condition | undefined,
  context: RelayScopePolicyContext | undefined,
  columns: readonly RelayScopeTargetColumn[] = ["scope_id"],
): RelayScopeTarget => {
  const scopeContext = requireRelayScopeContext(tableName, access, context);
  const target = findScopeTarget(where, columns);
  if (target && scopeContext.allowedScopeIds.has(target.value)) return target;

  return scopePolicyViolation(
    `Storage ${access} on table "${tableName}" must target an explicit scope in the relay scope stack.`,
  );
};

export const assertRelayScopeAllowed = (
  tableName: string,
  access: RelayScopePolicyAccess,
  value: RelayScopeValue,
  context: RelayScopePolicyContext | undefined,
): void => {
  if (isRelayScopeAllowed(tableName, access, value, context)) return;
  scopePolicyViolation(
    `Storage ${access} on table "${tableName}" is outside the relay scope stack.`,
  );
};

export const assertRelayScopeTargetValue = (
  tableName: string,
  access: Extract<RelayScopePolicyAccess, "write" | "delete">,
  value: RelayScopeValue,
  target: RelayScopeTarget,
  context: RelayScopePolicyContext | undefined,
): void => {
  assertRelayScopeAllowed(tableName, access, value, context);
  if (value === target.value) return;

  scopePolicyViolation(
    `Storage ${access} on table "${tableName}" must write the same scope it explicitly targets.`,
  );
};

export const assertAnyRelayScopeAllowed = (
  tableName: string,
  access: RelayScopePolicyAccess,
  values: readonly RelayScopeValue[],
  context: RelayScopePolicyContext | undefined,
): void => {
  if (values.some((value) => isRelayScopeAllowed(tableName, access, value, context))) return;
  scopePolicyViolation(
    `Storage ${access} on table "${tableName}" is outside the relay scope stack.`,
  );
};
