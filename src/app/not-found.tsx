import Link from 'next/link';
import './globals.css';

export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <main className="container" style={{ padding: '80px 24px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
          <h1 style={{ fontSize: 36 }}>Page not found</h1>
          <p className="soft">This page doesn’t exist, or the product is no longer on sale.</p>
          <Link href="/en" className="btn btn-primary">Back to the shop</Link>
        </main>
      </body>
    </html>
  );
}
