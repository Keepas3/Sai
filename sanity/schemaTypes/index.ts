import { type SchemaTypeDefinition } from 'sanity'
import profile from './profile'
import { postType } from './post'
import { categoryType } from './category'
import music from './music'
import game from './game'
import {bookType} from './book'
import project from './project'
import galleryTopic from './galleryTopic'
import galleryItem from './galleryItem'
import nowPlaying from './nowPlaying'
import footerSettings from './footer'


export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    profile,
    postType,
    categoryType,
    music,
    game,
    bookType,
    project,
    galleryTopic,
    galleryItem,
    nowPlaying,
    footerSettings,
  ],
}