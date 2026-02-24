# Implementation Plan: Jekyll to Hugo Migration

## Overview

Migrate the stormacq.com Jekyll site to Hugo incrementally: initialize the Hugo project and theme scaffold, migrate templates and partials, migrate content and assets, set up the Sass pipeline and RSS feed, update the build pipeline, clean up Jekyll artifacts, and validate URL parity. Each task builds on the previous, ensuring no orphaned code.

## Tasks

- [x] 1. Create migration branch and initialize Hugo project
  - [x] 1.1 Create the `hugo-migration` Git branch from current HEAD of main
    - Run `git checkout -b hugo-migration` from the main branch
    - All subsequent migration work happens on this branch
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Create `hugo.toml` configuration file
    - Translate all `_config.yml` metadata (title, author, email, description, baseURL, social usernames, Google Analytics ID) into `hugo.toml` under `[params]`
    - Configure `[permalinks]` with `posts = "/:year/:month/:day/:slug/"` to match Jekyll URL patterns
    - Configure `[pagination]` with `pagerSize = 5`
    - Configure `[outputFormats.RSS]` with `baseName = "feed"` to produce `/feed.xml`
    - Configure `[markup]` for Goldmark with `unsafe = true` and syntax highlighting
    - Set `theme = "clean-blog"` and `ignoreFiles` for build exclusions (buildspec.yaml, publish.sh, docker/, scripts/)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 16.1_

  - [x] 1.3 Write property test for configuration metadata completeness (Property 7)
    - **Property 7: Configuration Metadata Completeness**
    - Parse `_config.yml` and `hugo.toml`, verify every site metadata field from `_config.yml` has an equivalent in `hugo.toml`
    - **Validates: Requirements 2.1**

- [x] 2. Create theme scaffold and base template
  - [x] 2.1 Create the `themes/clean-blog/` directory structure and `theme.toml`
    - Create directories: `themes/clean-blog/layouts/_default/`, `themes/clean-blog/layouts/partials/`, `themes/clean-blog/layouts/posts/`, `themes/clean-blog/layouts/about/`
    - Create `themes/clean-blog/theme.toml` with theme metadata (name, description, license, etc.)
    - _Requirements: 16.1_

  - [x] 2.2 Create the base template `themes/clean-blog/layouts/_default/baseof.html`
    - Implement the Hugo equivalent of Jekyll's `_layouts/default.html`
    - Include `{{ partial "head.html" . }}`, navbar, `{{ block "main" . }}{{ end }}`, footer, and scripts partials
    - _Requirements: 3.1_

- [x] 3. Create theme partial templates
  - [x] 3.1 Create `themes/clean-blog/layouts/partials/head.html`
    - Convert Jekyll `_includes/head.html` to Hugo Go templates
    - Include charset, viewport, Open Graph tags (og:title, og:type, og:description, og:url, og:image, article:published_time, article:author, article:section, article:tag), title, meta description (truncated to 160 chars with site description fallback), font stylesheet, Bootstrap CSS, Font Awesome CSS, canonical URL, and RSS feed link
    - Compile SCSS via Hugo Pipes: `{{ $scss := resources.Get "scss/main.scss" }}` → `{{ $css := $scss | toCSS }}`
    - Replace all Liquid syntax: `{{ site.title }}` → `{{ .Site.Title }}`, `{{ page.title }}` → `{{ .Title }}`, `{{ page.date | date_to_xmlschema }}` → `{{ .Date.Format "2006-01-02T15:04:05Z07:00" }}`, etc.
    - _Requirements: 3.3, 3.8, 3.9, 3.10, 4.1, 4.2, 4.3_

  - [x] 3.2 Create `themes/clean-blog/layouts/partials/navbar.html`
    - Convert Jekyll `_includes/navbar.html` to Hugo Go templates
    - Preserve nav structure: AWS Console brand link, responsive hamburger, nav items (Home, About me, Posts, Le podcast AWS en 🇫🇷 as external link to `francais.podcast.go-aws.com`, My Old Blog)
    - Remove any internal podcast listing page links while preserving the external podcast link
    - _Requirements: 3.3, 5.1, 7.2_

  - [x] 3.3 Create `themes/clean-blog/layouts/partials/footer.html`
    - Convert Jekyll `_includes/footer.html` to Hugo Go templates
    - Implement conditional social media icon links using `{{ with .Site.Params.twitter_username }}` pattern for Twitter, Facebook, GitHub, LinkedIn
    - Include copyright line with dynamic year and privacy policy link
    - _Requirements: 3.3, 5.2_

  - [x] 3.4 Create `themes/clean-blog/layouts/partials/scripts.html`
    - Convert Jekyll `_includes/scripts.html` to Hugo Go templates
    - Include jQuery, Bootstrap bundle JS, Clean Blog JS, custom `scripts.js`
    - Include conditional jqBootstrapValidation for contact pages
    - Include conditional Google Analytics partial
    - _Requirements: 3.3, 5.3, 5.5_

  - [x] 3.5 Create `themes/clean-blog/layouts/partials/google_analytics.html`
    - Convert Jekyll `_includes/google_analytics.html` to Hugo Go templates
    - Render gtag.js snippet using `{{ .Site.Params.google_analytics }}` for tracking ID
    - _Requirements: 5.4_

  - [x] 3.6 Write property test for template Liquid-free correctness (Property 1)
    - **Property 1: Template Liquid-Free**
    - Scan all Hugo template files in `themes/clean-blog/layouts/` and `layouts/` for Liquid syntax (`{% %}`, `{{ site.* }}`, `{{ page.* }}`, Liquid filters)
    - **Validates: Requirements 3.3, 3.8, 3.9, 3.10**

  - [x] 3.7 Write property test for footer social links conditional rendering (Property 9)
    - **Property 9: Footer Social Links Conditional Rendering**
    - Generate config combinations with/without social usernames, verify footer renders exactly the corresponding icon links
    - **Validates: Requirements 5.2**

