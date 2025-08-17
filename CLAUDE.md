# Claude Code Project Notes

## Build System

- The `public/` directory contains build output and is gitignored
- Source files should be edited in `static/` directory, not `public/`
- Files in `static/` get copied to `public/` during the build process

## File Structure

- **Source files**: `static/` directory (tracked in git)
- **Build output**: `public/` directory (gitignored)

When fixing files for deployment, always edit the source files in `static/`, not the generated files in `public/`.
