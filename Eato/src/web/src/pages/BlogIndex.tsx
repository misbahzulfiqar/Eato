import { Link } from 'react-router-dom';
import { BLOG_POSTS } from '../data/blogPosts';

export default function BlogIndex() {
  return (
    <div className="bg-surface-canvas font-sans text-stone-800">
      <section className="border-b border-stone-200 bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-stone-500">
            <Link to="/" className="hover:text-fresh-green">
              Home
            </Link>
            <span className="mx-2 text-stone-400">/</span>
            <span className="text-fresh-green">Blog</span>
          </p>
          <h1 className="mt-2 text-3xl font-bold text-fresh-green sm:text-4xl">Eato journal</h1>
          <p className="mt-3 max-w-2xl text-lg text-stone-600">
            Seasonal eating, kitchen tips, and stories from the restaurants and growers we work with.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-12">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {BLOG_POSTS.map((post) => (
              <li key={post.slug}>
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <div className="h-2 bg-gradient-to-r from-fresh-green to-fresh-lime" aria-hidden />
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                      {post.date} · {post.readTime}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-fresh-green leading-snug">
                      <Link to={`/blog/${post.slug}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-600">{post.excerpt}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-fresh-muted px-2.5 py-0.5 text-xs font-medium text-fresh-green">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="mt-5 inline-flex text-sm font-semibold text-promo-orange hover:underline"
                    >
                      Continue reading →
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
