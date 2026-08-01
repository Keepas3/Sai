import { defineField, defineType } from 'sanity';

// A small curated palette so editors pick a swatch color from a preset list
// instead of typing arbitrary hex codes. Add/remove/reorder entries here as
// needed — no frontend changes required, since useBackgroundTheme.ts just
// reads whatever hex string ends up in `swatchColor`.
const SWATCH_COLOR_OPTIONS = [
  { title: 'Forest Green', value: '#1f6b3a' },
  { title: 'City Purple', value: '#2b1740' },
  { title: 'Ocean Blue', value: '#023e5c' },
  { title: 'Sunset Orange', value: '#d9724f' },
  { title: 'Midnight Space', value: '#241b47' },
  { title: 'Slate Gray', value: '#3a3a3a' },
  { title: 'Crimson', value: '#8b1e3f' },
  { title: 'Gold', value: '#b8860b' },
  { title: 'Teal', value: '#0f766e' },
  { title: 'Rose Pink', value: '#e5729f' },
];

export default defineType({
  name: 'backgroundTheme',
  title: 'Background Theme',
  type: 'document',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'Name shown in the background picker (e.g. "Forest").',
      validation: (Rule) => Rule.required().max(30),
    }),
    defineField({
      name: 'swatchColor',
      title: 'Swatch Color',
      type: 'string',
      description:
        'Shown as the little dot next to this theme in the picker.',
      options: {
        list: SWATCH_COLOR_OPTIONS,
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      description: 'The photo shown as the background when this theme is selected.',
      options: {
        hotspot: true,
      },
    //   validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'label',
      subtitle: 'swatchColor',
      media: 'backgroundImage',
    },
  },
});