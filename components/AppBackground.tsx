// A fixed coffee photo behind the page, veiled with a brand-coloured
// gradient so foreground text stays legible. Sits below all content.
export default function AppBackground({
  src,
  from = 0.55,
  to = 0.98,
}: {
  src: string;
  from?: number;
  to?: number;
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${src})` }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, color-mix(in srgb, var(--brand-background) ${
            from * 100
          }%, transparent), color-mix(in srgb, var(--brand-background) ${
            to * 100
          }%, transparent))`,
        }}
      />
    </div>
  );
}
