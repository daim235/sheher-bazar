// Inject JSON-LD structured data for SEO. Use inside any page component.
interface Props {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
