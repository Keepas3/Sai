import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'nowPlaying',
  title: 'Now Playing Track',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Track Title',
      type: 'string',
    }),
    defineField({
      name: 'artist',
      title: 'Artist',
      type: 'string',
    }),
    defineField({
      name: 'audioFile',
      title: 'Audio File',
      type: 'file',
      options: { accept: 'audio/*' },
    }),
    defineField({
      name: 'loopStart',
      title: 'Loop Start Time (Seconds)',
      type: 'number',
      description: 'Timestamp to loop back to (e.g., 59 for 0:59)',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'loopEnd',
      title: 'Loop End Time (Seconds)',
      type: 'number',
      description: 'Timestamp where the loop resets (e.g., 110 for 1:50)',
      validation: (Rule) => Rule.min(0),
    }),
  ],
})