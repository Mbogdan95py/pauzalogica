import Link from 'next/link';
import { ChevronRight } from './Icons';

export interface Crumb {
  name: string;
  href: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Firimituri" className="flex flex-wrap items-center gap-1 text-sm text-muted">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={item.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            {last ? (
              <span className="font-medium text-text" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link href={item.href} className="link-muted">
                {item.name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
