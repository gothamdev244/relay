// ---------------------------------------------------------------------------
// Shared OAuth HTTP handlers — thin forwarders over `relay.oauth.*`.
// Replaces the four per-plugin copies (mcp / openapi / google-discovery
// each had its own start / complete / callback handler).
// ---------------------------------------------------------------------------

import { HttpApiBuilder } from "effect/unstable/httpapi";
import { HttpServerResponse } from "effect/unstable/http";
import { Effect, Option, Predicate, Schema } from "effect";

import { runOAuthCallback, type PopupErrorMessage } from "../oauth-popup";
import {
  OAUTH_POPUP_MESSAGE_TYPE,
  OAuthCompleteError,
  OAuthProbeError,
  OAuthSessionNotFoundError,
  OAuthStartError,
  resolveSecretBackedMap,
  type Relay,
  type OAuthStrategy,
  type SecretBackedValue,
} from "@relay-sh/sdk";

import { RelayApi } from "../api";
import { capture } from "../observability";
import { RelayService } from "../services";

const OAUTH_POPUP_CHANNEL = OAUTH_POPUP_MESSAGE_TYPE;

const resolveOAuthSecretBackedMap = <E extends OAuthProbeError | OAuthStartError>(
  relay: Relay,
  values: Record<string, SecretBackedValue> | undefined,
  makeError: (message: string) => E,
) =>
  resolveSecretBackedMap({
    values,
    getSecret: relay.secrets.get,
    onMissing: (name) => makeError(`Secret not found for "${name}"`),
    onError: (_error, name) => makeError(`Secret not found for "${name}"`),
  }).pipe(
    Effect.mapError((error) =>
      Predicate.isTagged(error, "OAuthProbeError") || Predicate.isTagged(error, "OAuthStartError")
        ? (error as E)
        : makeError("Secret resolution failed"),
    ),
  );

const decodeOAuthStartError = Schema.decodeUnknownOption(OAuthStartError);
const decodeOAuthCompleteError = Schema.decodeUnknownOption(OAuthCompleteError);
const decodeOAuthProbeError = Schema.decodeUnknownOption(OAuthProbeError);
const decodeOAuthSessionNotFoundError = Schema.decodeUnknownOption(OAuthSessionNotFoundError);

const toPopupErrorMessage = (error: unknown): PopupErrorMessage => {
  const completeError = decodeOAuthCompleteError(error);
  if (Option.isSome(completeError))
    return {
      short: "Could not complete authentication",
      details: completeError.value.message,
    };

  const startError = decodeOAuthStartError(error);
  if (Option.isSome(startError))
    return {
      short: "Could not start authentication",
      details: startError.value.message,
    };

  const probeError = decodeOAuthProbeError(error);
  if (Option.isSome(probeError))
    return {
      short: "Could not discover authentication endpoint",
      details: probeError.value.message,
    };

  const sessionNotFound = decodeOAuthSessionNotFoundError(error);
  if (Option.isSome(sessionNotFound))
    return {
      short: "OAuth session expired or not found",
      details: `Session id: ${sessionNotFound.value.sessionId}`,
    };

  return { short: "Authentication failed" };
};

const requireMatchingTokenScope = (
  routeScope: string,
  tokenScope: string,
): Effect.Effect<void, OAuthStartError> =>
  routeScope === tokenScope
    ? Effect.void
    : Effect.fail(
        new OAuthStartError({
          message: "OAuth token scope must match route scope",
        }),
      );

export const OAuthHandlers = HttpApiBuilder.group(RelayApi, "oauth", (handlers) =>
  handlers
    .handle("probe", ({ payload }) =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          const headers = yield* resolveOAuthSecretBackedMap(
            relay,
            payload.headers,
            (message) => new OAuthProbeError({ message }),
          );
          const queryParams = yield* resolveOAuthSecretBackedMap(
            relay,
            payload.queryParams,
            (message) => new OAuthProbeError({ message }),
          );
          return yield* relay.oauth.probe({
            endpoint: payload.endpoint,
            headers,
            queryParams,
          });
        }),
      ),
    )
    .handle("start", ({ params: path, payload }) =>
      capture(
        Effect.gen(function* () {
          yield* requireMatchingTokenScope(path.scopeId, payload.tokenScope);
          const relay = yield* RelayService;
          const headers = yield* resolveOAuthSecretBackedMap(
            relay,
            payload.headers,
            (message) => new OAuthStartError({ message }),
          );
          const queryParams = yield* resolveOAuthSecretBackedMap(
            relay,
            payload.queryParams,
            (message) => new OAuthStartError({ message }),
          );
          return yield* relay.oauth.start({
            endpoint: payload.endpoint,
            headers,
            queryParams,
            redirectUrl: payload.redirectUrl,
            connectionId: payload.connectionId,
            tokenScope: payload.tokenScope,
            strategy: payload.strategy as OAuthStrategy,
            pluginId: payload.pluginId,
            identityLabel: payload.identityLabel,
          });
        }),
      ),
    )
    .handle("complete", ({ params: path, payload }) =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          return yield* relay.oauth.complete({
            state: payload.state,
            tokenScope: path.scopeId,
            code: payload.code,
            error: payload.error,
          });
        }),
      ),
    )
    .handle("cancel", ({ params: path, payload }) =>
      capture(
        Effect.gen(function* () {
          if (path.scopeId !== payload.tokenScope) {
            return yield* new OAuthSessionNotFoundError({
              sessionId: payload.sessionId,
            });
          }
          const relay = yield* RelayService;
          yield* relay.oauth.cancel(payload.sessionId, payload.tokenScope);
          return { cancelled: true };
        }),
      ),
    )
    .handle("callback", ({ query: urlParams }) =>
      // The callback always renders HTML, even on failure — the popup
      // shows the error + messages it back to the opener.
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          const html = yield* runOAuthCallback({
            complete: ({ state, code, error }) =>
              relay.oauth
                .complete({
                  state,
                  code: code ?? undefined,
                  error: error ?? undefined,
                })
                .pipe(
                  Effect.tapError((cause) =>
                    Effect.logError("OAuth callback completion failed", cause),
                  ),
                ),
            urlParams,
            toErrorMessage: toPopupErrorMessage,
            channelName: OAUTH_POPUP_CHANNEL,
          });
          return HttpServerResponse.html(html);
        }),
      ),
    ),
);
