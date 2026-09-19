import { connectDb } from './db'
import { Project } from './models/Project'
import { Post } from './models/Post'
import { Testimonial } from './models/Testimonial'

export async function getDashboardStats() {
  await connectDb()
  const [projects, publishedProjects, posts, draftPosts, testimonials] = await Promise.all([
    Project.countDocuments(),
    Project.countDocuments({ status: 'published' }),
    Post.countDocuments(),
    Post.countDocuments({ status: 'draft' }),
    Testimonial.countDocuments(),
  ])
  return { enquiries: 0, projects, publishedProjects, posts, draftPosts, testimonials }
}
