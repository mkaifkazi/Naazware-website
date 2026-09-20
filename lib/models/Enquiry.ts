import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

const enquirySchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    company: { type: String, default: '' },
    budget: { type: String, default: '' },
    message: { type: String, required: true },
    prefersCall: { type: Boolean, default: false },
    phone: { type: String, default: '' },
    preferredTime: { type: String, default: '' },
    status: { type: String, enum: ['new', 'read', 'archived'], default: 'new' },
  },
  { timestamps: true }
)

export type EnquiryDoc = InferSchemaType<typeof enquirySchema>
export const Enquiry: Model<EnquiryDoc> =
  (models.Enquiry as Model<EnquiryDoc>) ?? model<EnquiryDoc>('Enquiry', enquirySchema)
