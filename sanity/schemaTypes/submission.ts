import { defineField, defineType } from 'sanity'

/** Contact-form submissions. Created by the API route, viewed (read-only) in the Studio inbox. */
export const submission = defineType({
  name: 'submission',
  title: 'Contact Submission',
  type: 'document',
  // Block creating/editing from the Studio — these come only from the website form.
  readOnly: true,
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({ name: 'company', title: 'Company', type: 'string' }),
    defineField({ name: 'budget', title: 'Budget', type: 'string' }),
    defineField({ name: 'message', title: 'Message', type: 'text', rows: 6 }),
    defineField({ name: 'createdAt', title: 'Received', type: 'datetime' }),
  ],
  orderings: [{ title: 'Newest first', name: 'createdAtDesc', by: [{ field: 'createdAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'name', subtitle: 'email' },
  },
})
