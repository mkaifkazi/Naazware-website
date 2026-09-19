import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose'

const testimonialSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, default: '' },
    company: { type: String, default: '' },
    quote: { type: String, required: true },
    image: { type: Types.ObjectId, ref: 'Media' },
    companyLogo: { type: Types.ObjectId, ref: 'Media' },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export type TestimonialDoc = InferSchemaType<typeof testimonialSchema>
export const Testimonial: Model<TestimonialDoc> =
  (models.Testimonial as Model<TestimonialDoc>) ??
  model<TestimonialDoc>('Testimonial', testimonialSchema)
