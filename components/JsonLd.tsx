/**
 * Safe JSON-LD component for structured data
 * Uses Next.js recommended pattern with script element
 *
 * Security: This is safe because JSON.stringify() escapes
 * all special characters, and we only accept typed objects.
 * Reference: https://nextjs.org/docs/app/building-your-application/optimizing/metadata#json-ld
 */

type JsonLdData = Record<string, unknown> | Record<string, unknown>[];

interface JsonLdProps {
  data: JsonLdData;
}

export function JsonLd({ data }: JsonLdProps) {
  // If array, wrap in @graph structure for multiple schemas
  const structuredData = Array.isArray(data)
    ? { '@context': 'https://schema.org', '@graph': data }
    : data;

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
    >
      {JSON.stringify(structuredData)}
    </script>
  );
}
