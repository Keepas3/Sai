export default {
  name: 'profile',
  title: 'Profile & Homepage',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Display Name',
      type: 'string',
    },
    {
      name: 'bio',
      title: 'Biography / Tagline',
      type: 'text',
    },
    {
      name: 'avatar',
      title: 'Profile Avatar',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'banner',
      title: 'Background Banner',
      type: 'image',
      options: { hotspot: true },
    },
    // --- THIS ENABLES DRAG & DROP FOR PROJECTS ---
    {
      name: 'featuredProjects',
      type: 'array',
      title: 'Featured Dashboard Projects',
      description: 'Select and drag-and-drop order your projects.',
      of: [{ type: 'reference', to: [{ type: 'project' }] }]
    },
    // --- THIS ENABLES DRAG & DROP FOR GAMES ---
    {
      name: 'featuredGames',
      type: 'array',
      title: 'Featured Dashboard Games',
      description: 'Select and drag-and-drop order your games.',
      of: [{ type: 'reference', to: [{ type: 'game' }] }]
    },
   
  ],
};