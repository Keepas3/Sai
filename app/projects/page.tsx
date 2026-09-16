import Navbar from "@/components/Navbar";
import { client } from '@/sanity/lib/client';
import AccordionGallery, { type AccordionGalleryItem } from '@/components/AccordionGallery';

// 1. Define the TypeScript type matching our updated schema
interface Project {
  title: string;
  description: string;
  imageUrl?: string;
  projectLink?: string;
  category?: string;
}

// AccordionGallery needs a real image per panel (unlike the old card grid,
// which could fall back to a text-only placeholder box) — this inline SVG
// covers projects with neither an uploaded image nor a link to screenshot.
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200">' +
    '<rect width="100%" height="100%" fill="#141018"/>' +
    '<text x="50%" y="50%" fill="rgba(255,255,255,0.25)" font-family="monospace" font-size="28" text-anchor="middle" dominant-baseline="middle">No Preview</text>' +
    '</svg>'
  );

export default async function WorkPage() {
  // 2. Fetch live data from Sanity matching the array structure
  const data = await client.fetch(`
    *[_type == "project" && defined(projectList)] | order(_updatedAt desc)[0] {
      pageTitle,
      projectList[] {
        title,
        description,
        projectLink,
        category,
        "imageUrl": image.asset->url
      }
    }
  `, {}, { next: { revalidate: 60 } });

  const sectionTitle = data?.pageTitle || "Work & Projects";
  const projects: Project[] = data?.projectList || [];

  const items: AccordionGalleryItem[] = projects.map((project) => ({
    image: project.imageUrl
      ?? (project.projectLink
        ? `https://api.microlink.io?url=${encodeURIComponent(project.projectLink)}&screenshot=true&embed=screenshot.url`
        : PLACEHOLDER_IMAGE),
    label: project.title,
    description: project.description,
    link: project.projectLink,
    alt: project.title,
  }));

  return (
    <div className="content-wrapper">
      <Navbar />

      <main className="page-container">
        {/* Dynamic header title tracking from Sanity */}
        <h1 className="page-title">{sectionTitle}</h1>
        
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