# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Build and Development:**

- `gatsby develop` - Start development server (default port 8000)
- `gatsby develop --https --cert-file ./certificates/localhost.crt --key-file ./certificates/localhost.key --host 0.0.0.0` - HTTPS development with custom certificates
- `gatsby build` - Build for production
- `gatsby serve` - Serve production build locally
- `gatsby clean` - Clean cache and public directories

**Code Quality:**

- `prettier --write "**/*.{js,jsx,ts,tsx,json,md}"` - Format all files
- `eslint` - Lint JavaScript files (configured via lint-staged)

**Testing:**

- Tests are not currently configured (placeholder in package.json suggests adding unit testing)

## Architecture Overview

**Framework & Hosting:**

- Gatsby 5 static site generator with React 18
- Hosted on Netlify with serverless functions
- Tailwind CSS + styled-components for styling
- MDX for blog content

**Key Directory Structure:**

- `src/pages/` - Route-based pages (index.js, headsup.js, now.js, blog/)
- `src/components/` - Reusable React components (Layout, ThemeToggle, SoundManager)
- `src/api/` - Serverless functions (copied to netlify/functions during build)
- `blog/` - MDX blog posts with frontmatter-based routing
- `src/context/` - React context providers (ThemeContext)

**Notable Features:**

- **Heads Up Game** (`src/pages/headsup.js`) - Interactive word game with device motion detection
- **Now Page** (`src/pages/now.js`) - Personal dashboard displaying media consumption via external APIs
- **API Integration** - Trakt.tv, Last.fm, and Goodreads APIs for media tracking
- **Dark Mode** - Theme switching via React context
- **Sound System** - Audio management for the Heads Up game

**API Architecture:**

- Development: APIs accessible at `/api/*`
- Production: Netlify functions at `/.netlify/functions/*`
- External integrations: Trakt (movies/TV), Last.fm (music), Goodreads (books)

**Data Flow:**

- Gatsby's GraphQL layer processes MDX blog posts and static assets
- Client-side API calls to serverless functions for dynamic data
- State management via React hooks and context

**Styling Approach:**

- Tailwind CSS for utility-first styling
- Styled-components for component-level styles
- SASS support available
- Responsive design with react-media breakpoints

**Authentication:**

- OAuth flows implemented for Trakt.tv integration
- Token management for API access
