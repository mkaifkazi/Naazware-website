import { describe, it, expect } from 'vitest'
import { HOME_SECTION_ORDER, hero, problem, sections, process, cta } from '@/lib/home-content'

describe('HOME_SECTION_ORDER', () => {
  it('is the approved 6-section SMB narrative in order', () => {
    expect(HOME_SECTION_ORDER).toEqual(['hero', 'problem', 'services', 'proof', 'process', 'cta'])
  })
})

describe('hero', () => {
  it('has SMB conversion copy and two CTAs', () => {
    expect(hero.headline.length).toBeGreaterThan(0)
    expect(hero.sub.length).toBeGreaterThan(0)
    expect(hero.primaryCta.href).toBe('/contact')
    expect(hero.secondaryCta.href).toBe('/work')
    expect(hero.capabilities.length).toBeGreaterThanOrEqual(3)
  })
})

describe('problem', () => {
  it('names the pain with exactly three points', () => {
    expect(problem.heading.length).toBeGreaterThan(0)
    expect(problem.points).toHaveLength(3)
    problem.points.forEach((p) => {
      expect(p.title.length).toBeGreaterThan(0)
      expect(p.body.length).toBeGreaterThan(0)
    })
  })
})

describe('sections', () => {
  it('provides heads for services, proof, process, testimonials', () => {
    ;(['services', 'proof', 'process', 'testimonials'] as const).forEach((k) => {
      expect(sections[k].eyebrow.length).toBeGreaterThan(0)
      expect(sections[k].heading.length).toBeGreaterThan(0)
    })
  })
})

describe('process', () => {
  it('is four ordered steps', () => {
    expect(process).toHaveLength(4)
    expect(process.map((s) => s.no)).toEqual(['01', '02', '03', '04'])
  })
})

describe('cta', () => {
  it('drives to contact', () => {
    expect(cta.heading.length).toBeGreaterThan(0)
    expect(cta.primary.href).toBe('/contact')
  })
})
