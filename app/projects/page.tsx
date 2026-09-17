import Navbar from "@/components/Navbar";
import { client } from '@/sanity/lib/client';
import AccordionGallery, { type AccordionGalleryItem } from '@/components/AccordionGallery';

interface Project {
  title: string;
  description: string;
  category?: string;
  slug: string;
  imageUrl?: string;
}

// AccordionGallery needs a real image per panel — this inline SVG covers
// projects with no photo uploaded yet.
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200">' +
    '<rect width="100%" height="100%" fill="#141018"/>' +
    '<text x="50%" y="50%" fill="rgba(255,255,255,0.25)" font-family="monospace" font-size="28" text-anchor="middle" dominant-baseline="middle">No Preview</text>' +
    '</svg>'
  );

export default async function WorkPage() {
  const data = await client.fetch(`
    *[_type == "projectEntry"] | order(order asc, _createdAt asc) {
      title,
      description,
      category,
      "slug": slug.current,
      "imageUrl": images[0].asset->url
    }
  `, {}, { next: { revalidate: 60 } });

  const projects: Project[] = data || [];

  const items: AccordionGalleryItem[] = projects.map((project) => ({
    image: project.imageUrl ?? PLACEHOLDER_IMAGE,
    label: project.title,
    description: project.description,
    link: `/projects/${project.slug}`,
    alt: project.title,
  }));

  return (
    <div className="content-wrapper">
      <Navbar />

      <main className="page-container">
        <h1 className="page-title">Work &amp; Projects</h1>

        {projects.length === 0 ? (
          <div className="text-center mt-12">
            <h2 className="text-white/60 text-xl font-serif">No projects published yet. Add some in Sanity Studio!</h2>
          </div>
        ) : (
          <AccordionGallery items={items} defaultIndex={0} accentColor="#e5729f" overlayColor="#0a0708" />
        )}
      </main>
    </div>
  );
}
