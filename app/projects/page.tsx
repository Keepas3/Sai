import Navbar from "@/components/Navbar";

export default function WorkPage() {
  // Placeholder data using your actual projects
  const projects = [
    { 
      title: "Rebuilding the White House", 
      desc: "A project to rebuild the White House with modern materials and technology.", 
      art: "https://picsum.photos/id/2/800/450", 
      tags: ["Blocks", "Magic", "Hope"]
    },
    { 
      title: "Knowledge", 
      desc: "I know some stuff.", 
      art: "https://picsum.photos/id/3/800/450",
      tags: ["Brain", "Planning", "Algorithms"]
    },
    { 
      title: "Distributed Cloud Orchestrator", 
      desc: "A distributed cloud computing system designed for efficient vehicle resource orchestration and data management.", 
      art: "https://picsum.photos/id/4/800/450",
      tags: ["Distributed Systems", "Cloud", "Backend"]
    },
  ];

  return (
    <div className="content-wrapper">
      <Navbar />

      <main className="page-container">
        <h1 className="page-title">Work & Projects</h1>
        
        <div className="projects-grid">
          {projects.map((project, index) => (
            <div key={index} className="project-card">
              {/* Project Image */}
              <img src={project.art} alt={project.title} className="project-art" />
              
              {/* Project Details */}
              <div className="project-info">
                <h3 className="project-title">{project.title}</h3>
                <p className="project-desc">{project.desc}</p>
                
                {/* Tech Stack Tags */}
                <div className="project-tags">
                  {project.tags.map((tag, i) => (
                    <span key={i} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}