import type { StructureResolver } from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content Management')
    .items([
      // 1. Profile / Homepage (Forced into first place)
      S.listItem()
        .title('Profile & Homepage')
        .schemaType('profile')
        .child(
          S.document()
            .schemaType('profile')
            .documentId('profile') // Keeps it as a single static page editor instead of a messy list!
        ),

      // 2. Music / Songs
      S.listItem()
        .title('Songs')
        .schemaType('musicPage')
        .child(S.documentTypeList('musicPage').title('Songs')),


      // 3. Games
      S.listItem()
        .title('Games Collection')
        .schemaType('game')
        .child(S.documentTypeList('game').title('Games')),

      // 4. Active Projects
      S.listItem()
        .title('Projects')
        .schemaType('project')
        .child(S.documentTypeList('project').title('Projects')),

      
      // 5. Gallery
      S.listItem()
        .title('Visual Gallery')
        .schemaType('gallerySlide')
        .child(S.documentTypeList('gallerySlide').title('Gallery Images')),
    ])