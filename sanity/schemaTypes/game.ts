export default {
  name: 'game',
  type: 'document',
  title: 'Games Page Settings',
  fields: [
    {
      name: 'pageTitle',
      type: 'string',
      title: 'Section / Page Title',
      description: 'e.g., My Gaming Logs, Currently Playing & Backlog',
    },
    {
      name: 'gamesList',
      type: 'array',
      title: 'Games Inventory',
      description: 'Add your games here and drag them into the exact sequence you want them to appear on your layout.',
      of: [
        {
          type: 'object',
          name: 'gameItem',
          title: 'Game Entry',
          fields: [
            {
              name: 'title',
              type: 'string',
              title: 'Game Title',
            },
            {
              name: 'developer',
              type: 'string',
              title: 'Developer / Studio',
            },
            {
              name: 'coverImage',
              type: 'image',
              title: 'Game Cover Art (Optional)',
              options: {
                hotspot: true,
              }
            },
            {
              name: 'status',
              type: 'string',
              title: 'Playing Status',
              options: {
                list: [
                  { title: 'Currently Playing', value: 'playing' },
                  { title: 'Completed', value: 'completed' },
                  { title: 'Backlog / To Play', value: 'backlog' },
                ],
                layout: 'radio',
              },
            },
            {
              name: 'rating',
              type: 'string',
              title: 'Personal Rating (Optional)',
              options: {
                list: ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'],
              }
            },
            {
              name: 'review',
              type: 'text',
              title: 'Your Thoughts / Review',
              description: 'Write a brief note on what you love or hate about the game.',
            }
          ]
        }
      ]
    }
  ]
};