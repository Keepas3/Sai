import { defineType, defineField } from 'sanity'

export const postType = defineType({
  name: 'post',
  title: 'Blog Posts & Logs',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title / Subject',
      type: 'string',
      description: 'The main headline of your log entry (e.g., "Japanese Learning Journey").',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL Web Link Identifier', // Change the user-facing label here!
      type: 'slug',
      description: 'Click "Generate" to automatically turn your title into a web-safe link address.',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Date & Timestamp',
      type: 'datetime',
      description: 'The date this log occurred. This controls where it sits on your monthly timeline.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Short Preview / Summary',
      type: 'text',
      rows: 2,
      description: 'A 1-2 sentence snippet that shows up on the timeline cards before clicking.',
    }),
    defineField({
      name: 'mainImage',
      title: 'Cover Image (Optional)', // New Optional Image Field
      type: 'image',
      description: 'Upload an image illustrative of this log entry.',
      options: {
        hotspot: true, // Enables visual cropping in Sanity dashboard
      },
    }),
    defineField({
      name: 'categories',
      title: 'Filter Topics / Tags',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'category' } }],
      description: 'Link this entry to a topic (e.g., Chess, Coding) to match your dashboard filters.',
    }),
    defineField({
      name: 'body',
      title: 'Full Log Content',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Write your full article or diary entry notes here.',
    }),
  ],
})