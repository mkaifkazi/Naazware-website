import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

const mediaSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    type: { type: String, default: '' },
    size: { type: Number, default: 0 },
    width: { type: Number },
    height: { type: Number },
    alt: { type: String },
    filename: { type: String },
  },
  { timestamps: true }
)

export type MediaDoc = InferSchemaType<typeof mediaSchema>
export const Media: Model<MediaDoc> =
  (models.Media as Model<MediaDoc>) ?? model<MediaDoc>('Media', mediaSchema)
