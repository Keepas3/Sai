import { type SchemaTypeDefinition } from 'sanity'
import gallery from './gallery'
import project from './project'
import game from './game'
import music from './music'
export const schema: { types: SchemaTypeDefinition[] } = {
  types: [gallery, project, game, music],
}
