
![Build Status](https://codebuild.eu-central-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiOXpqRUcvQzZDM3gzQUlPWGptd01zZ0lxNHR0ZjhIOXVtaFVUNFkzY1VBelpjU2xCZ3V4dFpzMzVtV1VCVXBjbnpKNkZydU5PdWdRSFBNQjJXSXhycU5JPSIsIml2UGFyYW1ldGVyU3BlYyI6IjdqL2ZWRHVmK0t5Q0ZUTXgiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=master)

This is the source code for https://stormacq.com

## Hugo Architecture

The site is built with [Hugo](https://gohugo.io) using a theme-agnostic architecture. All visual layout lives inside `themes/clean-blog/`, and the active theme is set by a single parameter in `hugo.toml`:

```toml
theme = "clean-blog"
```

Switching to a different stock Hugo theme requires only changing this value. Content files in `content/` use standard Hugo front matter (`title`, `date`, `description`, `tags`, `draft`, `images`) and contain no theme-specific logic, so they render correctly with any theme.

### Project-Level Template Overrides

Hugo's [template lookup order](https://gohugo.io/templates/lookup-order/) lets project-level files in `layouts/` take precedence over identically-named files in the theme. This project uses exactly two overrides to add site-specific functionality that no stock theme provides. Everything else comes from the theme.

#### `layouts/index.html`

**Overrides:** `themes/clean-blog/layouts/index.html`

**Why it exists:** The stock theme home page renders a masthead, the five most recent posts, and a "View All Posts" link. This override adds a [Bluesky](https://bsky.app) social feed widget (`bsky-embed` web component) in a sidebar column next to the post list. Since embedding a third-party social feed is site-specific and not something a generic theme would include, this override keeps that customization out of the theme.

**What it changes:** The theme template uses a single full-width column for the post list. The override splits the layout into a two-column grid — posts on the left (`col-lg-8`) and the Bluesky embed on the right (`col-lg-4`). All other home page functionality (masthead, post listing, pager) is identical to the theme version.

#### `layouts/partials/extend-scripts.html`

**Overrides:** `themes/clean-blog/layouts/partials/extend-scripts.html` (an empty partial)

**Why it exists:** The theme's `scripts.html` partial calls `{{ partial "extend-scripts.html" . }}` as an extension hook, shipping an empty default. This override fills that hook with three pieces of custom JavaScript that are specific to this site's content:

1. **Mermaid diagram rendering** — Imports the Mermaid JS module and converts Hugo-generated `<code class="language-mermaid">` blocks into rendered diagrams. Required because several blog posts use Mermaid syntax for architecture diagrams.

2. **YouTube URL-to-embed conversion** — The `yt_url2embed()` function scans for bare YouTube URLs in `<p>` tags and replaces them with responsive `<iframe>` embeds. This lets posts include YouTube videos by pasting a plain URL instead of writing HTML.

3. **Parallax scroll effect** — A jQuery scroll handler that translates and fades the masthead background image as the user scrolls, creating a parallax depth effect.

The override also includes a small `<style>` block for responsive video wrapper sizing.

**Why not inline these in the theme?** These scripts serve this site's specific content needs (Mermaid diagrams, YouTube embeds, parallax styling). A stock theme should not ship with them. By isolating them in the project-level `extend-scripts.html`, the theme stays portable and these customizations survive a theme switch — any Hugo theme that calls `{{ partial "extend-scripts.html" . }}` will pick them up automatically.

### Local Development

Hugo is never installed locally. All Hugo commands run inside a container using Apple's `container` CLI:

```bash
# Build the container image
container build -t hugo-site -f docker/Dockerfile .

# Start the dev server with live reload
./docker/run-container.sh
```

The dev server runs on `http://localhost:1313`.