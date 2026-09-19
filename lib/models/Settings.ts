import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

// Singleton: exactly one document holds the editable site settings.
const settingsSchema = new Schema(
  {
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    github: { type: String, default: '' },
  },
  { timestamps: true }
)

export type SettingsDoc = InferSchemaType<typeof settingsSchema>
export const Settings: Model<SettingsDoc> =
  (models.Settings as Model<SettingsDoc>) ?? model<SettingsDoc>('Settings', settingsSchema)
