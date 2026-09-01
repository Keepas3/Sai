import { defineType, defineField } from 'sanity'

export const resourceType = defineType({
  name: 'resource',
  title: 'Resource',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (Rule) => Rule.required().uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      description: 'A short one-line blurb shown under the title.',
    }),
    defineField({
      name: 'isPinned',
      title: 'Pin to Top',
      type: 'boolean',
      initialValue: false,
      description: 'Pinned resources show first, in their own section (max 3 will be shown; a 4th falls back into the regular list).',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Date & Timestamp',
      type: 'datetime',
      description: 'Controls ordering — newest first.',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
  ],
})
