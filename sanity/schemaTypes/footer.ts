export default {
  name: 'footerSettings',
  title: 'Footer Settings',
  type: 'document',

  preview: {
    prepare() {
      return {
        title: 'Global Footer Configuration', // This is the big formal title
        subtitle: 'Manage ambient quotes and cycle timers', // Optional: adds a nice little description underneath
      };
    },
  },
  fields: [
    {
      name: 'cycleInterval',
      title: 'Quote Cycle Interval (Seconds)',
      description: 'How long should each quote stay on screen before fading to the next one?',
      type: 'number',
      initialValue: 10,
      validation: (Rule: any) => Rule.required().min(3).max(60),
    },
    {
      name: 'zenQuotes',
      title: 'Zen Quotes & Thoughts Library',
      description: 'Add your favorite quotes, lyrics, or thoughts.',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'text',
              title: 'Quote Text',
              type: 'text',
              rows: 3,
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'author',
              title: 'Context / Author (Optional)',
              description: 'e.g., "Miyamoto Musashi", "Currently thinking", or a song name.',
              type: 'string',
            },
          ],
        },
      ],
    },
  ],
};