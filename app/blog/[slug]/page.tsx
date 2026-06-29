import { client } from '@/sanity/lib/client';
import { notFound } from 'next/navigation';
import Navbar from "@/components/Navbar";
import { PortableText } from '@portabletext/react';
import Link from 'next/link';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getFullPost(slug: string) {
  const query = `
    *[_type == "post" && slug.current == $slug][0] {
      title,
      publishedAt,
      excerpt,
      body,
      "categories": categories[0..2]-> { title }
    }
  `;
  return await client.fetch(query, { slug }, { cache: 'no-store' });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getFullPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="content-wrapper">
      <Navbar />

      <main className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* --- STRUCTURAL HIGH-CONTRAST BACK ARROW --- */}
        <div className="flex justify-start mb-8">
          <Link 
            href="/blog" 
            className="group flex items-center justify-center p-1 transition-all duration-200 ease-in-out hover:-translate-x-1.5 outline-none decoration-none!"
            style={{ textDecoration: 'none' }} 
            title="Back to timeline"
          >
            {/* Scaled to w-7 h-7 with higher base contrast and brilliant hover state */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2.5} 
              stroke="currentColor" 
              className="text-white/60 group-hover:text-white transition-colors duration-200 drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)]"
              style={{ width: '28px', height: '28px' }}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" 
              />
            </svg>
          </Link>
        </div>
        
        {/* --- DYNAMIC TOPIC TAGS DISPLAY (ALL ASSIGNED TOPICS) --- */}
        {post.categories && post.categories.length > 0 && (
          <div className="flex justify-center gap-2 mb-4 flex-wrap">
            {post.categories.map((cat: { title: string }, index: number) => (
              <span key={index} className="tag">
                {cat.title}
              </span>
            ))}
          </div>
        )}

        {/* Article Subject Headline */}
        <h1 className="text-3xl md:text-4xl font-bold font-serif text-white text-center leading-tight mb-4">
          {post.title}
        </h1>

        {/* Clean Datestamp Line */}
        <p className="text-xs font-mono text-white/30 text-center mb-12">
          {new Date(post.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>

        {/* Premium Dark Glassmorphism Content Box */}
        <div className="status-box p-6 md:p-10 leading-relaxed text-white/80 font-sans space-y-6">
          {post.body ? (
            <div className="prose prose-invert max-w-none text-white/90">
              <PortableText value={post.body} />
            </div>
          ) : (
            <p className="status-text italic text-white/30 text-center py-6">
              This entry has no written content in the body yet.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}