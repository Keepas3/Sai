export default {
  name: 'project',
  type: 'document',
  title: 'Projects Page Settings',
  fields: [
    {
      name: 'pageTitle',
      type: 'string',
      title: 'Section / Page Title',
      description: 'e.g., Portfolio Projects, Engineering & Research',
    },
    {
      name: 'projectList',
      type: 'array',
      title: 'Projects Inventory',
      description: 'Add your individual projects right here and drag them into your preferred display sequence.',
      of: [
        {
          type: 'object',
          name: 'projectItem',
          title: 'Project Entry',
          fields: [
            {
              name: 'title',
              type: 'string',
              title: 'Project Title',
            },
            {
              name: 'description',
              type: 'text',
              title: 'Project Description',
              description: 'Describe what you did. This can be engineering, research, chess coaching, or an event layout!',
            },
            {
              name: 'image',
              type: 'image',
              title: 'Project Preview Image (Optional)',
              description: 'Leave blank to automatically use a link screenshot/logo fallback instead.',
              options: {
                hotspot: true,
              }
            },
            {
              name: 'projectLink',
              type: 'url',
              title: 'Primary Project Link (Optional)',
              description: 'A link to a website, document, repo, or event page.',
            },
            {
              name: 'category',
              type: 'string',
              title: 'Project Category (Optional)',
              description: 'e.g., Software, Chess, Education, Design',
            }
          ]
        }
      ]
    }
  ]
};