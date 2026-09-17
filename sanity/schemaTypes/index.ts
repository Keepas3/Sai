import { type SchemaTypeDefinition } from 'sanity'
import profile from './profile'
import { postType } from './post'
import { categoryType } from './category'
import music from './music'
import game from './game'
import {bookType} from './book'
import { projectEntryType } from './projectEntry'
import galleryTopic from './galleryTopic'
import galleryItem from './galleryItem'
import nowPlaying from './nowPlaying'
import footerSettings from './footer'
import backgroundTheme from './backgroundTheme'
import { resourceType } from './resource'
import fortuneSlip from './fortuneSlip'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    profile,
    postType,
    categoryType,
    music,
    game,
    bookType,
    projectEntryType,
    galleryTopic,
    galleryItem,
    nowPlaying,
    footerSettings,
    backgroundTheme,
    resourceType,
    fortuneSlip,
  ],
}