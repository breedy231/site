// TODO: Replace placeholder highlights with your real accomplishments and metrics
//
// Images: add an optional `image` field to any work or project entry:
//   image: { src: "/portfolio-images/your-image.png", alt: "Description" }
// Supports .png, .jpg, .gif, .webp — place files in public/portfolio-images/

export const workExperience = [
  {
    company: "Klaviyo",
    url: "https://www.klaviyo.com",
    role: "Lead Software Engineer",
    period: "2022 – 2025",
    // image: { src: "/portfolio-images/klaviyo.png", alt: "Klaviyo dashboard" },
    highlights: [
      "Placeholder: Led a major frontend initiative that improved performance or user experience",
      "Placeholder: Mentored engineers and drove engineering culture improvements",
      "Placeholder: Built or owned a key product feature with measurable impact",
    ],
  },
  {
    company: "Catalant",
    url: "https://www.gocatalant.com",
    role: "Software Engineering Co-op",
    period: "2020 – 2022",
    highlights: [
      "Placeholder: Shipped a feature that improved a core business metric",
      "Placeholder: Introduced a technical improvement that boosted team velocity",
    ],
  },
  {
    company: "Carbonite",
    url: "https://www.carbonite.com",
    role: "Software Engineering Co-op",
    period: "2018 – 2020",
    highlights: [
      "Placeholder: Contributed to a product used by a large user base",
      "Placeholder: Improved reliability or performance of a key system",
    ],
  },
  {
    company: "Zipari",
    url: "https://www.zipari.com",
    role: "Software Engineer",
    period: "2016 – 2018",
    highlights: [
      "Placeholder: Built features for the platform from early stage",
      "Placeholder: Gained foundational experience in full-stack development",
    ],
  },
]

export const sideProjects = [
  {
    name: "Kindle E-Ink Dashboard",
    url: "https://github.com/breedy231/e_ink_screen",
    description:
      "A low-power e-ink dashboard for a jailbroken Kindle Touch, displaying real-time weather, system stats, and multiple customizable layouts. Uses serverless image generation via Netlify Functions with 5-minute refresh cycles optimized for battery life.",
    // image: { src: "/portfolio-images/e-ink-dashboard.png", alt: "E-ink dashboard running on a Kindle" },
    tech: ["JavaScript", "Netlify Functions", "Shell", "Python", "OpenSCAD"],
  },
  {
    name: "brendanreed.com",
    url: "https://github.com/breedy231/site",
    description:
      "This personal site — built with Astro 5 and React islands for zero-JS static pages with interactive sections. Integrates Trakt, Last.fm, and Goodreads APIs via Netlify Functions with automatic OAuth token refresh.",
    tech: ["Astro", "React", "Tailwind CSS", "Netlify Functions"],
  },
]

export const skills = [
  {
    category: "Languages",
    items: ["JavaScript", "TypeScript", "Python", "HTML", "CSS"],
  },
  {
    category: "Frameworks & Libraries",
    items: ["React", "Astro", "Next.js", "Node.js", "Tailwind CSS"],
  },
  {
    category: "Tools & Platforms",
    items: ["Git", "GitHub Actions", "Netlify", "Docker", "PostgreSQL"],
  },
]
