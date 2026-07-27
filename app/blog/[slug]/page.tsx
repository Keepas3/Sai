import { client } from '@/sanity/lib/client';
import { notFound } from 'next/navigation';
import Navbar from "@/components/Navbar";
import { PortableText, PortableTextComponents } from '@portabletext/react';
import Link from 'next/link';
import imageUrlBuilder from '@sanity/image-url';

// Initialize the image builder utility
const builder = imageUrlBuilder(client);
function urlFor(source: any) {
  return builder.image(source);
}

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// ─── INLINE STYLED COMPONENTS TO FORCE MATCH THE STUDIO DESIGN ───
const blogComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p style={{ 
        fontSize: '15px', 
        color: 'rgba(255, 255, 255, 0.8)', 
        lineHeight: '1.6', 
        marginBottom: '1rem', 
        whiteSpace: 'pre-line' 
      }}>
        {children}
      </p>
    ),
    h1: ({ children }) => (
      <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '1rem', marginTop: '1.5rem', letterSpacing: '-0.025em' }}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#e5729f', marginBottom: '0.75rem', marginTop: '1.5rem', fontFamily: 'monospace' }}>
        {children}
      </h2>
    ),
    blockquote: ({ children }) => (
      <blockquote style={{ borderLeft: '2px solid #e5729f', paddingLeft: '1rem', fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.6)', margin: '1.5rem 0', backgroundColor: 'rgba(255,255,255,0.01)', padding: '0.5rem 0 0.5rem 1rem' }}>
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.8)' }}>
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol 
        className="nested-blog-ol"
        style={{ listStyleType: 'decimal', paddingLeft: '1.5rem', marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.8)' }}
      >
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li style={{ marginBottom: '0.75rem', lineHeight: '1.6' }}>{children}</li>
    ),
    number: ({ children }) => (
      <li style={{ marginBottom: '1rem', lineHeight: '1.6' }}>{children}</li>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong style={{ fontWeight: '800', color: '#ffffff', letterSpacing: '0.025em' }}>
        {children}
      </strong>
    ),
    code: ({ children }) => (
      <code style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.1)', fontFamily: 'monospace', fontSize: '12px', color: '#e5729f', border: '1px solid rgba(255,255,255,0.05)' }}>
        {children}
      </code>
    ),
    
    // ─── UPDATED: INLINE GLASSY BLUE LINK RENDERER ───
    // ─── UPDATED: FOOLPROOF GLASSY BLUE LINK RENDERER ───
    link: ({ children, value }) => {
      const rel = !value?.href?.startsWith('/') ? 'noreferrer noopener' : undefined;
      const target = !value?.href?.startsWith('/') ? '_blank' : undefined;
      
      return (
        <a 
          href={value?.href} 
          rel={rel} 
          target={target}
          className="glass-link-btn"
        >
          <span className="glass-link-text">
            {children}
          </span>
          <span className="glass-link-icon">
            ⋮
          </span>
        </a>
      );
    },
  },
};

async function getFullPost(slug: string) {
  const query = `
    *[_type == "post" && slug.current == $slug][0] {
      title,
      publishedAt,
      excerpt,
      body,
      mainImage,
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
        
        <div className="viewer-view animate-fade-in mt-4">
          
          {/* Header / Sub-Nav Bar Container */}
          <div className="flex items-center justify-between mb-8 px-4 w-full">
            
            <div className="flex-1 flex justify-start">
            <Link 
              href="/blog"
              className="group inline-flex items-center text-[#9ca3af] hover:text-white transition-colors duration-200 uppercase tracking-[2px] font-bold text-[11px] no-underline"
            >
              
              <span className="text-[16px] mr-3 leading-none group-hover:-translate-x-1 transition-transform duration-200">
                ←
              </span> 
              Back To Blogs
            </Link>
          </div>
            
            {/* Empty right side to balance flex-1 */}
            <div className="flex-1"></div>
          </div>
          
          {/* --- TOPIC TAGS --- */}
          {post.categories && post.categories.length > 0 && (
            <div className="flex justify-center gap-2 mb-4 flex-wrap">
              {post.categories.map((cat: { title: string }, index: number) => (
                <span key={index} className="tag">
                  {cat.title}
                </span>
              ))}
            </div>
          )}

          {/* Title & Date Headline Block */}
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-white text-center leading-tight mb-4">
            {post.title}
          </h1>

          <p className="text-xs font-mono text-white/30 text-center mb-10">
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>

          {post.mainImage && (
            <div 
              className="w-full overflow-hidden rounded-xl mb-8 bg-black/20"
              style={{ 
                border: '1px solid rgba(255, 255, 255, 0.03)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)'
              }}
            >
              <img 
                src={urlFor(post.mainImage).url()} 
                alt={`Cover illustration for ${post.title}`} 
                className="w-full object-cover max-h-[400px] block" 
              />
            </div>
          )}

          {/* Premium Dark Glassmorphism Content Box */}
          <div className="status-box p-6 md:p-8 font-sans">
            {post.body ? (
              <div className="w-full text-white/90">
                <PortableText value={post.body} components={blogComponents} />
              </div>
            ) : (
              <p className="status-text italic text-white/30 text-center py-6">
                This entry has no written content in the body yet.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}