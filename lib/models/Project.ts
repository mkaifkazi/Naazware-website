import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose'

const metricSchema = new Schema(
  { label: { type: String, default: '' }, value: { type: String, default: '' } },
  { _id: false }
)

const seoSchema = new Schema(
  { title: { type: String }, description: { type: String }, ogImage: { type: String } },
  { _id: false }
)

const embeddedTestimonial = new Schema(
  { quote: { type: String }, author: { type: String }, role: { type: String } },
  { _id: false }
)

const projectSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    client: { type: String, required: true },
    industry: { type: String, default: '' },
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, default: '' },
    challenge: { type: String, default: '' },
    solution: { type: String, default: '' },
    outcome: { type: String, default: '' },
    services: { type: [String], default: [] },
    technologies: { type: [String], default: [] },
    metrics: { type: [metricSchema], default: [] },
    coverMedia: { type: Types.ObjectId, ref: 'Media' },
    gallery: { type: [Types.ObjectId], ref: 'Media', default: [] },
    videoUrl: { type: String },
    externalUrl: { type: String },
    testimonial: { type: embeddedTestimonial },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    seo: { type: seoSchema, default: {} },
  },
  { timestamps: true }
)

export type ProjectDoc = InferSchemaType<typeof projectSchema>
export const Project: Model<ProjectDoc> =
  (models.Project as Model<ProjectDoc>) ?? model<ProjectDoc>('Project', projectSchema)
