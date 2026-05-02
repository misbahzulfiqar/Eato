import { Link, Navigate, useParams } from 'react-router-dom';
import { getBlogPostBySlug } from '../data/blogPosts';

export default function BlogPost() {
  const { slug } = useParams();
  const post = slug ? getBlogPostBySlug(slug) : undefined;

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="bg-surface-canvas font-sans text-stone-800">
      <article>
        <header className="border-b border-stone-200 bg-white py-10 sm:py-12">
          <div className="mx-auto max-w-[720px] px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-stone-500">
              <Link to="/" className="hover:text-fresh-green">
                Home
              </Link>
              <span className="mx-2 text-stone-400">/</span>
              <Link to="/blog" className="hover:text-fresh-green">
                Blog
              </Link>
              <span className="mx-2 text-stone-400">/</span>
              <span className="text-fresh-green">Article</span>
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
              {post.date} · {post.readTime}
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-fresh-green sm:text-4xl">{post.title}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-fresh-muted px-2.5 py-0.5 text-xs font-medium text-fresh-green">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="text-lg font-medium leading-relaxed text-stone-700">{post.excerpt}</p>
          <div className="mt-8 space-y-5 text-base leading-relaxed text-stone-700">
            {post.body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <p className="mt-10 border-t border-stone-200 pt-8 text-sm text-stone-500">
            This article is sample content for the Eato prototype storefront.
          </p>
          <Link
            to="/blog"
            className="mt-6 inline-flex font-semibold text-fresh-green hover:underline"
          >
            ← Back to all posts
          </Link>
        </div>
      </article>
    </div>
  );
}
