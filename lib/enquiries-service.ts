import { connectDb } from './db'
import { Enquiry, type EnquiryDoc } from './models/Enquiry'
import type { EnquiryInput, EnquiryStatus } from './schemas/enquiry'

export type AdminEnquiryRow = {
  id: string
  name: string
  email: string
  company: string
  budget: string
  prefersCall: boolean
  phone: string
  preferredTime: string
  status: EnquiryStatus
  createdAt: Date
}

export async function createEnquiry(input: EnquiryInput): Promise<{ id: string }> {
  await connectDb()
  const created = await Enquiry.create({
    name: input.name,
    email: input.email,
    company: input.company ?? '',
    budget: input.budget,
    message: input.message,
    prefersCall: input.prefersCall ?? false,
    phone: input.phone ?? '',
    preferredTime: input.preferredTime ?? '',
    status: 'new',
  })
  return { id: String(created._id) }
}

export async function getEnquiryById(id: string): Promise<EnquiryDoc | null> {
  await connectDb()
  return Enquiry.findById(id).lean<EnquiryDoc>()
}

export async function setEnquiryStatus(id: string, status: EnquiryStatus): Promise<boolean> {
  await connectDb()
  const res = await Enquiry.findByIdAndUpdate(id, { $set: { status } })
  return Boolean(res)
}

export async function deleteEnquiry(id: string): Promise<boolean> {
  await connectDb()
  const res = await Enquiry.findByIdAndDelete(id)
  return Boolean(res)
}

export async function listEnquiries(
  opts: { search?: string; status?: EnquiryStatus } = {}
): Promise<AdminEnquiryRow[]> {
  await connectDb()
  const filter: Record<string, unknown> = {}
  if (opts.status) filter.status = opts.status
  if (opts.search) {
    const rx = new RegExp(opts.search, 'i')
    filter.$or = [{ name: rx }, { email: rx }, { company: rx }, { message: rx }]
  }
  const rows = await Enquiry.find(filter)
    .sort({ createdAt: -1 })
    .lean<(EnquiryDoc & { _id: unknown; createdAt: Date })[]>()
  return rows.map((e) => ({
    id: String(e._id),
    name: e.name,
    email: e.email,
    company: e.company ?? '',
    budget: e.budget ?? '',
    prefersCall: Boolean(e.prefersCall),
    phone: e.phone ?? '',
    preferredTime: e.preferredTime ?? '',
    status: (e.status ?? 'new') as EnquiryStatus,
    createdAt: e.createdAt,
  }))
}
