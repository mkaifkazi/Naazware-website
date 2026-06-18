import { defineField, defineType } from 'sanity'

export const project = defineType({
  name: 'project',
  title: 'Work / Case Study',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'client', title: 'Client', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'industry', title: 'Industry', type: 'string' }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({ name: 'coverImage', title: 'Cover image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'challenge', title: 'Challenge', type: 'text', rows: 4 }),
    defineField({ name: 'solution', title: 'Solution', type: 'text', rows: 4 }),
    defineField({ name: 'outcome', title: 'Outcome', type: 'text', rows: 4 }),
    defineField({
      name: 'metrics',
      title: 'Metrics',
      type: 'array',
      of: [
        defineField({
          name: 'metric',
          type: 'object',
          fields: [
            { name: 'value', title: 'Value', type: 'string' },
            { name: 'label', title: 'Label', type: 'string' },
          ],
          preview: { select: { title: 'value', subtitle: 'label' } },
        }),
      ],
    }),
    defineField({ name: 'technologies', title: 'Technologies', type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' } }),
    defineField({
      name: 'testimonial',
      title: 'Testimonial (optional)',
      type: 'object',
      fields: [
        { name: 'quote', title: 'Quote', type: 'text', rows: 3 },
        { name: 'author', title: 'Author', type: 'string' },
        { name: 'role', title: 'Role', type: 'string' },
      ],
    }),
    defineField({ name: 'featured', title: 'Featured on home', type: 'boolean', initialValue: false }),
    defineField({ name: 'order', title: 'Order', type: 'number', initialValue: 0 }),
  ],
  orderings: [{ title: 'Manual order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', subtitle: 'client', media: 'coverImage' },
  },
})
