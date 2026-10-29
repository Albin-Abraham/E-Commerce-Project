import type { FormDefinition, FormMetadataEvents } from "../domain";

function warnLegacyEvents(definitionId: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[FormSchema] "${definitionId}" uses root "events". Please migrate to "metadata.events".`
    );
  }
}

export function toCanonicalMetadataEvents(
  definition: FormDefinition,
  overrides?: Partial<FormMetadataEvents>
): FormDefinition {
  const rootEvents = (definition as any).events || {};
  const metadataEvents = definition.metadata?.events || {};

  if (
    !definition.metadata?.events &&
    (definition as any).events &&
    ((definition as any).events.onChange || (definition as any).events.onSelectChange)
  ) {
    warnLegacyEvents(definition.id);
  }

  const canonicalEvents: FormMetadataEvents = {
    ...(rootEvents as FormMetadataEvents),
    ...metadataEvents,
    ...overrides,
  };

  return {
    ...definition,
    events: {
      ...canonicalEvents,
    },
    metadata: {
      ...(definition.metadata || {}),
      events: canonicalEvents,
    },
  };
}
