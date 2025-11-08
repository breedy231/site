# Gatsby & Netlify Functions Migration Plan

**Status**: Planning Phase
**Target**: Upgrade Gatsby 5.11.0 → 5.15.0 + Migrate to Modern Netlify Functions V2
**Created**: 2025-11-08

---

## Executive Summary

This document outlines the migration strategy to upgrade Gatsby from 5.11.0 to 5.15.0+ and fully migrate all serverless functions to Netlify Functions V2 API format. This migration was blocked in PR #32 due to breaking changes in Gatsby 5.12.0+ that require all serverless functions to use the modern V2 API format.

### Why This Migration Is Necessary

1. **Security**: Stay current with security patches in Gatsby and dependencies
2. **Performance**: Gatsby 5.12.0+ includes performance improvements
3. **Modern API**: Netlify Functions V2 is the recommended format going forward
4. **Consistency**: Eliminate mixed function formats in the codebase
5. **Future-proofing**: Avoid accumulating more technical debt

---

## Current State Analysis

### Gatsby & Build System

- **Gatsby Version**: 5.11.0 (locked)
- **Build System**: `gatsby build` (Netlify uses gatsby-plugin-netlify)
- **Target Version**: 5.15.0 (latest stable)

### Serverless Functions Status

| Directory            | Format             | Status     | Count   |
| -------------------- | ------------------ | ---------- | ------- |
| `src/api/`           | Express-style (V1) | Legacy     | 4 files |
| `netlify/functions/` | Modern V2          | Production | 5 files |

**Key Issue**: Starting with Gatsby 5.12.0, `gatsby-adapter-netlify` auto-installs and REQUIRES all functions to use V2 format.

### Function Inventory

#### Functions in Both Directories (Need Migration):

1. ✅ `history.js` - Already V2 in netlify/functions (with auto-refresh)
2. ✅ `goodreads.js` - Already V2 in netlify/functions
3. ✅ `trakt-token.js` - Already V2 in netlify/functions (with dynamic redirect)
4. ✅ `lastfm.js` - Already V2 in netlify/functions

#### Functions Only in netlify/functions:

5. ✅ `refresh-token.js` - V2 only (auto token refresh)

**Critical Finding**: All `netlify/functions/` files are ALREADY in V2 format! The `src/api/` directory contains LEGACY versions that are NOT used in production.

### Dependencies Requiring Updates

| Package             | Current | Latest | Notes                                      |
| ------------------- | ------- | ------ | ------------------------------------------ |
| `gatsby`            | 5.11.0  | 5.15.0 | Blocked by function migration              |
| `gatsby-cli`        | 5.11.0  | 5.15.0 | Match Gatsby version                       |
| `gatsby-plugin-*`   | 3.x-6.x | Mixed  | Update to match Gatsby 5.15.0              |
| `node-fetch`        | 2.x     | 3.3.2  | NOT needed (V2 functions use native fetch) |
| `react`             | 18.0.0  | 18.3.1 | Stay on 18.x (19.x is too new)             |
| `react-dom`         | 18.0.0  | 18.3.1 | Match React version                        |
| `fast-xml-parser`   | 4.5.1   | 5.3.1  | Major version update                       |
| `styled-components` | 5.2.1   | 5.3.11 | Stay on 5.x (6.x requires migration)       |

---

## Migration Strategy

### Phase 1: Cleanup & Preparation (Low Risk)

**Goal**: Remove legacy code and prepare for migration

#### Tasks:

1. **Remove `src/api/` directory entirely**

   - All production functions are in `netlify/functions/`
   - `src/api/` contains outdated Express-style versions
   - No longer needed for development or production

2. **Remove/update prebuild script in package.json**

   - Current: `"prebuild": "mkdir -p netlify/functions && cp -r src/api/* netlify/functions/"`
   - This script is dangerous (would overwrite V2 functions with V1 versions)
   - **Action**: Remove this script entirely

3. **Remove unnecessary dependencies**

   - Remove `node-fetch` (not used in V2 functions)
   - Keep `express` in devDependencies (may be used for local dev server)

4. **Update documentation**

   - Remove references to `src/api/` directory
   - Update CLAUDE.md to reflect single source of truth: `netlify/functions/`
   - Document that all functions are now V2 format

5. **Verify netlify.toml configuration**
   - Confirm `functions = "netlify/functions"` is correct
   - Ensure all API redirects point to correct functions

#### Success Criteria:

- ✅ `src/api/` directory deleted
- ✅ Prebuild script removed
- ✅ Documentation updated
- ✅ Local development still works
- ✅ All tests pass

#### Risk Level: **LOW**

- Only removes unused code
- No production impact (production already uses netlify/functions/)

---

