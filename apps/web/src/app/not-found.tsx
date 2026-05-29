import Link from "next/link";

export default function NotFound(): React.ReactNode {
  return (
    <main className="not-found-page">
      <div>
        <p className="eyebrow">CodeMind Graph</p>
        <h1>Page not found</h1>
        <p>The requested route is not available.</p>
        <Link className="text-link" href="/en">
          Back to English home
        </Link>
      </div>
    </main>
  );
}
