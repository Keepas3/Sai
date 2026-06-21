import { type SchemaTypeDefinition } from 'sanity'
import profile from './profile'
import music from './music'
import game from './game'
import project from './project'
import galleryPageContent from './gallery'


export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    profile,
    music,
    game,
    project,
    galleryPageContent,
  ],
}