### Phase 2: Gatsby Plugin Ecosystem Updates (Medium Risk)

**Goal**: Update all Gatsby plugins to versions compatible with Gatsby 5.15.0

#### Tasks:

1. **Update Gatsby plugins to match 5.15.0 ecosystem**

   ```json
   "gatsby-plugin-image": "3.15.0",
   "gatsby-plugin-manifest": "5.15.0",
   "gatsby-plugin-mdx": "5.15.0",
   "gatsby-plugin-sass": "6.15.0",
   "gatsby-plugin-sharp": "5.15.0",
   "gatsby-plugin-styled-components": "6.15.0",
   "gatsby-source-filesystem": "5.15.0",
   "gatsby-transformer-remark": "6.15.0",
   "gatsby-transformer-sharp": "5.15.0"
   ```

2. **Update React to latest stable 18.x**

   ```json
   "react": "^18.3.1",
   "react-dom": "^18.3.1"
   ```

   - Stay on React 18.x (React 19 too new, may break Gatsby)

3. **Update build tooling**

   ```json
   "sass": "^1.93.3",
   "prettier-plugin-tailwindcss": "^0.7.1"
   ```

4. **Update parser dependencies**

   ```json
   "fast-xml-parser": "^5.3.1"
   ```

   - Test goodreads function thoroughly (breaking change 4.x → 5.x)

5. **Test build locally**
   ```bash
   gatsby clean
   gatsby build
   gatsby serve
   ```

#### Breaking Changes to Watch:

**fast-xml-parser 4.x → 5.x**

- API changes in parser configuration
- May require updates to `goodreads.js` function
- **Action**: Test XML parsing thoroughly

**Gatsby plugin updates**

- Image processing API may have changed
- MDX compilation may have new requirements
- **Action**: Test all MDX pages and images

#### Success Criteria:

- ✅ All dependencies updated
- ✅ `gatsby build` completes without errors
- ✅ `gatsby develop` runs successfully
- ✅ All pages render correctly
- ✅ Images load properly
- ✅ MDX content renders
- ✅ No console errors in development

#### Risk Level: **MEDIUM**

- Plugin updates may introduce breaking changes
- Thorough testing required
- Rollback available if issues found

---

### Phase 3: Gatsby Core Upgrade (High Risk)

**Goal**: Upgrade Gatsby from 5.11.0 to 5.15.0 and migrate to gatsby-adapter-netlify

#### Pre-requisites:

- ✅ Phase 1 complete (src/api removed)
- ✅ Phase 2 complete (plugins updated)
- ✅ All functions in `netlify/functions/` verified as V2 format

#### Tasks:

1. **Upgrade Gatsby core**

   ```json
   "gatsby": "^5.15.0",
   "gatsby-cli": "^5.15.0"
   ```

2. **Prepare for adapter auto-installation**

   - Gatsby 5.12.0+ will automatically:
     - Install `gatsby-adapter-netlify`
     - Remove `gatsby-plugin-netlify`
     - Require V2 function format
   - **No manual action needed** (happens during Netlify build)

3. **Update gatsby-config.js (if needed)**

   - Check if any configuration changes are required for adapter
   - Review Gatsby 5.12+ migration guide

4. **Test locally with new Gatsby version**

   ```bash
   gatsby clean
   gatsby build
   gatsby serve
   ```

5. **Test all serverless functions**
   - `/api/history` - History tracking with auto-refresh
   - `/api/goodreads` - Goodreads integration
   - `/api/trakt-token` - OAuth token exchange
   - `/api/lastfm` - Last.fm integration
   - `/.netlify/functions/refresh-token` - Token refresh

#### Breaking Changes in Gatsby 5.12.0+:

**gatsby-adapter-netlify auto-installation**

- Replaces `gatsby-plugin-netlify`
- Requires all functions to use V2 format
- We're already prepared (all functions are V2)

**Build process changes**

- May affect image optimization
- May affect SSR/DSG pages
- **Action**: Test all page types

#### Success Criteria:

- ✅ Gatsby 5.15.0 installed successfully
- ✅ Build completes without errors
- ✅ All pages render correctly
- ✅ All serverless functions respond correctly
- ✅ OAuth flow works (Trakt authentication)
- ✅ Auto-refresh token logic works
- ✅ No 502 errors from functions
- ✅ No console errors in production

#### Risk Level: **HIGH**

- Major version jump (5.11 → 5.15)
- Adapter changes build process
- Thorough testing required
- Have rollback plan ready

---

### Phase 4: Additional Dependency Updates (Optional)

**Goal**: Update remaining dependencies for improved performance and security

#### Safe Updates (Non-Breaking):

```json
{
  "axios": "^1.13.2",
  "sass": "^1.93.3",
  "framer-motion": "^12.23.24",
  "babel-plugin-styled-components": "^1.13.3"
}
```

