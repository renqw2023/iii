## Agentic Development Workflow (Antigravity-style)

Every non-trivial coding task MUST follow this 4-phase pipeline automatically:

### Phase 1 — Implementation Plan
- Before writing any code, use `EnterPlanMode` to produce a formal plan
- The plan must include: goal summary, files to change, step-by-step approach, risks
- Use `TaskCreate` for each discrete step so progress is visible in real time
- Present the plan and wait for user approval (ExitPlanMode) before proceeding
- Write plan details to `tasks/todo.md` as a persistent record

### Phase 2 — Execution with Live Task Tracking
- Mark each task `in_progress` with `TaskUpdate` before starting it
- Mark `completed` immediately after finishing — never batch-complete
- If blocked or something breaks: STOP, re-plan, do NOT push through
- Keep changes minimal and targeted; avoid scope creep

### Phase 3 — Browser Verification (Auto Browser Subagent)
After completing code changes, ALWAYS run browser verification automatically:
- Use `mcp__chrome-devtools__navigate_page` to open the running app (e.g. localhost port)
- Use `mcp__chrome-devtools__take_screenshot` to capture the result visually
- Use `mcp__chrome-devtools__list_console_messages` to check for JS errors
- Use `mcp__chrome-devtools__take_snapshot` for accessibility/DOM verification
- If errors are found: fix them before declaring done
- This step is MANDATORY for any task that touches UI or API endpoints

### Phase 4 — Walkthrough Summary
After successful verification, deliver a structured summary:
- What was built / changed (files modified)
- Verification evidence (screenshot description or test results)
- Any known limitations or follow-up items
- Update `tasks/todo.md` with a "## Result" section

---

## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One tack per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Use `TaskCreate` for each step + write to `tasks/todo.md`
2. **Verify Plan**: Present implementation plan and wait for user approval
3. **Track Progress**: Use `TaskUpdate` (in_progress → completed) in real time
4. **Browser Verify**: Run Phase 3 browser verification after every UI/API change
5. **Walkthrough**: Deliver Phase 4 summary with evidence after completion
6. **Capture Lessons**: Update `tasks/lessons.md` after any user correction

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.