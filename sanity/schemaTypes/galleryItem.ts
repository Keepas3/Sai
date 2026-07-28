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
    defineField({
      name: 'overlayVideo',
      title: 'Cinematic Overlay Video (Optional)',
      type: 'file',
      options: {
        accept: 'video/*', 
      },
      description: 'Upload a video to trigger an effect when viewing this image.',
    }),
    // ─── NEW: OVERLAY STYLE DROPDOWN ───
    defineField({
      name: 'overlayStyle',
      title: 'Overlay Style',
      type: 'string',
      options: {
        list: [
          { title: 'Full Screen (Covers the whole page)', value: 'fullscreen' },
          { title: 'Gallery Container (Inside the picture box)', value: 'container' }
        ],
        layout: 'radio', 
      },
      initialValue: 'fullscreen', // Defaults to full screen if you forget to click one
      description: 'Choose where the cinematic effect should play.',
    }),
  ],
});