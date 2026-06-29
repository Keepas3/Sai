import { defineType, defineField } from 'sanity'

export const bookType = defineType({
  name: 'book',
  title: 'Books Library',
  type: 'document',
  fields: [
    defineField({
      name: 'pageTitle',
      title: 'Section / Page Title',
      type: 'string',
      description: 'e.g., My Reading Log, Currently Reading & Backlog',
      initialValue: 'Books',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'booksList',
      title: 'Books Inventory',
      type: 'array',
      description: 'Add your books here and drag them into the exact sequence you want them to appear.',
      of: [
        {
          type: 'object',
          title: 'Book Entry',
          fields: [
            defineField({
              name: 'title',
              title: 'Book Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'author',
              title: 'Author',
              type: 'string',
            }),
            defineField({
              name: 'coverImage',
              title: 'Book Cover Art',
              type: 'image',
              options: { hotspot: true },
            }),
            defineField({
              name: 'status',
              title: 'Reading Status',
              type: 'string',
              options: {
                list: [
                  { title: '📖 Reading', value: 'reading' },
                  { title: '🏆 Completed', value: 'completed' },
                  { title: '⏳ Backlog', value: 'backlog' },
                ],
                layout: 'radio',
              },
              initialValue: 'backlog',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
            name: 'rating',
            title: 'Personal Rating (Optional)',
            type: 'string',
            options: {
                list: [
                { title: '⭐ (1/5)', value: '⭐' },
                { title: '⭐⭐ (2/5)', value: '⭐⭐' },
                { title: '⭐⭐⭐ (3/5)', value: '⭐⭐⭐' },
                { title: '⭐⭐⭐⭐ (4/5)', value: '⭐⭐⭐⭐' },
                { title: '⭐⭐⭐⭐⭐ (5/5)', value: '⭐⭐⭐⭐⭐' }
                ],
            }
            }),
            defineField({
              name: 'review',
              title: 'Personal Review / Notes',
              type: 'text',
              rows: 3,
            }),
          ],
          // This makes the item rows in Sanity Studio display the book name and author cleanly!
          preview: {
            select: {
              title: 'title',
              subtitle: 'author',
              media: 'coverImage',
            },
          },
        },
      ],
    }),
  ],
})