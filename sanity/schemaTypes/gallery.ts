export default {
  name: 'galleryPageContent', // A unique identifier to avoid old naming conflicts
  type: 'document',
  title: 'Gallery Page Settings',
  fields: [
    {
      name: 'pageTitle',
      type: 'string',
      title: 'Page Title',
      description: 'e.g., My Visual Gallery, Art Collection, etc.'
    },
    {
      name: 'slides',
      type: 'array',
      title: 'Gallery Slides / Images',
      description: 'Add your artwork items here. You can drag and drop them to change their slide order instantly.',
      of: [
        {
          type: 'object',
          name: 'slideItem',
          title: 'Artwork Slide',
          fields: [
            {
              name: 'title',
              type: 'string',
              title: 'Artwork Title',
            },
            {
              name: 'description',
              type: 'text',
              title: 'Description / Caption',
            },
            {
              name: 'image',
              type: 'image',
              title: 'Artwork Image',
              options: {
                hotspot: true,
              }
            }
          ]
        }
      ]
    }
  ]
};