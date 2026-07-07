import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'galleryTopic',
  title: 'Gallery',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Album Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Folder / Web Link Identifier',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Album Description',
      type: 'string',
    }),
    // ─── NEW FIELD: The Drag-and-Drop Array ───
    defineField({
      name: 'images',
      title: 'Album Images',
      type: 'array',
      of: [{ type: 'galleryItem' }], // Plugs in your object schema from Step 1
      description: 'Add your images here. Drag the handles on the left to reorder them!',
    }),
  ],
});