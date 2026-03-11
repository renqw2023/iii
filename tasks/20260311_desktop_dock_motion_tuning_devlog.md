# 2026-03-11 Desktop Dock Motion Tuning Devlog

**Date**: 2026-03-11
**Branch**: main
**Scope**: Desktop dock hover animation tuning, Image Generation entry naming cleanup, and follow-up refinement based on visual feedback.

## Goal

Refine the desktop dock so it feels closer to macOS:

- hover magnification should be obvious and responsive
- the dock should still read as a single frosted-glass surface
- individual icons should not feel like heavy boxed buttons
- the `img2prompt` entry should use clearer naming in the dock and panel

## Files Changed

- `client/src/components/UI/DesktopDock.js`
- `client/src/components/UI/Img2PromptPanel.js`
- `tasks/todo.md`
- `tasks/lessons.md`

## What Changed

### 1. Dock motion tuning

Updated the Framer Motion magnification parameters in `DesktopDock.js`:

- increased the magnification influence radius to make nearby icons participate more
- set the peak scale to `1.34` for a clearer macOS-style hover response
- tightened the spring so the movement reacts faster and settles cleanly
- slightly reduced item gap so the motion reads as one connected wave instead of isolated jumps

Current tuning:

```js
const MAG_RADIUS = 116;
const SCALE_MAX = 1.34;
const SPRING_CFG = { mass: 0.14, stiffness: 320, damping: 24 };
```

### 2. Preserve the frosted-glass look

The first pass reduced aggression, but user feedback showed the icons still felt too containerized.
To fix that, the per-icon surface was softened:

- idle state background is now transparent
- hover state uses only a very light translucent fill
- border is transparent by default and only subtly appears on hover/active
- active state keeps a restrained inset highlight instead of a strong chip/button block

This keeps the visual emphasis on the full dock glass panel rather than on individual icon tiles.

### 3. Naming cleanup

Renamed the `img2prompt` entry to a clearer English label:

- dock tooltip: `Image Generation`
- right panel title: `Image Generation`

This aligns the dock entry and the side panel terminology.

## Iteration Summary

The work happened in a few small passes:

1. Reduced the original magnification and bounce because the hover felt too strong and slightly jerky.
2. Renamed the `img2prompt` entry for clearer product language.
3. Sped the interaction back up a little while removing the boxed icon feel.
4. Reintroduced a stronger macOS-like magnification while keeping the light glass aesthetic.

## Verification

### Static verification

Ran targeted lint verification:

```bash
cd client
npm run lint -- --no-error-on-unmatched-pattern src/components/UI/DesktopDock.js
```

Result:

- no new lint errors introduced by this change
- repository still contains pre-existing warnings outside this task scope

### Visual/browser verification

Intended verification for this UI change was browser-based inspection of the dock hover behavior.
In this session, the Chrome DevTools MCP browser tools referenced by the project instructions were not available, so automated browser verification could not be completed here.

## Known Limitations

- final motion feel still depends on live browser perception; static review cannot fully validate hover quality
- there are unrelated uncommitted workspace changes, including `server/routes/tools.js`, which were intentionally excluded from this dock-focused change set

## Result

The desktop dock now behaves more like a macOS dock:

- stronger hover magnification
- faster response
- lighter icon surfaces
- clearer Image Generation naming

The change is intentionally scoped to the dock interaction and label cleanup, without expanding into unrelated UI or backend work.
