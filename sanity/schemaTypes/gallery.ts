export default {
  name: 'gallerySlide',
  type: 'document',
  title: 'Gallery Slides',
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