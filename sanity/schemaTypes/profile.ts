export default {
  name: 'profile',
  title: 'Profile & Homepage',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Display Name',
      type: 'string',
      description: 'Your name as it appears on the homepage',
    },
    {
      name: 'bio',
      title: 'Biography / Tagline',
      type: 'text',
      description: 'The short phrase or quote under your name',
    },
    {
      name: 'avatar',
      title: 'Profile Avatar',
      type: 'image',
      options: {
        hotspot: true, // Allows you to crop the image inside Sanity
      },
    },
    {
      name: 'banner',
      title: 'Background Banner',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
  ],
};