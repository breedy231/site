// TODO: Replace placeholder highlights with your real accomplishments and metrics
//
// Images: add an optional `image` field to any work or project entry:
//   image: { src: "/portfolio-images/your-image.png", alt: "Description" }
// Supports .png, .jpg, .gif, .webp — place files in public/portfolio-images/

export const workExperience = [
  {
    company: "Agency",
    url: "https://www.agency.com",
    role: "Member of Technical Staff",
    period: "Nov 2025 – Apr 2026",
    highlights: [
      "Building an autonomous AI agent for customer management (renewals, expansion, nurturing) powered by Anthropic's Claude, working across React/TypeScript frontend and Python backend",
      "Shipped AI-personalized broadcast messaging, enabling the agent to tailor outreach based on account context, prior touchpoints, and recipient attributes",
      "Built end-to-end task automation: generation from email, meetings, and Slack, 5+ agent tools for autonomous management, and daily rollup notifications for high-priority items",
      "Created a task generation evaluation suite using production-mirrored scenarios with known-good and known-bad baselines to prevent quality regressions",
    ],
  },
  {
    company: "Klaviyo",
    url: "https://www.klaviyo.com",
    role: "Software Engineer → Senior SE → Lead SE / Engineering Manager",
    period: "June 2019 – Oct 2025",
    // image: { src: "/portfolio-images/klaviyo.png", alt: "Klaviyo dashboard" },
    images: [
      {
        src: "/portfolio-images/klaviyo-portfolio.png",
        alt: "Klaviyo Portfolio project — Account performance report with top performing accounts, revenue, and conversion metrics",
      },
      {
        src: "/portfolio-images/klaviyo-campaign-performance.png",
        alt: "Klaviyo Campaign Performance dashboard showing open rate, click rate, and placed order rate trends",
      },
      {
        src: "/portfolio-images/klaviyo-custom-reports.png",
        alt: "Klaviyo custom report builder for single metric deep dive reports",
      },
      {
        src: "/portfolio-images/klaviyo-campaign-detail.png",
        alt: "Klaviyo Campaign Performance Detail table with email delivery and engagement metrics",
      },
    ],
    highlights: [
      "Led implementation of the Portfolio project end-to-end — proof-of-concept, technical specs, cross-repo code across frontend/backend/infrastructure — delivering on time and exceeding adoption targets by 400%",
      "Established the Reporting Consistency team: hired and onboarded 3 engineers, set up agile practices, and authored the team's technical narrative and long-term roadmap",
      "Mentored 5 engineers across the org with weekly 1:1s, targeted stretch projects, and represented their performance cases during calibration",
      "Led redesign of the dashboard experience from technical spec through implementation in Node.js and Python, incorporating customer feedback with stakeholders",
      "Championed automated testing, increasing team code coverage from 30% to over 70%",
      "Built backend Python services for custom reports, increasing feature adoption by 20% YoY through new feature development",
      "Designed a profile management service for seamless merging of customer profiles and associated historical events",
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
    // image: { src: "/portfolio-images/e-ink-dashboard.png", alt: "E-ink dashboard running on a Kindle" },
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
