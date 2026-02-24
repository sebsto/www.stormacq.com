# Requirements Document

## Introduction

This document specifies the requirements for migrating an existing Jekyll static website to Hugo. The site is a personal developer blog hosted at stormacq.com, built with the Jekyll Clean Blog theme, Bootstrap, jQuery, and custom Sass. It features blog posts, pagination, Open Graph metadata, Google Analytics, Mermaid diagrams, embedded YouTube videos, and a Bluesky social feed. The podcast collection (`_podcasts/`) has already been migrated elsewhere and must be deleted as part of cleanup. The site is built via AWS CodeBuild and deployed to S3. The migration must preserve all existing blog content, URL structures, functionality, and visual appearance while converting all Jekyll-specific constructs (Liquid templates, `_config.yml`, Gemfile, Sass pipeline, front matter conventions) to their Hugo equivalents. A dedicated Git branch must be created before any changes are made.

## Glossary

- **Migration_Tool**: The Hugo static site generator (https://gohugo.io) that replaces Jekyll as the build engine
- **Source_Site**: The existing Jekyll-based website in the current repository
- **Hugo_Site**: The resulting Hugo-based website after migration
- **Config_Converter**: The process that translates `_config.yml` settings into Hugo's `hugo.toml` (or `hugo.yaml`) configuration
- **Template_Converter**: The process that converts Liquid templates (layouts and includes) into Hugo's Go template equivalents
- **Content_Migrator**: The process that moves and adapts Markdown content files (posts, standalone pages) to Hugo's content organization
- **Front_Matter**: The YAML metadata block at the top of each Markdown content file
- **Sass_Pipeline**: The CSS preprocessing chain that compiles SCSS files into the final CSS served to browsers
- **Build_Pipeline**: The CI/CD process using AWS CodeBuild (`buildspec.yaml`) and the Docker-based local development workflow
- **Lambda_Edge_Scripts**: CloudFront Lambda@Edge functions that handle URL redirects and rewrites for the site
- **Vendor_Assets**: Third-party JavaScript and CSS libraries bundled in `assets/vendor/` (Bootstrap, jQuery, Font Awesome, Clean Blog theme JS)
- **Branch_Manager**: The Git version control process for creating and managing the migration branch
- **Apple_Container_CLI**: Apple's native container runtime (`container` command) used for local development instead of Docker

## Requirements

### Requirement 1: Create a Migration Branch

**User Story:** As a developer, I want to create a dedicated Git branch for the Hugo migration, so that the existing Jekyll site on the main branch remains untouched until the migration is validated.

#### Acceptance Criteria

1. WHEN the migration begins, THE Branch_Manager SHALL create a new Git branch named `hugo-migration` from the current HEAD of the main branch
2. THE Branch_Manager SHALL perform all migration changes exclusively on the `hugo-migration` branch
3. THE Branch_Manager SHALL preserve the main branch in its current state with no modifications

### Requirement 2: Hugo Project Initialization and Configuration

**User Story:** As a developer, I want the Jekyll configuration translated into a valid Hugo configuration, so that all site metadata, URLs, and build settings are preserved.

#### Acceptance Criteria

1. THE Config_Converter SHALL create a `hugo.toml` configuration file containing all site metadata from `_config.yml` (title, author, email, description, baseURL, social usernames, Google Analytics ID)
2. THE Config_Converter SHALL configure Hugo's permalink structure to match the existing Jekyll URL patterns for blog posts (e.g., `/:year/:month/:day/:slug/`)
3. THE Config_Converter SHALL configure Hugo's pagination to display 5 items per page, matching the existing Jekyll pagination setting
4. THE Config_Converter SHALL configure Hugo's build exclusions to match the existing Jekyll `exclude` list (Gemfile, Gemfile.lock, docker, amplify, buildspec.yaml, publish.sh, vendor)
5. WHEN the Hugo configuration is complete, THE Hugo_Site SHALL produce the same site structure and URLs as the Source_Site for all blog content and standalone pages

### Requirement 3: Layout and Template Migration

**User Story:** As a developer, I want all Jekyll Liquid layouts converted to Hugo Go templates, so that every page type renders with the same HTML structure and visual appearance.

#### Acceptance Criteria

1. THE Template_Converter SHALL create a Hugo base template (`layouts/_default/baseof.html`) equivalent to the Jekyll `default.html` layout, including the head, navbar, content block, footer, and scripts partials
2. THE Template_Converter SHALL create Hugo partial templates in `layouts/partials/` for each Jekyll include: `head.html`, `navbar.html`, `footer.html`, `scripts.html`, and `google_analytics.html`
3. THE Template_Converter SHALL convert all Liquid template tags (`{% include %}`, `{% for %}`, `{% if %}`, `{{ variable }}`) to their Hugo Go template equivalents (`{{ partial }}`, `{{ range }}`, `{{ if }}`, `{{ .Variable }}`)
4. THE Template_Converter SHALL create a Hugo home page template (`layouts/index.html`) that replicates the Jekyll `home.html` layout, including the post list limited to 5 items, the Bluesky embed widget, and the "View All Posts" link
5. THE Template_Converter SHALL create a Hugo single post template (`layouts/posts/single.html`) that replicates the Jekyll `post.html` layout, including previous/next navigation, date formatting, and background image support
6. THE Template_Converter SHALL create a Hugo single page template (`layouts/_default/single.html`) that replicates the Jekyll `page.html` layout with background image and description support
7. THE Template_Converter SHALL create a Hugo about page template that replicates the Jekyll `about.html` layout, including the circular author image styling
8. THE Template_Converter SHALL convert all Jekyll Liquid filters (`prepend`, `replace`, `relative_url`, `absolute_url`, `date`, `strip_html`, `truncatewords`, `xml_escape`, `date_to_xmlschema`, `normalize_whitespace`, `escape`) to equivalent Hugo template functions (`relURL`, `absURL`, `dateFormat`, `plainify`, `truncate`, etc.)
9. WHEN a layout references `site.*` variables, THE Template_Converter SHALL replace them with Hugo's `.Site.Params.*` or `.Site.*` equivalents
10. WHEN a layout references `page.*` variables, THE Template_Converter SHALL replace them with Hugo's `.Params.*` or page-level variables (`.Title`, `.Date`, `.Content`)

### Requirement 4: Partial Templates - Head and SEO

**User Story:** As a developer, I want the HTML head section and Open Graph metadata preserved, so that social sharing and SEO continue to work correctly after migration.

#### Acceptance Criteria

1. THE Template_Converter SHALL create a `head.html` partial that generates the same `<head>` content as the Jekyll `_includes/head.html`, including charset, viewport, Open Graph tags, title, meta description, font stylesheet, Bootstrap CSS, Font Awesome CSS, main CSS, canonical URL, and RSS feed link
2. THE Template_Converter SHALL preserve all Open Graph meta tag logic, including conditional rendering for `og:title`, `og:type`, `og:description`, `og:url`, `og:image`, `article:published_time`, `article:author`, `article:section`, and `article:tag`
3. THE Template_Converter SHALL preserve the meta description tag using page excerpt or site description as fallback, truncated to 160 characters

### Requirement 5: Partial Templates - Navigation, Footer, and Scripts

**User Story:** As a developer, I want the navigation bar, footer, and JavaScript includes preserved, so that site navigation and interactive features work identically after migration.

#### Acceptance Criteria

1. THE Template_Converter SHALL create a `navbar.html` partial with the same navigation structure: AWS Console brand link, responsive hamburger menu, and nav items (Home, About me, Posts, Le podcast AWS en French, My Old Blog) with correct URLs, preserving the "Le podcast AWS en French" link as an external link pointing to the separate podcast site
2. THE Template_Converter SHALL create a `footer.html` partial with conditional social media icon links (Twitter, Facebook, GitHub, LinkedIn) driven by site configuration, and the copyright line with dynamic year and privacy policy link
3. THE Template_Converter SHALL create a `scripts.html` partial that includes jQuery, Bootstrap bundle JS, Clean Blog JS, the custom `assets/scripts.js`, the video wrapper CSS and YouTube URL-to-embed JavaScript, the parallax scroll effect, the Mermaid diagram rendering module, and the conditional Google Analytics include
4. THE Template_Converter SHALL create a `google_analytics.html` partial that renders the Google Analytics gtag.js snippet using the configured tracking ID
5. WHEN the current page URL contains "contact", THE Template_Converter SHALL include the jqBootstrapValidation script and form submission handler in the scripts partial

### Requirement 6: Blog Post Content Migration

**User Story:** As a developer, I want all blog posts migrated to Hugo's content structure with preserved front matter and URLs, so that existing links and content remain accessible.

#### Acceptance Criteria

1. THE Content_Migrator SHALL move all Markdown files from `_posts/` to `content/posts/`, converting Jekyll's filename convention (`YYYY-MM-DD-slug.markdown`) to Hugo-compatible files
2. THE Content_Migrator SHALL preserve all front matter fields (layout, title, subtitle, description, date, tags, author, background, published) in each post, adapting the `layout` field to Hugo's equivalent or removing it if Hugo's lookup order handles it
3. THE Content_Migrator SHALL convert Jekyll-specific Liquid tags within post content to Hugo equivalents, including `{% highlight lang %}...{% endhighlight %}` to Hugo's code fence or `{{< highlight >}}` shortcode
4. THE Content_Migrator SHALL convert Jekyll's `{:target="_blank"}` Kramdown attribute syntax to standard HTML or a Hugo-compatible equivalent
5. WHEN a post has `published: false` or a future date, THE Hugo_Site SHALL handle the post visibility consistently with Jekyll's behavior (not published by default, visible with `--buildDrafts` or `--buildFuture` flags)
6. THE Hugo_Site SHALL generate blog post URLs matching the existing pattern (e.g., `/2026/02/20/xcode-openrouter-bedrock/`) to preserve all inbound links

### Requirement 7: Podcast Content Deletion

**User Story:** As a developer, I want the podcast collection removed from the repository, so that already-migrated podcast content does not clutter the Hugo site or cause confusion.

#### Acceptance Criteria

1. THE Content_Migrator SHALL delete the `_podcasts/` directory and all its contents from the repository
2. THE Content_Migrator SHALL remove any internal podcast listing page links from the navbar partial, while preserving the "Le podcast AWS en French" external link that points to the separate podcast site
3. THE Content_Migrator SHALL remove any podcast-specific templates (`_layouts/podcast.html`) without creating Hugo equivalents

### Requirement 8: Standalone Pages Migration

**User Story:** As a developer, I want all standalone pages (index, about, privacy, posts list, 403, 404) migrated to Hugo, so that every page on the site continues to work.

#### Acceptance Criteria

1. THE Content_Migrator SHALL migrate the home page (`index.md`) to Hugo's `content/_index.md` with appropriate front matter for the home layout and background image
2. THE Content_Migrator SHALL migrate the about page (`about.md`) to `content/about/index.md` preserving the `/about/` permalink, background image, and description
3. THE Content_Migrator SHALL migrate the privacy page (`privacy.md`) to `content/privacy.md` preserving its content and layout assignment
4. THE Content_Migrator SHALL create a posts list page (`content/posts/_index.md`) with pagination enabled, replicating the functionality of the current `posts/index.html` including the paginator, "Older posts migrated from Wordpress" link on the last page, and previous/next pager buttons
5. THE Content_Migrator SHALL migrate the 403 and 404 error pages to Hugo's error page convention (`layouts/403.html` and `layouts/404.html`) preserving the custom styling and kitten images
6. THE Content_Migrator SHALL migrate the `emergency.txt` file to Hugo's `static/` directory so it is copied as-is to the output

### Requirement 9: Sass and CSS Pipeline Migration

**User Story:** As a developer, I want the Sass/CSS build pipeline migrated to Hugo Pipes, so that stylesheets compile correctly and the site looks identical.

#### Acceptance Criteria

1. THE Sass_Pipeline SHALL configure Hugo to compile the existing SCSS files using Hugo Pipes or an equivalent Hugo-native approach
2. THE Sass_Pipeline SHALL preserve the import chain: `assets/main.scss` imports `_sass/styles.scss`, which imports the Clean Blog theme SCSS from `assets/vendor/startbootstrap-clean-blog/scss/clean-blog.scss`
3. THE Sass_Pipeline SHALL place SCSS source files in Hugo's `assets/` directory so they are accessible to Hugo Pipes
4. THE Sass_Pipeline SHALL produce a compiled CSS output that is functionally identical to the current Jekyll-generated CSS
5. THE Sass_Pipeline SHALL preserve the custom font stylesheet reference (`/fonts/webfontkit-20181018-085525/stylesheet.css`)

### Requirement 10: Static Assets Migration

**User Story:** As a developer, I want all static assets (images, fonts, vendor JS/CSS, scripts) available in the Hugo site, so that no resources are missing.

#### Acceptance Criteria

1. THE Content_Migrator SHALL move the `img/` directory to Hugo's `static/img/` directory, preserving all images and subdirectories
2. THE Content_Migrator SHALL move the `fonts/` directory to Hugo's `static/fonts/` directory
3. THE Content_Migrator SHALL move the `assets/vendor/` directory (Bootstrap, jQuery, Font Awesome, Clean Blog JS) to Hugo's `static/assets/vendor/` directory so that existing script and stylesheet references remain valid
4. THE Content_Migrator SHALL move `assets/scripts.js` to Hugo's `static/assets/scripts.js`
5. THE Content_Migrator SHALL move `favicon.ico` to Hugo's `static/favicon.ico`
6. THE Content_Migrator SHALL preserve the `scripts/` directory containing Lambda@Edge scripts in the repository root (these are not part of the site build but are infrastructure reference files)

### Requirement 11: RSS Feed Generation

**User Story:** As a developer, I want Hugo to generate an RSS feed, so that existing feed subscribers continue to receive updates.

#### Acceptance Criteria

1. THE Hugo_Site SHALL generate an RSS feed at `/feed.xml` matching the existing Jekyll RSS feed URL
2. THE Hugo_Site SHALL include blog post titles, descriptions, dates, authors, and full content in the RSS feed entries
3. THE Hugo_Site SHALL set the RSS feed's channel title and description from the site configuration

### Requirement 12: Build Pipeline Migration

**User Story:** As a developer, I want the build and deployment pipeline updated for Hugo, so that the site can be built and deployed using the existing CI/CD infrastructure.

#### Acceptance Criteria

1. THE Build_Pipeline SHALL update `buildspec.yaml` to install Hugo instead of Ruby/Jekyll, and run `hugo` instead of `bundle exec jekyll build`
2. THE Build_Pipeline SHALL update the artifacts base-directory from `_site` to Hugo's default output directory (`public`)
3. THE Build_Pipeline SHALL update the Docker development environment (`docker/Dockerfile` and `docker/run-container.sh`) to use a Hugo-based container image instead of the Ruby/Jekyll image
4. THE Build_Pipeline SHALL support local development with live reload using `hugo server` with watch mode
5. THE Build_Pipeline SHALL update `publish.sh` to reference Hugo's output directory (`public`) instead of `_site` for S3 sync
6. THE Build_Pipeline SHALL use Apple's `container` CLI (not Docker) for all local container operations
7. THE Build_Pipeline SHALL NOT require Hugo to be installed on the local machine; all Hugo commands SHALL be executed inside the container
8. THE Build_Pipeline SHALL use the `hugomods/hugo:exts` container image for Hugo Extended with Dart Sass support

### Requirement 13: Jekyll Artifact Cleanup

**User Story:** As a developer, I want all Jekyll-specific files removed after migration, so that the repository is clean and contains only Hugo-relevant files.

#### Acceptance Criteria

1. WHEN the Hugo migration is validated, THE Content_Migrator SHALL remove the `Gemfile` and `Gemfile.lock` files
2. WHEN the Hugo migration is validated, THE Content_Migrator SHALL remove the `_config.yml` file
3. WHEN the Hugo migration is validated, THE Content_Migrator SHALL remove the `_site/` directory and `.jekyll-cache/` directory
4. WHEN the Hugo migration is validated, THE Content_Migrator SHALL remove the `_layouts/`, `_includes/`, `_posts/`, and `_sass/` directories (after content has been migrated to Hugo locations)
5. WHEN the Hugo migration is validated, THE Content_Migrator SHALL update `.gitignore` to replace Jekyll-specific entries (`_site`, `.sass-cache`, `.jekyll-metadata`) with Hugo-specific entries (`public/`, `resources/`, `.hugo_build.lock`)

### Requirement 14: URL Compatibility and Redirects

**User Story:** As a developer, I want all existing URLs to continue working after migration, so that search engine rankings and external links are preserved.

#### Acceptance Criteria

1. THE Hugo_Site SHALL generate output files at the same URL paths as the Source_Site for all blog posts, standalone pages, and static assets
2. WHEN the Hugo_Site cannot produce an identical URL for a piece of content, THE Config_Converter SHALL configure Hugo aliases or redirect rules to map the old URL to the new URL
3. THE Hugo_Site SHALL preserve the paginated posts list URLs (`/posts/`, `/posts/2/`, `/posts/3/`, etc.)
4. THE Lambda_Edge_Scripts SHALL remain functional without modification, as the URL structure of the Hugo_Site matches the Source_Site

### Requirement 15: Content Feature Parity

**User Story:** As a developer, I want all interactive and dynamic content features preserved, so that the user experience is identical after migration.

#### Acceptance Criteria

1. THE Hugo_Site SHALL render Mermaid diagrams in blog posts by including the Mermaid JS module and converting `language-mermaid` code blocks to Mermaid divs, matching the existing behavior
2. THE Hugo_Site SHALL convert YouTube URLs in paragraph tags to embedded iframes using the existing JavaScript function
3. THE Hugo_Site SHALL display the Bluesky social feed embed on the home page using the `bsky-embed` web component
4. THE Hugo_Site SHALL render the parallax scroll effect on masthead background images using the existing jQuery scroll handler
5. THE Hugo_Site SHALL support the `{% highlight lang %}` code blocks by converting them to Hugo-compatible syntax highlighting (fenced code blocks or `{{< highlight >}}` shortcodes)

### Requirement 16: Theme Portability and Theme-Agnostic Architecture

**User Story:** As a developer, I want the Hugo site to use a theme-agnostic architecture with minimal customizations, so that I can switch to any stock Hugo theme by changing a single configuration parameter.

#### Acceptance Criteria

1. THE Hugo_Site SHALL use Hugo's standard theme mechanism via the `theme` configuration parameter in `hugo.toml` rather than embedding layout files directly into the project's `layouts/` directory
2. THE Hugo_Site SHALL limit custom template overrides in the project-level `layouts/` directory to only those templates that are strictly necessary for functionality not provided by a stock theme (e.g., the Bluesky embed widget, Mermaid diagram initialization, YouTube URL-to-embed conversion)
3. THE Hugo_Site SHALL use standard Hugo front matter fields (`title`, `date`, `description`, `tags`, `draft`, `images`) in all content files so that stock themes can render content without modification
4. THE Hugo_Site SHALL organize content using Hugo's standard directory conventions (`content/posts/`, `content/about/`) so that stock themes' section templates apply automatically via Hugo's template lookup order
5. THE Hugo_Site SHALL isolate custom JavaScript and CSS as standalone files in `static/` or `assets/` rather than inlining them into template files, so that switching themes does not require re-adding custom scripts or styles
6. THE Hugo_Site SHALL keep content files free of theme-specific template logic, shortcodes, or partial references that would break when a different theme is applied
7. WHEN a developer changes the `theme` parameter in `hugo.toml` to a different stock Hugo theme, THE Hugo_Site SHALL render all content pages and blog posts using the new theme's templates without requiring content file modifications
8. THE Hugo_Site SHALL document all project-level template overrides in a README or comment block explaining why each override exists and what stock theme functionality it supplements
