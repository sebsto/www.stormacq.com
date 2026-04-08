---
title: "A Custom Kiro Agent to Post on Social Media"
subtitle: "How I built a Kiro CLI agent that posts messages and images to Mastodon, LinkedIn, Bluesky, and X with a single command."
date: 2026-04-08 04:00:00 +0100
tags: [kiro, ai, social-media]
author: Seb
background: /img/posts/20260408/kiro-social-media-agent.png
images: ['/img/posts/20260408/kiro-social-media-agent.png']
---

Every time I publish a blog post, I share it on social media. Mastodon, LinkedIn, Bluesky, X. Four platforms, four different APIs, four different character limits, four different image upload procedures. It's tedious. Not hard, just repetitive enough to be annoying.

So I built a [Kiro CLI](https://kiro.dev/docs/cli/) custom agent that does it for me. I give it a message and optionally an image, it adapts the text to each platform's constraints, shows me a preview, and posts everywhere once I confirm. The whole thing took about thirty minutes to set up.

### Step 1: The steering document

The agent needs credentials and instructions for each platform. I wrote a single Markdown file, a reference document, that contains everything: API endpoints, authentication tokens, curl samples, character limits, image upload procedures, and posting guidelines.

Each platform has its own section. Mastodon uses a simple Bearer token. LinkedIn uses OAuth2 with tokens that expire every two months. Bluesky needs a fresh session before each post. X requires OAuth 1.0a signature generation. The document captures all of this, so the agent knows exactly what to do for each platform without me having to explain it every time.

I published a [template version of this document on GitHub](https://gist.github.com/sebsto/e16707e33139fcd3f53e77b6187aad89) with placeholder credentials. If you want to build the same thing, grab it and fill in your own tokens.

The document also includes guidelines for the agent: always confirm before posting, check LinkedIn token expiry, create a fresh Bluesky session, handle X credit depletion gracefully, and respect character limits.

### Step 2: The agent configuration

Kiro CLI lets you create [custom agents](https://kiro.dev/docs/cli/custom-agents/creating/), JSON files that define a name, a system prompt, and which tools the agent can use. I created mine with this configuration:

```json
{
  "name": "Social Media",
  "description": "Post messages with optional images to Mastodon, LinkedIn, Bluesky, and X. Reads credentials and instructions from the Social Agents reference document.",
  "prompt": "You are a social media posting agent for <YOUR_NAME>.\n\nBefore doing anything, read the reference document at:\n<PATH_TO_YOUR_REFERENCE_DOCUMENT>/Social Agents.md\n\nThis document contains all credentials, API endpoints, curl samples, and posting guidelines for each platform (Mastodon, LinkedIn, Bluesky, X).\n\nYour workflow:\n1. Read the reference document to get current credentials and instructions\n2. Accept a message text and optionally an image path from the user\n3. Adapt the message to each platform's character limit (500 Mastodon, ~3000 LinkedIn, 300 Bluesky, 280 X)\n4. Show the user what will be posted on each platform and ask for confirmation\n5. Post to the confirmed platforms using the curl commands from the reference document\n6. If an image is provided, follow the image upload procedure documented for each platform (upload first, then post with media reference)\n7. Report success or failure for each platform\n\nRules:\n- Never post without explicit user confirmation\n- Always check LinkedIn token expiry date before posting. If expired, guide the user through the refresh procedure in the document\n- Always create a fresh Bluesky session before posting\n- If X returns CreditsDepleted, inform the user and skip X\n- Respect character limits: truncate or ask the user to shorten if needed\n- Include alt text for images (ask the user if not provided)\n- For test posts, use restricted visibility as documented",
  "tools": ["read", "write", "shell", "grep", "glob"],
  "allowedTools": ["*"]
}
```

The key design choice: the agent's prompt tells it to read the reference document first, before doing anything. This means the credentials and instructions live outside the agent config. I can update tokens or add a new platform without touching the agent itself.

The agent has access to `shell` (to run curl commands), `read` (to read the reference document and image files), and `glob`/`grep` for file discovery. That's all it needs.

### Step 3: Using it

I start the agent from the terminal:

```bash
kiro-cli --agent "Social Media"
```

Then I give it a URL and some direction:

```
[Social Media] > I just published a new blog post about S3 Files, 
a new way to access S3 buckets as file systems. 
Here is the URL: https://aws.amazon.com/blogs/aws/launching-s3-files-making-s3-buckets-accessible-as-file-systems/
Post about it with this image: ~/Desktop/screenshot.png
```

I don't write the social media messages myself. The agent reads the URL, understands the content, and crafts a message for each platform's character limit and tone. LinkedIn gets a longer, more professional version. Bluesky and X get a punchy short version. Mastodon sits somewhere in between. It shows me a preview of all four messages. I review, tweak if needed, confirm, and it posts everywhere in sequence, reporting success or failure for each one.

![The Social Media agent in action](/img/posts/20260408/kiro-social-media-agent.png)

The screenshot shows what happens when you first ask the agent to post. It reads the reference document, explains the workflow, checks token status, and waits for your message. If a message is too long for X's 280-character limit, it asks me to shorten it or suggests a trimmed version.

### The pattern

The reference document is the single source of truth. When a LinkedIn token expires, I update one file. When X changes its API, I update one file. The agent always reads the latest version before posting.

This is also a good example of what I described in my [lessons learned post](https://stormacq.com/2026/03/31/ai-dlc-lessons-learned/): you don't always need MCP servers. A well-structured document and a few curl commands are enough. The agent reads the doc, understands the APIs, and executes the commands. No middleware, no server to maintain.

If you want to build your own, grab the [reference document template](https://gist.github.com/sebsto/e16707e33139fcd3f53e77b6187aad89), fill in your credentials, create the agent config, and you're done.

Happy posting.
