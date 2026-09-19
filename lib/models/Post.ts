import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose'

const postSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    coverMedia: { type: Types.ObjectId, ref: 'Media' },
    content: { type: Schema.Types.Mixed }, // Tiptap JSON (from P6)
    contentMarkdown: { type: String, default: '' }, // interim body for reseed/public render
    contentHtml: { type: String, default: '' }, // derived from Tiptap JSON at save (P6)
    author: { type: String, default: 'Naazware' },
    category: { type: String, default: '' },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishDate: { type: Date, default: Date.now },
    readTime: { type: String, default: '' },
    seoTitle: { type: String },
    seoDescription: { type: String },
    ogImage: { type: String },
  },
  { timestamps: true }
)

export type PostDoc = InferSchemaType<typeof postSchema>
export const Post: Model<PostDoc> =
  (models.Post as Model<PostDoc>) ?? model<PostDoc>('Post', postSchema)
