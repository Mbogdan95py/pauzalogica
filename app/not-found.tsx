import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page grid place-items-center py-24 text-center">
      <div>
        <p className="text-6xl font-extrabold text-brand">404</p>
        <h1 className="mt-2 text-2xl font-bold">Pagina nu a fost găsită</h1>
        <p className="mt-2 text-muted">Poate jocul căutat s-a mutat sau nu există încă.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/" className="btn-brand">
            Acasă
          </Link>
          <Link href="/jocuri" className="btn-ghost">
            Toate jocurile
          </Link>
        </div>
      </div>
    </div>
  );
}
