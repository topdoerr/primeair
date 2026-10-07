// Dev-only design preview index: links to every fixture-rendered screen.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PREVIEW_SCREENS } from './_components/screens';

export const dynamic = 'force-dynamic';

export default function DesignPreviewIndex() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Design preview</h1>
      <p className="mt-2 text-sm text-slate-600">
        Every View rendered with fixture data from <code>src/lib/fixtures.ts</code>. Dev only; this
        route 404s in production.
      </p>
      <ul className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {PREVIEW_SCREENS.map((s) => (
          <li key={s.key}>
            <Link
              href={`/design-preview/${s.key}`}
              className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50"
            >
              <span className="text-slate-900">{s.label}</span>
              <code className="text-xs text-slate-500">/design-preview/{s.key}</code>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