#### Breaking Updates (Defer to Later):

```json
{
  "styled-components": "^5.3.11", // Stay on 5.x (6.x requires migration)
  "react": "^18.3.1", // Stay on 18.x (19.x too new)
  "node-fetch": "REMOVE" // Not needed with V2 functions
}
```

#### Success Criteria:

- ✅ Non-breaking updates applied
- ✅ All tests pass
- ✅ No regression in functionality

#### Risk Level: **LOW**

- Minor version updates only
- Can be done after Gatsby upgrade

---

## Testing Strategy

### Pre-Migration Testing Checklist

**Local Development:**

- [ ] `gatsby develop` starts without errors
- [ ] All pages accessible
- [ ] Hot reload works
- [ ] MDX content renders

**Local Build:**

- [ ] `gatsby clean` completes
- [ ] `gatsby build` succeeds
- [ ] `gatsby serve` works
- [ ] All routes accessible

**Serverless Functions (Local):**

- [ ] Test each function with curl/Postman
- [ ] Verify error handling
- [ ] Check environment variables

### Post-Migration Testing Checklist

**Production Deployment:**

- [ ] Netlify build succeeds
- [ ] Deploy preview works
- [ ] All pages render
- [ ] Images load correctly
- [ ] CSS/styling correct

**Serverless Functions (Production):**

- [ ] `/api/history` returns data
- [ ] `/api/goodreads` fetches books
- [ ] `/api/lastfm` retrieves music
- [ ] `/api/trakt-token` handles OAuth
- [ ] Token refresh works automatically

**OAuth Flow:**

- [ ] Visit `/now?admin`
- [ ] Click re-auth button
- [ ] Complete Trakt authorization
- [ ] Verify tokens displayed
- [ ] Check watching section loads

**Error Handling:**

- [ ] Test expired token scenario
- [ ] Verify auto-refresh triggers
- [ ] Check fallback messages for public users
- [ ] Verify no 502 errors

**Performance:**

- [ ] Page load times acceptable
- [ ] Lighthouse score maintained
- [ ] No console errors
- [ ] Function response times < 5s

---

## Rollback Plan

### If Migration Fails

**Phase 1 Rollback (Cleanup):**

```bash
git revert <commit-sha>
git push
```

- Restore `src/api/` directory
- Restore prebuild script
- Re-deploy

**Phase 2/3 Rollback (Gatsby Upgrade):**

```bash
# Revert to Gatsby 5.11.0
npm install gatsby@5.11.0 gatsby-cli@5.11.0
# Revert plugin versions
# See package.json in commit 65de8c8
git push
```

**Emergency Rollback:**

- Revert to last known good commit: `65de8c8`
- Netlify can rollback to previous deployment instantly
- No data loss risk (functions are stateless)

---

## Risk Assessment

### Risk Matrix

| Phase             | Risk Level | Impact | Mitigation                             |
| ----------------- | ---------- | ------ | -------------------------------------- |
| Phase 1: Cleanup  | LOW        | Low    | Only removes unused code               |
| Phase 2: Plugins  | MEDIUM     | Medium | Test thoroughly, rollback available    |
| Phase 3: Gatsby   | HIGH       | High   | Deploy preview testing, staged rollout |
| Phase 4: Optional | LOW        | Low    | Can be deferred                        |

### Risk Factors

**High Risk:**

- Gatsby version jump (5.11 → 5.15)
- Adapter auto-installation behavior
- fast-xml-parser major version update

**Medium Risk:**

- Multiple plugin updates simultaneously
- Image processing pipeline changes
- MDX compilation changes

**Low Risk:**

- Removing unused `src/api/` directory
- Minor dependency updates
- Documentation updates

### Mitigation Strategies

1. **Incremental Deployment**

   - Use Netlify deploy previews
   - Test on preview URL before promoting
   - Keep production on stable version until fully tested

2. **Automated Testing**

   - Run full build locally before pushing
   - Use GitHub Actions to test build
   - Verify all function endpoints

3. **Monitoring**

   - Watch Netlify function logs
   - Monitor error rates
   - Check response times

4. **Rollback Readiness**
   - Tag stable version before migration
   - Document rollback commands
   - Test rollback procedure

---

## Timeline & Effort Estimate

### Phase 1: Cleanup (1-2 hours)

- Remove src/api/: 15 min
- Update package.json: 15 min
- Update documentation: 30 min
- Testing: 30 min

### Phase 2: Plugin Updates (2-3 hours)

- Update dependencies: 30 min
- Local build testing: 1 hour
- Fix breaking changes: 1-2 hours
- Documentation: 30 min

### Phase 3: Gatsby Upgrade (3-4 hours)

