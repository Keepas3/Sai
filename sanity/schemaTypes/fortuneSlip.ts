export default {
  name: 'fortuneSlip',
  title: 'Fortune Slips',
  type: 'document',

  preview: {
    prepare() {
      return {
        title: "Today's Fortune Configuration",
        subtitle: 'Manage fortune slip library',
      };
    },
  },

  fields: [
    {
      name: 'fortuneSlips',
      title: 'Fortune Slips Library',
      description: 'Add your collection of fortune slips. One will be randomly selected.',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Slip Title',
              type: 'string',
              validation: (Rule: any) => Rule.required().min(1).max(80),
            },
            {
              name: 'preview',
              title: 'Preview Text',
              description: 'Short teaser shown before the slip is opened.',
              type: 'string',
              validation: (Rule: any) => Rule.required().min(1).max(140),
            },
            {
              name: 'note',
              title: 'Fortune Note',
              description: 'The full message shown when the slip is opened.',
              type: 'text',
              rows: 6,
              validation: (Rule: any) => Rule.required().min(1),
            },
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'preview',
            },
          },
        },
      ],
    },
  ],
};
