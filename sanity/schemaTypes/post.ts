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
    // Add this right after your 'slug' or 'publishedAt' field
    defineField({
      name: 'isPinned',
      title: 'Pin to Top of Blog',
      type: 'boolean',
      description: 'Turn this on to pin this post to the top of the blog page (max 3 will be shown).',
      initialValue: false,
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
      description: 'Write your full article or diary entry notes here. Supports rich text formatting.',
      of: [
        {
          type: 'block',
          // Styles dropdown (like Google Docs' Normal, Heading 1, Heading 2)
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Heading 1', value: 'h1' },
            { title: 'Heading 2', value: 'h2' },
            { title: 'Blockquote', value: 'blockquote' },
          ],
          // Lists (Bullet points and Numbered lists)
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          // Marks handle inline decorations (Bold, Italic, Underline, Code)
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Underline', value: 'underline' },
              { title: 'Code', value: 'code' },
            ],
          },
        },
      ],
    }),
  ],
})