- [x] 4. Checkpoint - Ensure theme scaffold builds
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create theme page templates
  - [x] 5.1 Create home page template `themes/clean-blog/layouts/index.html`
    - Convert Jekyll `_layouts/home.html` to Hugo Go templates
    - Display masthead with background image and site title/description
    - List latest 5 posts using `{{ range (first 5 (where .Site.RegularPages "Section" "posts")) }}`
    - Include "View All Posts" link
    - _Requirements: 3.4_

  - [x] 5.2 Create project-level home page override `layouts/index.html`
    - Extend the theme home page template to add the Bluesky `bsky-embed` web component widget
    - This is the project-level override that adds custom functionality not in the theme
    - _Requirements: 3.4, 15.3, 16.2_

  - [x] 5.3 Create blog post single template `themes/clean-blog/layouts/posts/single.html`
    - Convert Jekyll `_layouts/post.html` to Hugo Go templates
    - Include masthead with background image, post title, date, content
    - Implement previous/next navigation using `{{ with .PrevInSection }}` and `{{ with .NextInSection }}`
    - _Requirements: 3.5_

  - [x] 5.4 Create default single page template `themes/clean-blog/layouts/_default/single.html`
    - Convert Jekyll `_layouts/page.html` to Hugo Go templates
    - Support background image and description via `.Params`
    - _Requirements: 3.6_

  - [x] 5.5 Create about page template `themes/clean-blog/layouts/about/single.html`
    - Convert Jekyll `_layouts/about.html` to Hugo Go templates
    - Include circular author image styling
    - _Requirements: 3.7_

  - [x] 5.6 Create posts list template `themes/clean-blog/layouts/_default/list.html`
    - Implement paginated posts list using `{{ $paginator := .Paginate .Pages }}`
    - Include "Older posts migrated from Wordpress" link on last page using `{{ if not $paginator.HasNext }}`
    - Include previous/next pager buttons
    - _Requirements: 8.4, 14.3_

  - [x] 5.7 Create error page templates `themes/clean-blog/layouts/403.html` and `themes/clean-blog/layouts/404.html`
    - Migrate Jekyll `403.html` and `404.html` preserving custom styling and kitten images
    - _Requirements: 8.5_

  - [x] 5.8 Create project-level `layouts/partials/extend-scripts.html`
    - Add Mermaid diagram JS module import and `code.language-mermaid` to Mermaid div conversion
    - Add YouTube URL-to-embed `yt_url2embed()` JavaScript function
    - Add parallax scroll effect jQuery handler
    - Add video wrapper CSS
    - This isolates custom JS from the theme for portability
    - _Requirements: 15.1, 15.2, 15.4, 16.2, 16.5_

  - [x] 5.9 Write property test for Open Graph tag correctness (Property 8)
    - **Property 8: Open Graph Tag Correctness**
    - Generate pages with various metadata combinations, verify OG tags render correctly and meta description is at most 160 characters
    - **Validates: Requirements 4.2, 4.3**

  - [x] 5.10 Write property test for Mermaid code block rendering (Property 11)
    - **Property 11: Mermaid Code Block Rendering**
    - For posts with mermaid code blocks, verify the output includes Mermaid JS module import and initialization
    - **Validates: Requirements 15.1**

