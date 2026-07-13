// Server Component — renders JSON-LD structured data into <head>
// Usage: <JsonLd data={schemaObject} />  or  <JsonLd data={[schema1, schema2]} />

interface JsonLdProps {
  data: object | object[];
}

export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(Array.isArray(data) ? data : [data]);
  // Render each schema as a separate <script> block for clarity
  const schemas = Array.isArray(data) ? data : [data];
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled schema objects
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
