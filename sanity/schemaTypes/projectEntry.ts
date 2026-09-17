import { defineType, defineField } from 'sanity'

export const projectEntryType = defineType({
  name: 'projectEntry',
  title: 'Projects',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Project Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL Web Link Identifier',
      type: 'slug',
      description: 'Click "Generate" to automatically turn your title into a web-safe link address.',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Sort Order (Optional)',
      type: 'number',
      description: 'Lower numbers appear first in the Projects overview. Leave blank to sort by creation date.',
    }),
    defineField({
      name: 'description',
      title: 'Short Description',
      type: 'text',
      rows: 2,
      description: 'Shown as the caption in the Projects overview and as the lede on this project\'s own page.',
    }),
    defineField({
      name: 'category',
      title: 'Project Category (Optional)',
      type: 'string',
      description: 'e.g., Software, Chess, Education, Design',
    }),
    defineField({
      name: 'images',
      title: 'Photos',
      type: 'array',
      description: 'The first photo is used as the preview thumbnail in the Projects overview. All photos appear in this project\'s own gallery.',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
        },
      ],
    }),
    defineField({
      name: 'projectLink',
      title: 'External Project Link (Optional)',
      type: 'url',
      description: 'A link to a website, document, repo, or event page. Shown as a "Visit Project" button on this project\'s page.',
    }),
    defineField({
      name: 'body',
      title: 'Full Write-up (Optional)',
      type: 'array',
      description: 'The full detail-page content for this project. Supports rich text formatting.',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Heading 1', value: 'h1' },
            { title: 'Heading 2', value: 'h2' },
            { title: 'Blockquote', value: 'blockquote' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
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
