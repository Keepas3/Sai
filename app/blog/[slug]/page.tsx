'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from "@/components/Navbar";
import { client } from '@/sanity/lib/client';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  excerpt?: string;
  categorySlug?: string;
  categoryTitle?: string;
  isPinned?: boolean; // NEW: Added isPinned to the interface
}

function BlogPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category');
  
  const [activeCategory, setActiveCategory] = useState<string>(categoryParam || 'all');
  const [expandedMonths, setExpandedMonths] = useState<{ [key: string]: boolean }>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFeaturedOpen, setIsFeaturedOpen] = useState(true);
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<{title: string, slug: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Selecting a category updates the URL, not just local state — so the
  // address bar always reflects what's actually showing, refreshing keeps
  // your filter, and the link is shareable/bookmarkable as-is.
  const selectCategory = (slug: string) => {
    setActiveCategory(slug);
    setIsMenuOpen(false);
    router.push(slug === 'all' ? '/blog' : `/blog?category=${slug}`, { scroll: false });
  };

  useEffect(() => {
    // Keep local state in sync if the URL's category changes from outside
    // this component (e.g. a link elsewhere on the site, or browser back/forward).
    setActiveCategory(categoryParam || 'all');
  }, [categoryParam]);

  useEffect(() => {
    async function fetchBlogData() {
      try {
        const data = await client.fetch(`{
          "posts": *[_type == "post" && defined(publishedAt)] | order(publishedAt desc) {
            _id,
            title,
            "slug": slug.current,
            publishedAt,
            excerpt,
            isPinned, // NEW: Fetching the boolean from Sanity
            "categorySlug": categories[0]->slug.current,
            "categoryTitle": categories[0]->title
          },
          "categories": *[_type == "category" && defined(slug.current)] {
            title,
            "slug": slug.current
          }
        }`, {}, { cache: 'no-store' });
        
        setPosts(data.posts);
        setCategories(data.categories);
        
        if (data.posts.length > 0) {
          const firstMonth = getMonthKey(data.posts[0].publishedAt);
          setExpandedMonths({ [firstMonth]: true });
        }
      } catch (err) {
        console.error("Failed fetching timeline logs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogData();

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getMonthKey = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  const filteredPosts = posts.filter(post => {
    if (activeCategory === 'all') return true;
    return post.categorySlug === activeCategory;
  });

  // NEW: Grab only pinned posts (from the active category), capped at 3 max
  const pinnedPosts = filteredPosts.filter(post => post.isPinned).slice(0, 3);

  const groupedData = filteredPosts.reduce((groups: { [key: string]: BlogPost[] }, post) => {
    const monthKey = getMonthKey(post.publishedAt);
    if (!groups[monthKey]) groups[monthKey] = [];
    groups[monthKey].push(post);
    return groups;
  }, {});

  const currentCategoryLabel = activeCategory === 'all' 
    ? 'All Posts' 
    : categories.find(c => c.slug === activeCategory)?.title || 'All Posts';

  return (
    <div className="content-wrapper">
      <Navbar />

      <main className="page-container">
        <h1 className="page-title">Blog Posts</h1>

        <div className="flex justify-end mb-8 relative" ref={dropdownRef}>
          <div className="inline-flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Filter:</span>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="px-3 py-1.5 text-xs font-mono rounded-md border border-white/10 bg-white/[0.02] hover:bg-white/5 text-white flex items-center gap-2 transition-all cursor-pointer"
            >
              <span className="text-[#e5729f] font-bold">●</span> {currentCategoryLabel} <span className="text-[9px] opacity-40">▼</span>
            </button>
          </div>

          {isMenuOpen && (
            <div className="absolute right-0 top-9 w-48 bg-[#121214] border border-white/10 rounded-lg shadow-2xl p-1 z-50 animate-fadeIn">
              <button
                onClick={() => selectCategory('all')}
                className={`w-full text-left px-3 py-2 text-xs font-mono rounded transition-colors block text-white/70 hover:text-white hover:bg-white/5 ${activeCategory === 'all' ? 'text-[#e5729f]! font-bold' : ''}`}
              >
                All Posts
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => selectCategory(cat.slug)}
                  className={`w-full text-left px-3 py-2 text-xs font-mono rounded transition-colors block text-white/70 hover:text-white hover:bg-white/5 ${activeCategory === cat.slug ? 'text-[#e5729f]! font-bold' : ''}`}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* --- NEW: PINNED POSTS SECTION --- */}
        {!loading && pinnedPosts.length > 0 && (
          // Wrapped in the exact same status-box class as the main timeline
          <div className="status-box mb-10 animate-fadeIn">
            
            {/* The Clickable Toggle Header */}
            <button 
              onClick={() => setIsFeaturedOpen(!isFeaturedOpen)}
              className="w-full flex items-center group cursor-pointer border-none bg-transparent outline-none"
            >
              {/* Left-aligned Title */}
              <div className="flex-1 flex justify-start">
                <h2 className="text-[10px] font-mono text-[#e5729f] uppercase tracking-widest flex items-center gap-2 m-0">
                  <span className="text-sm">📌</span> Featured Logs
                </h2>
              </div>
              
              {/* Perfectly Centered Arrow */}
              <div className="flex-1 flex justify-center">
                <span className="text-medium font-mono text-white/30 group-hover:text-[#e5729f] transition-transform duration-300">
                  {isFeaturedOpen ? '▲' : '▼'}
                </span>
              </div>
              
              {/* Invisible spacer div to keep the center arrow mathematically perfect */}
              <div className="flex-1"></div> 
            </button>

            {/* The Collapsible List */}
            {isFeaturedOpen && (
              <div className="flex flex-col gap-3 mt-4 animate-fadeIn">
                {pinnedPosts.map((post) => (
                  <Link 
                    key={`pinned-${post._id}`} 
                    href={`/blog/${post.slug}`}
                    className="timeline-card-item group border border-[#e5729f]/30 bg-black/40 hover:border-[#e5729f]/60 hover:shadow-[0_0_15px_rgba(229,114,159,0.15)] transition-all duration-300"
                    style={{ display: 'flex', flexDirection: 'column' }}
                  >
                    <div className="card-header-row" style={{ alignItems: 'flex-start' }}>
                      <h3 className="card-heading-title line-clamp-2">
                        {post.title}
                      </h3>
                      <span className="card-timestamp-date shrink-0 mt-1">
                        {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    
                    {post.excerpt && (
                      <p className="card-excerpt-text line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    {post.categoryTitle && (
                      <div className="mt-3 flex justify-end">
                        <span className="text-[9px] font-mono text-[#e5729f] bg-[#e5729f]/10 px-2 py-0.5 rounded-full border border-[#e5729f]/20">
                          {post.categoryTitle}
                        </span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        {/* --------------------------------- */}

        <div className="status-box">
          {loading ? (
            <p className="status-text italic text-white/30 text-center py-12">Querying database records...</p>
          ) : Object.keys(groupedData).length === 0 ? (
            <p className="status-text italic text-white/40 text-center py-12">No matching blog posts found.</p>
          ) : (
            <div className="timeline-axis">
              {Object.keys(groupedData).map((monthKey) => {
                const isExpanded = !!expandedMonths[monthKey];
                
                return (
                  <div key={monthKey} className="month-accordion-group">
                    <button 
                      onClick={() => toggleMonth(monthKey)}
                      className="timeline-marker"
                    >
                      <span className="marker-title">
                        {isExpanded ? '▼' : '▶'} {monthKey}
                      </span>
                      <span className="marker-count">
                        {groupedData[monthKey].length}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="timeline-cards-list animate-fadeIn">
                        {groupedData[monthKey].map((post) => (
                          <Link 
                            key={post._id} 
                            href={`/blog/${post.slug}`}
                            target="_self"             
                            rel="noopener noreferrer"
                            className="timeline-card-item group"
                          >
                            <div className="card-header-row">
                              <h3 className="card-heading-title">
                                {post.title}
                              </h3>
                              <span className="card-timestamp-date">
                                {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            
                            {post.excerpt && (
                              <p className="card-excerpt-text">
                                {post.excerpt}
                              </p>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// The actual page export. useSearchParams() (used inside BlogPageContent)
// requires a Suspense boundary so this route can still be prerendered —
// without it, the build fails trying to statically export this page since
// the category comes from the URL at request/hydration time, not build time.
export default function BlogPage() {
  return (
    <Suspense
      fallback={
        <div className="content-wrapper">
          <Navbar />
          <main className="page-container">
            <h1 className="page-title">Blog Posts</h1>
            <div className="status-box">
              <p className="status-text italic text-white/30 text-center py-12">
                Querying database records...
              </p>
            </div>
          </main>
        </div>
      }
    >
      <BlogPageContent />
    </Suspense>
  );
}