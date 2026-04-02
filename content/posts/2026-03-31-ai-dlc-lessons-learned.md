---
title: "What I Learned Building Real Projects with AI Coding Agents"
subtitle: "Ten practical lessons from shipping production code with AI agents — from brainstorming to deployment, and everything that went wrong in between."
date: 2026-03-31 13:00:00 +0100
tags: [ai, kiro, ai-sdlc]
author: Seb
background: /img/posts/20260331/banner.png
images: ['/img/posts/20260331/banner.png']
---

I gave a talk at an AI DLC conference in Geneva this week. The topic: what I actually learned building real projects with AI coding agents over the past few months. Not theory, not "10 tips for better prompts." Practical lessons from shipping production code — a [macOS voice dictation app](https://stormacq.com/2026/03/04/wispr/), a [historical blog post](https://stormacq.com/2026/03/14/kiro-knowledge-base/), an [Xcode-to-Bedrock proxy](https://stormacq.com/2026/02/20/xcode-openrouter-bedrock/), and a few others.

The talk covered the full development lifecycle, from the first brainstorming session to the final code review. Here's a written version of what I shared, expanded with details that didn't fit in 30 minutes on stage.

### Brainstorm first, code second

Most people open their IDE and start prompting: "build me a REST API that does X." That's skipping the most valuable part.

The first thing I do on any project is use the agent as a thinking partner. Not for code. For ideas. I describe what I want to build, and I ask the agent to challenge my assumptions. "What are the tradeoffs of this approach?" "What am I missing?" "What would you do differently?"

This back-and-forth surfaces blind spots you didn't know you had. On the Wispr project, the agent pushed back on my initial plan to use [Grand Central Disptach](https://developer.apple.com/documentation/dispatch) for audio capture and suggested actor-based isolation instead. That single conversation saved me from a concurrency mess that would have taken days to untangle later.

The key is to resist the urge to write code immediately. Spend twenty minutes or more thinking with the agent. Then save a summary of the discussion. You'll thank yourself later.

### Spec everything

This is the single biggest lesson. Don't just prompt the agent. Write specs.

For large projects, I use a structured DLC methodology, such as [SpecKit](https://speckit.org/), [BMad](https://github.com/bmad-code-org/BMAD-METHOD), or [AI-DLC](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/). For smaller features or bug fixes, a lightweight spec is enough. But there's always a written document before the agent starts coding. A spec forces you to think clearly about what you want, and it gives the agent guardrails to work within.

The format doesn't need to be fancy. Requirements, acceptance criteria, a rough design. The point is to have a contract. When bugs appear later, you can trace them back to a specific requirement that wasn't met. When the agent drifts, you can point it back to the spec.

One spec per feature. One feature per branch. One branch per pull request. This keeps things clean and reviewable. I've tried the "one giant spec" approach. It doesn't work. The agent loses focus, the scope creeps, and you end up with a mess that's hard to review.

### Pick the right tool for the job

Not all tasks need the same model. I use lighter models (Sonnet) for planning, iteration, and quick tasks. When I need heavy lifting — complex refactors, large codebases, multi-file changes — I switch to Opus.

Think of it like choosing tools from a toolbox. You don't use a sledgehammer for a nail. A fast model keeps you in flow for iterative work. A powerful model handles the hard stuff without cutting corners.

The same logic applies to specialized skills. When I'm doing Swift work, I load the Swift concurrency skill. When I'm doing web design, I load the web design skill. The quality difference is dramatic. It's like hiring a specialist versus asking a generalist to wing it.

### Feedback loops are everything

The agent is only as good as the feedback it gets. Without feedback, it's flying blind.

During a session, I keep two feedback channels open at all times. The compiler catches syntax errors immediately. Tests catch behavioral issues. When the agent sees a test failure, it can reason about the fix. When it sees a compiler error, it self-corrects. This tight loop — code, compile, test, fix — is the single most impactful practice I've adopted.

Between sessions, there's a different kind of feedback. When the agent makes the same mistake twice — wrong import style, wrong naming convention, wrong test framework — I don't just fix it. I ask the agent to write it down in my steering docs. Next session, the agent won't make that mistake again. Your steering docs are your institutional memory. They're a living document. Update them after every session.

### Manage your context

Context windows are finite. As projects grow, you can't dump your entire codebase into one prompt and hope for the best.

I use three techniques to manage context at scale. Subagents handle isolated tasks without polluting the main agent's context. The CLI lets me run multiple agents in parallel on different parts of the project. And git worktrees let me have multiple branches checked out simultaneously — one agent per worktree, working in parallel on different features.

This is how you go from "one feature at a time" to "three features in parallel." It takes some discipline to set up, but the productivity gain is real.

### Trust but verify

All code deserves review. It doesn't matter who or what wrote it.

I review every piece of AI-generated code the same way I'd review a colleague's pull request. I look for security issues, edge cases, unnecessary complexity, and deprecated APIs. Sometimes I use a second agent to review the first agent's output. The code review / re-alignment cycle is where you catch the subtle bugs that tests miss.

The agent is fast, but it's not infallible. Treat its output as a first draft from a talented but occasionally overconfident developer.

### MCP is not always the answer

There's a reflex to reach for MCP servers for everything. But each MCP server adds tool descriptions to the context window, and when the agent has thirty tools to choose from, it gets confused and picks the wrong one.

In practice, I've found that simpler alternatives often work better. Ask the agent to write a quick shell script on the fly. Write a focused skill with clear instructions. Point the agent at a CLI with good `--help` documentation — it can read the help text and figure out the rest.

Keep your toolset lean. MCP is the right choice when you need structured interop with an external system. For everything else, a script is faster and more reliable.

### Beyond code

One last thing. These principles aren't limited to code. I used the same workflow to prepare the Geneva talk itself: brainstorm the outline with an agent, write a spec for the content, iterate on the slides, get feedback. I use it to prepare podcast recordings, write blog posts, plan projects.

If you've learned to work with an agent for code, you already know how to work with it for everything else. The same principles apply: spec it, break it down, iterate with feedback.

### The cheat sheet

If you take away seven things from this post:

🧠 Brainstorm first, code second.
📝 Spec everything — one spec, one feature, one branch.
🔧 Right model and right skill for the job.
🔄 Feedback loops are everything.
🧩 Manage context: subagents, CLI, worktrees.
👀 Always review — all code deserves scrutiny.
🎯 MCP when you need interop, scripts when you don't.

The slides and speaker notes are on [GitHub](https://github.com/sebsto/ai-coding-lessons-learned) if you want to reuse or adapt them for your own team.

Happy coding.
