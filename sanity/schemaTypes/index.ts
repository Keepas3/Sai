import { type SchemaTypeDefinition } from 'sanity'
import profile from './profile'
import { postType } from './post'
import { categoryType } from './category'
import music from './music'
import game from './game'
import {bookType} from './book'
import project from './project'
import galleryPageContent from './gallery'


export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    profile,
    postType,
    categoryType,
    music,
    game,
    bookType,
    project,
    galleryPageContent,
  ],
}