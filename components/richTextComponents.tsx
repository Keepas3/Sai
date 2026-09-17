import type { PortableTextComponents } from '@portabletext/react';
import BlogLinkButton from '@/components/BlogLinkButton';

// Shared PortableText rendering config — originally inline in the blog
// detail page, extracted so the project detail page can render its own
// rich-text body the same way instead of duplicating this config.
export const richTextComponents: PortableTextComponents = {
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
    // The ⋮ icon opens a share/copy popup (BlogLinkButton) instead of just
    // following the link like the rest of the row.
    link: ({ children, value }) => (
      <BlogLinkButton href={value?.href}>{children}</BlogLinkButton>
    ),
  },
};
