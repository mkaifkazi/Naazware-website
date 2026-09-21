'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { site } from '@/lib/site'

const contactSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    company: z.string().optional(),
    budget: z.string().min(1, 'Please select a budget range'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
    consent: z.boolean().refine((val) => val === true, {
      message: 'You must agree to continue',
    }),
    website: z.string().optional(), // honeypot — must stay empty
    prefersCall: z.boolean().optional(),
    phone: z.string().optional(),
    preferredTime: z.string().optional(),
  })
  .refine((d) => !d.prefersCall || (d.phone?.trim().length ?? 0) > 0, {
    message: 'Add a phone number so we can call you',
    path: ['phone'],
  })

type ContactFormData = z.infer<typeof contactSchema>

const inputBase =
  'w-full rounded-xl border bg-ink-900/60 px-4 py-3 text-paper placeholder:text-paper-faint transition-colors focus:outline-none focus:ring-2 focus:ring-accent/60'

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const prefersCall = watch('prefersCall')

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setSubmitStatus('success')
        reset()
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const border = (hasError: unknown) => (hasError ? 'border-red-500/70' : 'border-ink-600')

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Honeypot: hidden from users; bots that fill it are silently dropped. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-paper">
          Name *
        </label>
        <input id="name" type="text" className={`${inputBase} ${border(errors.name)}`} {...register('name')} />
        {errors.name && <p className="mt-1.5 text-sm text-red-400">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-paper">
          Email *
        </label>
        <input id="email" type="email" className={`${inputBase} ${border(errors.email)}`} {...register('email')} />
        {errors.email && <p className="mt-1.5 text-sm text-red-400">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="company" className="mb-2 block text-sm font-medium text-paper">
          Company <span className="text-paper-faint">(optional)</span>
        </label>
        <input id="company" type="text" className={`${inputBase} border-ink-600`} {...register('company')} />
      </div>

      <div>
        <label htmlFor="budget" className="mb-2 block text-sm font-medium text-paper">
          Budget range *
        </label>
        <select id="budget" className={`${inputBase} ${border(errors.budget)}`} {...register('budget')}>
          <option value="">Select budget range</option>
          <option value="under-25k">Under ₹25,000</option>
          <option value="25k-1L">₹25,000 - ₹1,00,000</option>
          <option value="1L-3L">₹1,00,000 - ₹3,00,000</option>
          <option value="3L-5L">₹3,00,000 - ₹5,00,000</option>
          <option value="5L-10L">₹5,00,000 - ₹10,00,000</option>
          <option value="over-10L">Over ₹10,00,000</option>
        </select>
        {errors.budget && <p className="mt-1.5 text-sm text-red-400">{errors.budget.message}</p>}
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium text-paper">
          Tell us about your project *
        </label>
        <textarea
          id="message"
          rows={5}
          placeholder="What are you trying to build? What problem does it solve?"
          className={`${inputBase} ${border(errors.message)} resize-y`}
          {...register('message')}
        />
        {errors.message && <p className="mt-1.5 text-sm text-red-400">{errors.message.message}</p>}
        <p className="mt-1.5 text-sm text-paper-faint">We reply within 1 business day.</p>
      </div>

      <div className="flex items-start gap-3">
        <input
          id="prefersCall"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-ink-600 bg-ink-900 text-accent-soft accent-accent focus:ring-accent/60"
          {...register('prefersCall')}
        />
        <label htmlFor="prefersCall" className="text-sm text-paper-dim">
          I&apos;d prefer a call
        </label>
      </div>

      {prefersCall && (
        <div className="space-y-5 rounded-2xl border border-ink-600 bg-ink-900/40 p-5">
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium text-paper">
              Phone *
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              className={`${inputBase} ${border(errors.phone)}`}
              {...register('phone')}
            />
            {errors.phone && <p className="mt-1.5 text-sm text-red-400">{errors.phone.message}</p>}
          </div>
          <div>
            <label htmlFor="preferredTime" className="mb-2 block text-sm font-medium text-paper">
              Best time to reach you <span className="text-paper-faint">(optional)</span>
            </label>
            <input
              id="preferredTime"
              type="text"
              placeholder="e.g. weekday mornings"
              className={`${inputBase} border-ink-600`}
              {...register('preferredTime')}
            />
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <input
          id="consent"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-ink-600 bg-ink-900 text-accent-soft accent-accent focus:ring-accent/60"
          {...register('consent')}
        />
        <label htmlFor="consent" className="text-sm text-paper-dim">
          I agree to be contacted about my project.
        </label>
      </div>
      {errors.consent && <p className="-mt-2 text-sm text-red-400">{errors.consent.message}</p>}

      {submitStatus === 'success' && (
        <div role="alert" className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Thanks for reaching out! We&apos;ll be in touch within 24 hours.
        </div>
      )}
      {submitStatus === 'error' && (
        <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Something went wrong. Please try again or email us directly at {site.email}
        </div>
      )}

      <button type="submit" disabled={isSubmitting} className="btn-accent w-full disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
