export default {
  name: 'musicPage',
  type: 'document',
  title: 'Music Page Content',
  fields: [
    {
      name: 'pageTitle',
      type: 'string',
      title: 'Page Title',
      initialValue: 'My Playlist & Top Tracks',
    },
    // --- TOP tracks ---
    {
      name: 'topSongs',
      type: 'array',
      title: 'Top 3 Songs',
      description: 'Add up to 3 of your current favorite tracks.',
      validation: (Rule: any) => Rule.max(3).error('You can only feature up to 3 tracks!'),
      of: [
        {
          type: 'object',
          name: 'song',
          title: 'Track Details',
          fields: [
            { name: 'title', type: 'string', title: 'Song Title' },
            { name: 'artist', type: 'string', title: 'Artist' },
            { name: 'spotifyTrackUrl', type: 'url', title: 'Spotify Track Link' }
          ]
        }
      ]
    },
    // --- NEW DYNAMIC MULTI-PLAYLIST TOPICS SECTION ---
    {
      name: 'playlistTopics',
      type: 'array',
      title: 'Playlist Topics / Moods',
      description: 'Create custom music sections (e.g., Lofi, High Energy). You can add up to 3 topics.',
      validation: (Rule: any) => Rule.max(6).error('You can feature up to 6 different playlist topics!'),
      of: [
        {
          type: 'object',
          name: 'playlistTopic',
          title: 'Topic Details',
          fields: [
            { 
              name: 'topicName', 
              type: 'string', 
              title: 'Topic Name', 
              description: 'e.g., Playlist for Architecture, High Energy & Tactics' 
            },
            { 
              name: 'topicDescription', 
              type: 'string', 
              title: 'Topic Description / Mood', 
              description: 'e.g., Oriental-inspired or lofi tracks.' 
            },
            {
              name: 'urls',
              type: 'array',
              title: 'Playlist Links',
              description: 'Paste up to 3 different playlist URLs under this topic.',
              validation: (Rule: any) => Rule.max(3).error('Up to 3 playlists per topic.'),
              of: [{ type: 'url' }]
            }
          ]
        }
      ]
    }
  ]
}