'use client'

import React from 'react'
import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { apiVersion, dataset, projectId } from './sanity/env'
import { schema } from './sanity/schemaTypes'
import { structure } from './sanity/structure'

const DEVELOPER_EMAIL = 'bfun679@gmail.com'
const hiddenFromClient = ['siteSettings']

export default defineConfig({
  name: 'default',
  title: 'Content Workspace',
  basePath: '/studio', 
  projectId,
  dataset,
  schema,
  
  studio: {
    components: {
      // Strips the navbar component out of the application root completely
      navbar: () => React.createElement('div', { style: { display: 'none' } })
    }
  },
  
  plugins: [
    structureTool({
      structure: (S, context) => {
        // Keeps your full sidebar for you, and filters it for the client
        if (context.currentUser?.email === DEVELOPER_EMAIL) {
          return structure(S, context)
        }
        
        const clientStructure = structure(S, context) as any
        return S.list()
          .title('Website Manager')
          .items(
            clientStructure
              .getItems()
              .filter((item: any) => !hiddenFromClient.includes(item.getId() || ''))
          )
      }
    }),
    
    visionTool({defaultApiVersion: apiVersion})
  ],

  document: {
    actions: (prev, context) => {
      // Keeps destructive actions safe from the client profile
      if (context.currentUser?.email !== DEVELOPER_EMAIL) {
        return prev.filter(a => a.action !== 'delete' && a.action !== 'duplicate' && a.action !== 'unpublish')
      }
      return prev
    }
  }
})
