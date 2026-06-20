export default {
  name: 'game',
  type: 'document',
  title: 'Video Game Log',
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
        layout: 'radio', // Displays them as neat toggle buttons!
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