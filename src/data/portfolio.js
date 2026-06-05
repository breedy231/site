// TODO: Replace placeholder highlights with your real accomplishments and metrics
//
// Images: add an optional `image` field to any work or project entry:
//   image: { src: "/portfolio_images/your-image.png", alt: "Description" }
// Supports .png, .jpg, .gif, .webp — place files in public/portfolio_images/

export const workExperience = [
  {
    company: "Agency",
    url: "https://www.agency.com",
    role: "Member of Technical Staff",
    period: "Nov 2025 – Apr 2026",
    highlights: [
      "Full-stack development on an autonomous AI agent for customer management, powered by Anthropic's Claude (React/TypeScript + Python)",
      "Shipped AI-personalized broadcast messaging and Slack attachment ingestion into the knowledge pipeline",
      "Built end-to-end task automation from multiple source channels with 5+ agent tools and daily rollup notifications",
      "Created a task generation eval suite with production-mirrored scenarios to prevent quality regressions",
    ],
  },
  {
    company: "Klaviyo",
    url: "https://www.klaviyo.com",
    role: "Software Engineer → Senior SE → Lead SE / Engineering Manager",
    period: "June 2019 – Oct 2025",
    images: [
      {
        src: "/portfolio_images/klaviyo-portfolio.png",
        alt: "Klaviyo Portfolio project — Account performance report",
        caption: "Portfolio",
      },
      {
        src: "/portfolio_images/klaviyo-campaign-performance.jpg",
        alt: "Klaviyo Campaign Performance dashboard",
        caption: "Dashboard",
      },
      {
        src: "/portfolio_images/klaviyo-custom-reports.jpg",
        alt: "Klaviyo custom report builder",
        caption: "Custom Reports",
      },
      {
        src: "/portfolio_images/klaviyo-campaign-detail.jpg",
        alt: "Klaviyo Campaign Performance Detail table",
        caption: "Campaign Detail",
      },
    ],
    highlights: [
      "Led the Portfolio project end-to-end — POC, technical specs, cross-repo implementation — exceeding adoption targets by 400%",
      "Established the Reporting Consistency team: hired 3 engineers, authored the technical narrative and long-term roadmap",
      "Mentored 5 engineers with weekly 1:1s and targeted stretch projects; represented their cases during calibration",
      "Led dashboard redesign from spec through implementation in Node.js and Python",
      "Championed automated testing, increasing team code coverage from 30% to over 70%",
      "Built custom reports backend in Python, increasing feature adoption 20% YoY",
      "Designed a profile management service for seamless merging of customer profiles and historical events",
    ],
  },
]

export const coopsAndInternships = [
  {
    company: "Catalant",
    url: "https://www.gocatalant.com",
    role: "Software Engineering Co-op",
    highlights: [
      "Placeholder: Shipped a feature that improved a core business metric",
    ],
  },
  {
    company: "Carbonite",
    url: "https://www.carbonite.com",
    role: "Software Engineering Co-op",
    highlights: [
      "Placeholder: Contributed to a product used by a large user base",
    ],
  },
  {
    company: "Zipari",
    url: "https://www.zipari.com",
    role: "Software Engineering Intern",
    highlights: [
      "Placeholder: Built features for the platform from early stage",
    ],
  },
]

export const sideProjects = [
  {
    name: "Kindle E-Ink Dashboard",
    url: "https://github.com/breedy231/e_ink_screen",
    description:
      "A low-power e-ink dashboard for a jailbroken Kindle Touch, displaying real-time weather, system stats, and multiple customizable layouts. Uses serverless image generation via Netlify Functions with 5-minute refresh cycles optimized for battery life.",
    // image: { src: "/portfolio_images/e-ink-dashboard.png", alt: "E-ink dashboard running on a Kindle" },
    tech: ["Netlify Functions", "Shell", "Python"],
  },
  {
    name: "brendantreed.com",
    url: "https://github.com/breedy231/site",
    description:
      "This personal site — built with Astro 5 and React islands for zero-JS static pages with interactive sections. Integrates Trakt, Last.fm, and Goodreads APIs via Netlify Functions with automatic OAuth token refresh.",
    tech: ["Astro", "React", "Tailwind CSS", "Netlify Functions"],
  },
]

export const skills = [
  {
    category: "Languages",
    items: [
      "Python",
      "JavaScript",
      "TypeScript",
      "SQL",
      "HTML",
      "CSS",
      "Terraform",
      "Java",
    ],
  },
  {
    category: "Frameworks & Libraries",
    items: [
      "React",
      "Node.js",
      "Django",
      "Flask",
      "React Query",
      "Astro",
      "Tailwind CSS",
    ],
  },
  {
    category: "Databases",
    items: ["PostgreSQL", "MySQL", "ClickHouse", "MongoDB"],
  },
  {
    category: "Tools & Platforms",
    items: [
      "Git",
      "AWS",
      "GCP",
      "Docker",
      "Jenkins",
      "Kafka",
      "GitHub Actions",
      "Netlify",
      "Figma",
    ],
  },
]
