import { client } from '@/sanity/lib/client';
import { notFound } from 'next/navigation';
import Navbar from "@/components/Navbar";
import { PortableText } from '@portabletext/react';
import Link from 'next/link';
import imageUrlBuilder from '@sanity/image-url';
import { richTextComponents } from '@/components/richTextComponents';
import AccordionGallery, { type AccordionGalleryItem } from '@/components/AccordionGallery';

const builder = imageUrlBuilder(client);
function urlFor(source: any) {
  return builder.image(source);
}

interface ProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getFullProject(slug: string) {
  const query = `
    *[_type == "projectEntry" && slug.current == $slug][0] {
      title,
      description,
      category,
      projectLink,
      body,
      images
    }
  `;
  return await client.fetch(query, { slug }, { next: { revalidate: 60 } });
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getFullProject(slug);

  if (!project) {
    notFound();
  }

  const galleryItems: AccordionGalleryItem[] = (project.images || []).map((image: any) => ({
    image: urlFor(image).url(),
    alt: project.title,
  }));

  return (
    <div className="content-wrapper">
      <Navbar />

      <main className="page-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <div className="viewer-view animate-fade-in mt-4">

          {/* Header / Sub-Nav Bar Container */}
          <div className="flex items-center justify-between mb-12 px-4 w-full">

            <div className="flex-1 flex justify-start">
              <Link
                href="/projects"
                className="group inline-flex items-center text-[#9ca3af] hover:text-white transition-colors duration-200 uppercase tracking-[2px] font-bold text-[11px] no-underline"
              >
                <span className="text-[16px] mr-3 leading-none group-hover:-translate-x-1 transition-transform duration-200">
                  ←
                </span>
                Back To Projects
              </Link>
            </div>

            {/* Empty right side to balance flex-1 */}
            <div className="flex-1"></div>
          </div>

          {/* Title block: category, title, and a subdued lede — grouped and
              spaced as one unit, then set well apart from the gallery below */}
          <div className="text-center max-w-xl mx-auto mb-14 px-4">
            {project.category && (
              <div className="flex justify-center mb-5">
                <span className="tag">{project.category}</span>
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold font-serif text-white leading-tight mb-4">
              {project.title}
            </h1>

            {project.description && (
              <p className="text-sm text-white/50 italic leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {galleryItems.length > 0 && (
            // 20% wider than the surrounding text column, centered — bleeds
            // past the page's max-width only from md breakpoint up, so it
            // never causes horizontal overflow on narrow/mobile viewports.
            <div className="w-full md:w-[120%] md:-ml-[10%] mb-14">
              <AccordionGallery items={galleryItems} showLabels={false} accentColor="#e5729f" overlayColor="#0a0708" />
            </div>
          )}

          {/* Premium Dark Glassmorphism Content Box */}
          <div className="status-box p-8 md:p-10 font-sans mb-12">
            {project.body ? (
              <div className="w-full text-white/90">
                <PortableText value={project.body} components={richTextComponents} />
              </div>
            ) : (
              <p className="status-text italic text-white/30 text-center py-6">
                This project has no written content in the body yet.
              </p>
            )}
          </div>

          {project.projectLink && (
            <div className="flex justify-center">
              <a
                href={project.projectLink}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm text-white/80 bg-white/10 border border-white/20 px-4 py-2 rounded-md hover:bg-white/20 transition-all font-mono inline-block no-underline"
              >
                Visit Project ↗
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
