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
      S.listItem()
        .title('Blog Posts')
        .schemaType('post')
        .child(
        S.documentTypeList('post')
          .title('Blog Posts & Logs')
          .initialValueTemplates([S.initialValueTemplateItem('post')])
        ),
        S.listItem()
      .title('Blog Categories')
      .schemaType('category')
      .child(
        S.documentTypeList('category')
          .title('Filter Topics / Tags')
          .initialValueTemplates([S.initialValueTemplateItem('category')])
      ),


      // 2. Music / Songs
      S.listItem()
        .title('Songs')
        .schemaType('musicPage')
        .child(S.documentTypeList('musicPage').title('Songs')),


      S.listItem()
        .title('Library Page')
        .child(
          S.list()
            .title('Library Tabs')
            .items([
              // Tab A: Loads your all-in-one game document wrapper directly
              S.listItem()
                .title('Games Tab')
                .schemaType('game')
                .child(
                  S.documentTypeList('game')
                    .title('Games Manager')
                ),
              // Tab B: Loads your books collection directly
              S.listItem()
                .title('Books Tab')
                .schemaType('book')
                .child(
                  S.documentTypeList('book')
                    .title('Books Manager')
                ),
            ])
        ),
      // 4. Active Projects
      S.listItem()
        .title('Projects')
        .schemaType('project')
        .child(S.documentTypeList('project').title('Projects')),
      
      // 5. Gallery
      S.listItem()
        .title('Gallery Albums')
        .schemaType('galleryTopic')
        .child(
          S.documentTypeList('galleryTopic')
            .title('Albums & Archives')
        ),
    
    ])