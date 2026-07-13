import Link from 'next/link';

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="py-4 px-6 lg:px-10 max-w-7xl mx-auto"
    >
      <ol className="flex items-center gap-2 flex-wrap">
        {items.map((item, i) => (
          <li key={item.href} className="flex items-center gap-2">
            {i > 0 && (
              <span className="text-warm-white/20 text-xs">›</span>
            )}
            {i === items.length - 1 ? (
              <span className="text-gold text-xs font-medium">{item.name}</span>
            ) : (
              <Link
                href={item.href}
                className="text-warm-white/50 hover:text-warm-white/80 text-xs transition-colors duration-200"
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
