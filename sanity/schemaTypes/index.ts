import type { SchemaTypeDefinition } from 'sanity'
import { testimonial } from './testimonial'
import { post } from './post'
import { project } from './project'
import { submission } from './submission'

export const schemaTypes: SchemaTypeDefinition[] = [project, post, testimonial, submission]
