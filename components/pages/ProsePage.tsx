import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';

/** Consistent wrapper for informational/legal pages. */
export function ProsePage({
  title,
  intro,
  crumbs,
  children,
}: {
  title: string;
  intro?: string;
  crumbs: Crumb[];
  children: React.ReactNode;
}) {
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-4 text-3xl font-bold">{title}</h1>
      {intro && <p className="mt-2 max-w-2xl text-lg text-muted">{intro}</p>}
      <div className="prose-careu mt-6 max-w-2xl space-y-4 text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}
