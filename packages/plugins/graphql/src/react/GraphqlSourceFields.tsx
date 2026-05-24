import {
  CardStack,
  CardStackContent,
  CardStackEntryField,
} from "@relay-sh/react/components/card-stack";
import { Input } from "@relay-sh/react/components/input";
import {
  SourceIdentityFieldRows,
  type SourceIdentity,
} from "@relay-sh/react/plugins/source-identity";

export function GraphqlSourceFields(props: {
  readonly endpoint: string;
  readonly onEndpointChange: (endpoint: string) => void;
  readonly identity: SourceIdentity;
  readonly endpointDisabled?: boolean;
  readonly namespaceReadOnly?: boolean;
}) {
  return (
    <CardStack>
      <CardStackContent className="border-t-0">
        <CardStackEntryField
          label="Endpoint"
          hint="The endpoint will be introspected to discover available queries and mutations."
        >
          <Input
            value={props.endpoint}
            onChange={(e) => props.onEndpointChange((e.target as HTMLInputElement).value)}
            placeholder="https://api.example.com/graphql"
            className="font-mono text-sm"
            disabled={props.endpointDisabled}
          />
        </CardStackEntryField>
        <SourceIdentityFieldRows
          identity={props.identity}
          namePlaceholder="e.g. Shopify API"
          namespaceReadOnly={props.namespaceReadOnly}
        />
      </CardStackContent>
    </CardStack>
  );
}
