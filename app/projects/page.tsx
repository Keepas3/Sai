import Navbar from "@/components/Navbar";
import { client } from '@/sanity/lib/client';

// 1. Define the TypeScript type matching our updated schema
interface Project {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  projectLink?: string;
  category?: string;
}

export default async function WorkPage() {
  // 2. Fetch live data from Sanity
  const projects: Project[] = await client.fetch(`
    *[_type == "project"] {
      _id,
      title,
      description,
      "imageUrl": image.asset->url,
      projectLink,
      category
    }
  `);

  return (
    <div className="content-wrapper">
      <Navbar />

      <main className="page-container">
        <h1 className="page-title">Work & Projects</h1>
        
        {projects.length === 0 ? (
          <div className="text-center mt-12">
            <h2 className="text-white/60 text-xl font-serif">No projects published yet. Add some in Sanity Studio!</h2>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => {
              
              // 3. Image Fallback Logic: Image -> Screenshot API -> Empty Text Fallback Block
              const displayImage = project.imageUrl 
                ? project.imageUrl 
                : project.projectLink 
                  ? `https://api.microlink.io?url=${encodeURIComponent(project.projectLink)}&screenshot=true&embed=screenshot.url`
                  : null;

              return (
                <div key={project._id} className="project-card">
                  
                  {/* Render the image box only if an image or link preview exists */}
                  {displayImage ? (
                    <img src={displayImage} alt={project.title} className="project-art" />
                  ) : (
                    <div className="project-art-placeholder flex items-center justify-center bg-white/5 border-b border-white/10 h-48">
                      <span className="text-white/20 text-xs font-mono uppercase tracking-wider">No Preview Available</span>
                    </div>
                  )}
                  
                  {/* Project Details */}
                  <div className="project-info">
                    {/* Optional Category Tag */}
                    {project.category && (
                      <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono block mb-1">
                        {project.category}
                      </span>
                    )}

                    {/* Make Title clickable if an optional project link is provided */}
                    <h3 className="project-title">
                      {project.projectLink ? (
                        <a 
                          href={project.projectLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:text-white/70 transition-colors inline-flex items-center gap-1"
                        >
                          {project.title} <span className="text-xs text-white/30">↗</span>
                        </a>
                      ) : (
                        project.title
                      )}
                    </h3>

                    <p className="project-desc">{project.description}</p>
                    
                    {/* Optional Button Link at the bottom if provided */}
                    {project.projectLink && (
                      <div className="mt-4">
                        <a 
                          href={project.projectLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-white/80 bg-white/10 border border-white/20 px-3 py-1.5 rounded-md hover:bg-white/20 transition-all font-mono"
                        >
                          Explore Project
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}