- [x] 6. Checkpoint - Ensure templates render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Migrate Sass/CSS pipeline and static assets
  - [x] 7.1 Set up Hugo Pipes SCSS compilation
    - Move `assets/main.scss` to `assets/scss/main.scss`
    - Move `_sass/styles.scss` to `assets/scss/styles.scss`
    - Move `assets/vendor/startbootstrap-clean-blog/scss/` to `assets/scss/vendor/startbootstrap-clean-blog/scss/`
    - Adjust `@import` paths in SCSS files to be relative within `assets/scss/`
    - Verify the import chain: `main.scss` → `styles.scss` → `clean-blog.scss`
    - Preserve custom font stylesheet reference (`/fonts/webfontkit-20181018-085525/stylesheet.css`)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 7.2 Migrate static assets to `static/` directory
    - Move `img/` to `static/img/`
    - Move `fonts/` to `static/fonts/`
    - Move `assets/vendor/` (Bootstrap, jQuery, Font Awesome, Clean Blog JS — excluding SCSS already moved) to `static/assets/vendor/`
    - Move `assets/scripts.js` to `static/assets/scripts.js`
    - Move `favicon.ico` to `static/favicon.ico`
    - Move `emergency.txt` to `static/emergency.txt`
    - Preserve `scripts/` directory at repository root (Lambda@Edge, not part of build)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 8.6_

  - [x] 7.3 Write property test for static asset migration completeness (Property 5)
    - **Property 5: Static Asset Migration Completeness**
    - For each file in original `img/`, `fonts/`, `assets/vendor/` directories, verify a byte-identical copy exists in the corresponding `static/` subdirectory
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 8. Migrate blog post content
  - [x] 8.1 Move and convert all blog posts from `_posts/` to `content/posts/`
    - Move all Markdown files from `_posts/` to `content/posts/`
    - Adapt front matter: remove `layout: post`, convert `published: false` to `draft: true`, map `background` to both `images` (for OG) and `background` (for masthead)
    - Convert `{% highlight lang %}...{% endhighlight %}` blocks to fenced code blocks (`` ```lang ``)
    - Convert `{:target="_blank"}` Kramdown syntax to HTML `<a>` tags or `{target="_blank"}`
    - Preserve all other front matter fields (title, subtitle, description, date, tags, author)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 15.5_

  - [x] 8.2 Write property test for content Jekyll-syntax-free (Property 2)
    - **Property 2: Content Jekyll-Syntax-Free**
    - Scan all content files in `content/` for Jekyll-specific syntax (`{% highlight %}`, `{:target="_blank"}`, Liquid tags)
    - **Validates: Requirements 6.3, 6.4, 15.5**

  - [x] 8.3 Write property test for blog post migration completeness (Property 6)
    - **Property 6: Blog Post Migration Completeness**
    - For each file in `_posts/`, verify a corresponding file exists in `content/posts/` with all front matter fields preserved (with mappings applied) and Markdown content preserved
    - **Validates: Requirements 6.1, 6.2**

  - [x] 8.4 Write property test for content theme-agnosticism (Property 12)
    - **Property 12: Content Theme-Agnosticism**
    - For each content file in `content/`, verify only standard Hugo front matter fields plus generic custom params, no shortcode references or theme-specific logic in body
    - **Validates: Requirements 16.3, 16.6**

- [x] 9. Migrate standalone pages
  - [x] 9.1 Migrate home page, about, privacy, and posts list pages
    - Migrate `index.md` → `content/_index.md` (remove `layout: home`, set appropriate front matter)
    - Migrate `about.md` → `content/about/index.md` (branch bundle preserves `/about/` URL)
    - Migrate `privacy.md` → `content/privacy.md` (add `url: /privacy.html` in front matter to preserve URL)
    - Create `content/posts/_index.md` with front matter enabling pagination
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 10. Checkpoint - Ensure content renders and URLs match
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Set up RSS feed and validate URL parity
  - [x] 11.1 Create custom RSS template
    - Create `themes/clean-blog/layouts/_default/rss.xml` based on Hugo's embedded RSS template
    - Modify to include `.Content` (full content) instead of `.Summary`
    - Set channel title and description from site configuration
    - Verify feed is generated at `/feed.xml` via the `[outputFormats.RSS]` config
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 11.2 Write property test for RSS feed content completeness (Property 10)
    - **Property 10: RSS Feed Content Completeness**
    - For each published blog post, verify the RSS feed entry contains title, description, date, author, and full content
    - **Validates: Requirements 11.2**

  - [x] 11.3 Write property test for blog post URL pattern preservation (Property 3)
    - **Property 3: Blog Post URL Pattern Preservation**
    - For each blog post, verify Hugo generates the URL matching `/:year/:month/:day/:slug/`
    - **Validates: Requirements 2.2, 6.6**

  - [x] 11.4 Write property test for URL parity across all content (Property 4)
    - **Property 4: URL Parity Across All Content**
    - For each page/post in the Jekyll source, verify the Hugo output produces a file at the same URL path
    - **Validates: Requirements 2.5, 14.1**

  - [x] 11.5 Write property test for draft and future post visibility (Property 13)
    - **Property 13: Draft and Future Post Visibility**
    - Verify posts with `draft: true` or future dates do not appear in default build output, only with `--buildDrafts`/`--buildFuture`
    - **Validates: Requirements 6.5**

- [x] 12. Delete podcast content and clean up podcast references
  - [x] 12.1 Delete `_podcasts/` directory and remove podcast-specific templates
    - Delete the entire `_podcasts/` directory and all its contents
    - Delete `_layouts/podcast.html` without creating a Hugo equivalent
    - Verify the navbar partial preserves the "Le podcast AWS en 🇫🇷" external link but has no internal podcast listing links
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 13. Update build pipeline
  - [x] 13.1 Update `buildspec.yaml` for Hugo
    - Replace Ruby/Jekyll install with Hugo extended binary download and install
    - Replace `bundle exec jekyll build` with `hugo --minify`
    - Update artifacts `base-directory` from `_site` to `public`
    - Add `resources/**/*` to cache paths
    - _Requirements: 12.1, 12.2_

  - [x] 13.2 Update Docker development environment
    - Update `docker/Dockerfile` to use `hugomods/hugo:exts` base image with `hugo server` command
    - Update `docker/run-container.sh` to use Apple's `container` CLI (not Docker) to mount project and run Hugo server on port 1313
    - All Hugo commands must be executed inside the container, never on the local machine
    - _Requirements: 12.3, 12.4, 12.6, 12.7, 12.8_

  - [x] 13.3 Update `publish.sh`
    - Change S3 sync source from `_site` to `public`
    - _Requirements: 12.5_

- [x] 14. Jekyll artifact cleanup and .gitignore update
  - [x] 14.1 Remove all Jekyll-specific files and directories
    - Delete `Gemfile` and `Gemfile.lock`
    - Delete `_config.yml`
    - Delete `_site/` directory and `.jekyll-cache/` directory
    - Delete `_layouts/`, `_includes/`, `_posts/`, `_sass/` directories (content already migrated)
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 14.2 Update `.gitignore` for Hugo
    - Replace Jekyll entries (`_site`, `.sass-cache`, `.jekyll-metadata`) with Hugo entries (`public/`, `resources/`, `.hugo_build.lock`)
    - _Requirements: 13.5_

- [x] 15. Theme portability documentation and final validation
  - [x] 15.1 Create README documentation for project-level template overrides
    - Document each override in `layouts/` (index.html, partials/extend-scripts.html) explaining why it exists and what stock theme functionality it supplements
    - _Requirements: 16.8_

  - [x] 15.2 Write property test for content theme-agnosticism validation (Property 12)
    - **Property 12: Content Theme-Agnosticism** (final validation across all content)
    - Verify all content files use only standard Hugo front matter and contain no theme-specific logic
    - **Validates: Requirements 16.3, 16.6, 16.7**

- [x] 16. Final checkpoint - Full build validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after major milestones
- Property tests use fast-check (JavaScript) as specified in the design document
- The migration branch provides a clean rollback path — main branch stays untouched
- Lambda@Edge scripts remain unchanged since URL structure is preserved
