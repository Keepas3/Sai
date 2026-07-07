import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'galleryItem',
  title: 'Gallery Image',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Image Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    // ─── NEW DESCRIPTION FIELD ───
    defineField({
      name: 'description',
      title: 'Image Description / Caption',
      type: 'string',
      description: 'A brief sentence providing context for this specific image.',
    }),
    defineField({
      name: 'image',
      title: 'Gallery Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
});