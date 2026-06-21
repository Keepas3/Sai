import Navbar from "@/components/Navbar";
import { client } from '@/sanity/lib/client';

// 1. Define the TypeScript type matching our updated schema
interface Project {
  title: string;
  description: string;
  imageUrl?: string;
  projectLink?: string;
  category?: string;
}

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
  `, {}, { cache: 'no-store' });

  const sectionTitle = data?.pageTitle || "Work & Projects";
  const projects: Project[] = data?.projectList || [];

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
          <div className="projects-grid">
            {projects.map((project, index) => {
              
              // Image Fallback Logic
              const displayImage = project.imageUrl 
                ? project.imageUrl 
                : project.projectLink 
                  ? `https://api.microlink.io?url=${encodeURIComponent(project.projectLink)}&screenshot=true&embed=screenshot.url`
                  : null;

              // DYNAMIC WRAPPER: If there's a link, the whole card becomes a clickable <a> tag. If not, it stays a <div>.
              const CardWrapper = project.projectLink ? 'a' : 'div' as any;
              const wrapperProps = project.projectLink ? {
                href: project.projectLink,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "project-card block cursor-pointer group transition-transform hover:-translate-y-1"
              } : {
                className: "project-card block"
              };

              return (
                /* FIXED: Replaced project._id with index loop key */
                <CardWrapper key={index} {...wrapperProps}>
                  
                  {/* Image Box */}
                  {displayImage ? (
                    <img src={displayImage} alt={project.title} className="project-art group-hover:opacity-90 transition-opacity" />
                  ) : (
                    <div className="project-art-placeholder flex items-center justify-center bg-white/5 border-b border-white/10 h-48">
                      <span className="text-white/20 text-xs font-mono uppercase tracking-wider">No Preview Available</span>
                    </div>
                  )}
                  
                  {/* Project Details */}
                  <div className="project-info pointer-events-none">
                    
                    {/* Category Tag */}
                    {project.category && (
                      <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono block mb-1">
                        {project.category}
                      </span>
                    )}

                    {/* Title */}
                    <h3 className="project-title flex items-center gap-1 group-hover:text-white/70 transition-colors">
                      {project.title} 
                      {project.projectLink && <span className="text-xs text-white/30">↗</span>}
                    </h3>

                    <p className="project-desc">{project.description}</p>
                    
                    {/* Button */}
                    {project.projectLink && (
                      <div className="mt-4">
                        <span className="text-xs text-white/80 bg-white/10 border border-white/20 px-3 py-1.5 rounded-md group-hover:bg-white/20 transition-all font-mono inline-block">
                          Explore Project
                        </span>
                      </div>
                    )}
                  </div>
                </CardWrapper>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}