- Upgrade Gatsby: 15 min
- Local testing: 1 hour
- Deploy preview testing: 1 hour
- Function testing: 1 hour
- Production deployment: 30 min
- Post-deploy monitoring: 30 min

### Phase 4: Optional Updates (1-2 hours)

- Update dependencies: 30 min
- Testing: 30 min
- Deploy: 30 min

**Total Estimated Effort**: 7-11 hours

---

## Implementation Order

### Recommended Approach: Separate PRs

**PR #1: Cleanup (Low Risk)**

- Remove `src/api/` directory
- Remove prebuild script
- Update documentation
- Small, safe changes
- Easy to review and merge

**PR #2: Gatsby Migration (High Risk)**

- Update all Gatsby dependencies
- Update plugins
- Update React
- Comprehensive testing
- Larger PR, needs thorough review

**PR #3: Optional Updates (Low Risk)**

- Update remaining dependencies
- Performance improvements
- Can be deferred if needed

### Alternative Approach: Single PR

**Advantages:**

- All changes together
- Single comprehensive test cycle
- Atomic migration

**Disadvantages:**

- Large PR, harder to review
- All-or-nothing approach
- Higher risk if issues found

**Recommendation**: Use separate PRs for better control and easier rollback

---

## Success Metrics

### Technical Metrics

- ✅ Gatsby 5.15.0 running in production
- ✅ All serverless functions using V2 format
- ✅ Zero 502 errors from functions
- ✅ Build time < 5 minutes
- ✅ Function response time < 5 seconds

### Code Quality Metrics

- ✅ No legacy `src/api/` directory
- ✅ Single source of truth for functions
- ✅ All dependencies up to date
- ✅ No security vulnerabilities
- ✅ Documentation current

### User Experience Metrics

- ✅ All pages load correctly
- ✅ Images display properly
- ✅ OAuth flow works
- ✅ Auto token refresh works
- ✅ No user-facing errors

---

## Dependencies & Pre-requisites

### Required:

- ✅ All functions in `netlify/functions/` are V2 format (DONE)
- ✅ Netlify deployment configuration correct (DONE)
- ✅ OAuth tokens valid (or can re-authenticate)
- ✅ Environment variables set in Netlify

### Recommended:

- ✅ Backup of current production deployment
- ✅ Access to Netlify dashboard
- ✅ Access to Trakt OAuth app configuration
- ✅ Test data for all API endpoints

---

## Open Questions

1. **Should we keep `src/api/` for reference?**

   - **Recommendation**: No, remove entirely to avoid confusion
   - Can always reference git history if needed

2. **Should we update styled-components to v6?**

   - **Recommendation**: No, defer to separate migration
   - v5 → v6 requires significant refactoring

3. **Should we upgrade React to v19?**

   - **Recommendation**: No, stay on React 18.x
   - React 19 too new, may have compatibility issues

4. **Should we test on deploy preview first?**

   - **Recommendation**: YES, always test on preview before production
   - Use Netlify's deploy preview feature

5. **Should we implement automated function tests?**
   - **Recommendation**: Nice to have, but not blocking
   - Can be added in future PR

---

## References

### Documentation

- [Gatsby 5.12.0 Release Notes](https://www.gatsbyjs.com/docs/reference/release-notes/v5.12/)
- [Gatsby Adapter for Netlify](https://www.gatsbyjs.com/docs/how-to/previews-deploys-hosting/deploying-to-netlify/#gatsby-adapter-for-netlify)
- [Netlify Functions V2 Migration Guide](https://developers.netlify.com/guides/migrating-to-the-modern-netlify-functions/)
- [fast-xml-parser Migration Guide](https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v5-upgrade-guide.md)

### Internal Documentation

- `CLAUDE.md` - Project build and deployment notes
- `netlify.toml` - Netlify configuration
- Previous PR #32 - Initial migration attempt

### Related Issues

- [Gatsby Issue #38542](https://github.com/gatsbyjs/gatsby/issues/38542) - Adapter breaking changes

---

## Approval & Sign-off

**Plan Created By**: Claude AI Assistant
**Date**: 2025-11-08
**Status**: Awaiting Review

**Reviewers**:

- [ ] Project Owner - Approve strategy and timeline
- [ ] Technical Lead - Approve technical approach
- [ ] DevOps - Approve deployment strategy

**Next Steps**:

1. Review this plan
2. Approve or request changes
3. Create PR #1 (Cleanup)
4. Begin implementation

---

## Notes

- This migration unblocks future dependency updates
- All serverless functions are ALREADY in V2 format (good news!)
- Main task is cleanup + Gatsby upgrade (not function conversion)
- Risk is manageable with proper testing
- Rollback plan is straightforward
