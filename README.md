# doraemon-anatomy

An interactive isometric “exploded view” illustration of a Doraemon-style service robot, exported as self-contained HTML.

The project includes two generated outputs:
- `doraemon-anatomy.html` (dark theme)
- `doraemon-anatomy-light.html` (light theme)

## Preview

Screenshots are available in `/home/runner/work/doraemon-anatomy/doraemon-anatomy/shots`:
- `desktop.png`
- `apart.png`
- `lines.png`
- `lines-light.png`
- `zoom-head.png`
- `zoom-hatch.png`

## Repository structure

- `/home/runner/work/doraemon-anatomy/doraemon-anatomy/build.mjs` — source/build script
- `/home/runner/work/doraemon-anatomy/doraemon-anatomy/doraemon-anatomy.html` — generated dark HTML
- `/home/runner/work/doraemon-anatomy/doraemon-anatomy/doraemon-anatomy-light.html` — generated light HTML
- `/home/runner/work/doraemon-anatomy/doraemon-anatomy/shots/` — rendered screenshots

## Requirements

- Node.js 18+
- Access to the local anatomy kit used by the build script:
  - `kit/iso-kit.mjs`
  - `kit/lathe.mjs`
  - `scripts/inline-kit.mjs`

## Build

```bash
node /home/runner/work/doraemon-anatomy/doraemon-anatomy/build.mjs --kit /absolute/path/to/anatomy
```

Light theme output:

```bash
node /home/runner/work/doraemon-anatomy/doraemon-anatomy/build.mjs --light --kit /absolute/path/to/anatomy
```

You can also set the kit path via environment variable:

```bash
ANATOMY_KIT=/absolute/path/to/anatomy node /home/runner/work/doraemon-anatomy/doraemon-anatomy/build.mjs
```

Help:

```bash
node /home/runner/work/doraemon-anatomy/doraemon-anatomy/build.mjs --help
```
