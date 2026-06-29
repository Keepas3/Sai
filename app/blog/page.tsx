'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedMonths, setExpandedMonths] = useState<{ [key: string]: boolean }>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<{title: string, slug: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

        {/* --- REFACTORED CLEAN FILTER SELECTION --- */}
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

          {/* Minimalist Dropdown Absolute Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-9 w-48 bg-[#121214] border border-white/10 rounded-lg shadow-2xl p-1 z-50 animate-fadeIn">
              <button
                onClick={() => { setActiveCategory('all'); setIsMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-mono rounded transition-colors block text-white/70 hover:text-white hover:bg-white/5 ${activeCategory === 'all' ? 'text-[#e5729f]! font-bold' : ''}`}
              >
                All Posts
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => { setActiveCategory(cat.slug); setIsMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-mono rounded transition-colors block text-white/70 hover:text-white hover:bg-white/5 ${activeCategory === cat.slug ? 'text-[#e5729f]! font-bold' : ''}`}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* --- CENTRALIZED TIMELINE BOX CONTAINER --- */}
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
                    {/* Folder Trigger Header */}
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

                    {/* Nested Cards List Wrapper */}
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