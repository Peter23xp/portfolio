---
name: Peter Akilimali — Portfolio
description: A living chromatophore skin that re-patterns itself for each visitor's context.
colors:
  ink: "oklch(0.40 0.095 35)"
  ink-deep: "oklch(0.31 0.075 33)"
  pigment: "oklch(0.56 0.115 40)"
  ridge: "oklch(0.235 0.022 40)"
  mantle: "oklch(0.948 0.018 28)"
  mantle-2: "oklch(0.915 0.026 30)"
  line: "oklch(0.80 0.03 32)"
  text-2: "oklch(0.43 0.05 35)"
  on-ink: "oklch(0.955 0.016 28)"
  on-ink-2: "oklch(0.86 0.04 32)"
  on-ridge-2: "oklch(0.80 0.03 35)"
  iris: "oklch(0.72 0.115 205)"
  iris-hi: "oklch(0.80 0.10 200)"
  iris-deep: "oklch(0.48 0.095 215)"
typography:
  display:
    fontFamily: "Anybody, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3.4rem, 6.6vw, 6rem)"
    fontWeight: 760
    lineHeight: 0.9
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 118"
  headline:
    fontFamily: "Anybody, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 4.6vw, 3.75rem)"
    fontWeight: 740
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 110"
  title:
    fontFamily: "Anybody, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 2.2vw, 1.75rem)"
    fontWeight: 680
    lineHeight: 1.15
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 106"
  item:
    fontFamily: "Anybody, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 660
    lineHeight: 1.25
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 104"
  body:
    fontFamily: "Anybody, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "'kern', 'liga', 'calt'"
  lede:
    fontFamily: "Anybody, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Anybody, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    letterSpacing: "0.08em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.8125rem"
    lineHeight: 1.7
rounded:
  focus: "4px"
  lang: "6px"
  cell: "10px"
  app-icon: "13px"
  sheet: "14px"
  feature: "16px"
  device: "18px"
  pill: "999px"
spacing:
  pad: "clamp(1.25rem, 4vw, 3rem)"
  wrap: "78rem"
  section: "clamp(5rem, 10vw, 8.5rem)"
  head-gap: "clamp(2.5rem, 5vw, 3.75rem)"
  row: "1.4rem"
components:
  button-primary:
    backgroundColor: "{colors.iris}"
    textColor: "{colors.ridge}"
    rounded: "{rounded.pill}"
    padding: "0.95rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.iris-hi}"
  pill-on-ink:
    textColor: "{colors.on-ink}"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1.1rem"
  pill-on-ink-hover:
    backgroundColor: "{colors.on-ink}"
    textColor: "{colors.ink}"
  button-outline:
    textColor: "{colors.ridge}"
    rounded: "{rounded.pill}"
    padding: "0.8rem 1.3rem"
  button-outline-hover:
    backgroundColor: "{colors.ridge}"
    textColor: "{colors.mantle}"
  chip:
    textColor: "{colors.ridge}"
    rounded: "{rounded.pill}"
    padding: "0.55rem 0.95rem"
  chip-selected:
    backgroundColor: "{colors.ridge}"
    textColor: "{colors.mantle}"
  context-switch-track:
    backgroundColor: "{colors.ink-deep}"
    rounded: "{rounded.pill}"
    padding: "4px"
  context-switch-option-active:
    backgroundColor: "{colors.on-ink}"
    textColor: "{colors.ink-deep}"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1.15rem"
  feature-cell:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.feature}"
    padding: "clamp(1.75rem, 4.5vw, 4rem)"
  sheet:
    backgroundColor: "{colors.ridge}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.sheet}"
    padding: "1.25rem"
  dialog:
    backgroundColor: "{colors.mantle}"
    textColor: "{colors.ridge}"
    rounded: "{rounded.sheet}"
  tab-selected:
    backgroundColor: "{colors.ridge}"
    textColor: "{colors.mantle}"
    rounded: "{rounded.pill}"
    padding: "0.45rem 0.9rem"
---

# Design System: Peter Akilimali — Portfolio

## Overview

**Creative North Star: "The Living Skin"**

The public portfolio is a cephalopod skin. Pigment ink sits against a light mantle, and the surface re-patterns when the visitor states their context ("Je recrute / J'ai un projet"). The first viewport is drenched in chroma ink, and the portrait is rendered as a chromatophore halftone on canvas that dilates into the real photo around the pointer. Reading sections fall back to a warm, pigment-tinted mantle. The close returns to the dark ridge. Pages read as three skin states: ink, mantle, ridge.

Colour comes in flat fields that never blend. The only texture is the chromatophore dot, which appears as the hero canvas, the dot fields behind the Chadito screenshots and at the top of the close, the SVG project glyphs, the expertise swatches, the journey wave and the GitHub activity grid. One variable sans (Anybody) carries the hierarchy, and its weight and width move together the way pigment expands. A single teal iridophore flash is kept for "available" and the primary action.

This world rejects the dark developer portfolio with a neon accent and the split hero with text left, photo right and cards below. The private admin panel is out of scope and keeps its own violet `adm-` system in `tailwind.config.js`.

**Key Characteristics:**
- Three flat skin states: ink hero, mantle reading sections, ridge close.
- Dots are the only texture, and every data visual is drawn in dots.
- One variable sans, with display weight and width rising together.
- Exactly one cool accent (iridophore teal) in a warm, monochrome-hue palette.
- Rows and hairlines instead of cards, and rounded pills for actions.

## Colors

A warm single-hue palette (hue 28–40) of ink, pigment and mantle, with one cool teal accent standing out at hue 200–215.

### Primary
- **Chroma Ink** (ink): drenches the hero field and the Chadito feature cell. It also fills the dots of glyphs, swatches, the journey wave and the activity grid, and colours project kinds and journey periods on the mantle. It doubles as the selection colour, the caret and the scrollbar thumb. `theme-color` and the canvas mirror it as `#7a3a2e`.
- **Deep Ink** (ink-deep): the switch track inside the hero, the second expertise swatch, and the text colour of the active switch option.
- **Light Pigment** (pigment): the halo dot field behind the Chadito screenshots and the third expertise swatch. It is a mid-tone and must never carry text.

### Secondary
- **Iridophore Teal** (iris): the only accent. Use it for the primary action fill, the "available" signal dot and its flash, and the primary contact channel value on the ridge.
- **Iridophore Bright** (iris-hi): the primary button on hover, and the focus ring on dark fields (hero, feature, close).
- **Iridophore Deep** (iris-deep): the focus ring on the mantle.

### Neutral
- **Ridge** (ridge): body text, H2 colour, the close section, the mobile menu sheet, and selected chips and tabs. The canvas mirrors it as `#2b1e1a`.
- **Mantle** (mantle): the page ground. It is a pigmented light tinted toward the ink hue, never neutral cream.
- **Mantle Shade** (mantle-2): the expertise section band, project row hover fill, notices, skeletons, the icon-button ground and the scrollbar track.
- **Hairline** (line): every rule on the mantle (project rows, domain dividers, stack rule, dialog head and foot), and the zero cells in the activity grid.
- **Muted Pigment Text** (text-2): secondary copy on the mantle, including ledes, descriptions, meta and labels.
- **On-Ink** (on-ink) / **On-Ink Muted** (on-ink-2): primary and secondary text on ink and ridge fields.
- **On-Ridge Muted** (on-ridge-2): secondary text in the close.

### Named Rules
**The One Flash Rule.** Iridophore teal marks only "available" and the primary action, with one filled teal button per viewport. Every other emphasis uses ink or ridge.

**The Flat Field Rule.** Fields are solid colour. A gradient may only appear as an alpha mask that fades a dot field, never as a colour fill. Glass and backdrop blur are not used.

**The Tinted Mantle Rule.** Light surfaces always carry the ink hue (hue 28–30, chroma 0.018 or more). A neutral grey or cream ground breaks the skin.

## Typography

**Display Font:** Anybody (variable, weight 100–900, width 50–150%), with ui-sans-serif and system-ui as fallbacks. It is self-hosted as latin and latin-ext woff2, and the latin file is preloaded.
**Body Font:** Anybody, the same family at default width.
**Label/Mono Font:** the system monospace stack, used only for raw README text in the dialog.

**Character:** a single variable grotesque whose width axis does the expressive work. Display type is heavy and stretched wide like dilated pigment, and body text stays at normal width for reading.

### Hierarchy
- **Display** (760, wdth 118%, clamp(3.4rem, 6.6vw, 6rem), 0.9): the hero name. The close title (clamp(2.6rem, 6vw, 5rem), 0.98) and the feature name (780, clamp(2.5rem, 4.4vw, 3.75rem)) use the same 118% width.
- **Headline** (740, wdth 110%, clamp(2.25rem, 4.6vw, 3.75rem), 1): section H2s in ridge.
- **Title** (680, wdth 106%, clamp(1.375rem, 2.2vw, 1.75rem), 1.15): H3s and the activity heading. Domain titles (1.3rem) and the dialog title sit at this weight.
- **Item** (660, wdth 104%, 1.25rem, 1.25): project names and journey step titles.
- **Body** (400, 1.0625rem, 1.6): running text. Ledes are set at 1.1875rem in text-2 with a 40rem cap, and project descriptions cap at 60ch and clamp to 2 lines.
- **Label** (600, 0.8125rem, 0.08em tracking, uppercase): short inline field labels only, namely the Chadito facts terms and the "Stack" label.
- **UI weights:** 520 for nav links and the role line, 560–620 for chips and buttons, and 650 for the primary button and strong status. Tabular numerals are used for counts, periods and meta.

### Named Rules
**The Dilation Rule.** Weight and width rise together. The larger the type, the heavier and wider it gets (104% → 106% → 110% → 118%), and tracking tightens as it grows (−0.01em → −0.03em). The hero name animates in from 300/78% to 760/118%, and it pulses to 480/92% when the context changes.

**The Short Caps Rule.** Wide-tracked uppercase is only for labels of one or two words that sit inline with their value. It never sits above a heading.

## Layout

Content sits in a centred wrap (max 78rem) with fluid side padding (`--pad`, clamp(1.25rem, 4vw, 3rem)). Sections breathe with clamp(5rem, 10vw, 8.5rem) of vertical padding. The expertise section is set apart by a mantle-2 band rather than a border. When activity follows expertise or journey, its top padding collapses to clamp(1rem, 3vw, 2rem) so the two read as one region. Section heads cap at 46rem, with clamp(2.5rem, 5vw, 3.75rem) below them.

The hero is a full-height (100svh) three-row grid of nav, copy and status. The copy column caps at 40rem on the left, and the canvas or portrait fills the field behind it. The portrait is anchored bottom right at 96% height. Projects form a ruled list. Each row is a four-column grid (3rem glyph, name and description, meta, 13.5rem actions) between hairlines, and the hover fill bleeds 0.75rem past the rule. Expertise and journey use four equal columns. Domains are separated by inline hairlines, and the journey has a dot wave running across its top.

The visitor's context reorders sections, and the move is animated with view transitions (0.65s, the house ease). The hero is excluded from the transition so the pressed option updates instantly.

Breakpoints:
- **At 1080px:** domains drop to 2 columns, and project meta moves under the name.
- **At 767px:** the hero stacks, with the canvas and portrait occupying the top 46svh and the copy below. Nav links, the language switch and the CV link fold into a Menu pill that opens a ridge sheet. The switch goes full width with equal options. The feature becomes one column with the screenshots first. Projects collapse to a 2.5rem glyph plus text. Journey becomes a vertical line with dot nodes.

## Elevation & Depth

The system is flat. Depth comes from the change between skin states (ink, mantle, ridge) and from one tonal step (mantle → mantle-2) for hover and banding. The one shadow belongs to the Chadito phone screenshots, which are physical device captures layered over a dot field. The dialog backdrop is a translucent ridge wash without blur.

### Shadow Vocabulary
- **Device lift** (`box-shadow: 0 10px 20px oklch(0.2 0.05 35 / 0.45)`, with a 1px on-ink 25% outline): app screenshots only.

### Named Rules
**The Tonal Step Rule.** Hover and grouping use mantle-2 fills or a full inversion to ridge or on-ink, never a shadow.

## Shapes

Actions are fully rounded pills (999px): the primary button, outline buttons, chips, tabs, the context switch, the menu toggle, the skip link and skeleton bars. Containers use soft, moderate radii: 10px for row hover fills and notices, 14px for the dialog and menu sheet, 16px for the feature cell (14px on mobile), and 18px for device screenshots. Every dot is a perfect circle, including the signal, step nodes, switch dots and skeleton glyphs. Lines are always 1px hairlines.

## Components

### Buttons
- **Shape:** full pill (999px).
- **Primary:** an iridophore teal fill with ridge text at weight 650 and 0.95rem × 1.5rem padding, led by an icon. It brightens to iris-hi on hover and sinks 1px on press. Use one per view.
- **Outline ("more"):** a 1px ridge border at weight 620, which fills ridge with mantle text on hover.
- **Pill on ink:** a 1px on-ink border at 50% that inverts to an on-ink fill with ink text on hover. It is used for the store links and the CV link in the nav (45% border).
- **Link action:** an underlined text link whose underline starts at 40% currentColor and goes solid on hover, with a trailing arrow-up-right icon.
- **Focus:** a 2px outline with 3px offset, in iris-deep on the mantle and iris-hi on dark fields.

### Chips
- **Style:** filter radios with a 1px hairline border, weight 560, 0.9375rem, and a tabular count at 75% opacity.
- **State:** the border turns ink on hover, and the selected state inverts to a ridge fill with mantle text.

### Cards / Containers
- **Feature cell:** the only card. It has an ink fill, on-ink text, a 16px radius and fluid padding, and holds a two-column grid of text and the screenshot fan over a pigment dot field. On hover the outer screenshots spread outward.
- **Notice:** a mantle-2 fill with a 10px radius and ridge text.
- Projects are rows, not cards.

### Navigation
- **Desktop:** the "PA" mark, links at weight 520 with a 1px underline on hover, the FR/EN toggle (the pressed state is underlined, others sit at 72% opacity) and the CV pill, all in on-ink over the hero field.
- **Mobile:** a ridge Menu pill opens a ridge sheet (14px radius) with 1.25rem links.

### Context Switch (signature)
A deep-ink pill track with 4px padding holds two options. The active option is an on-ink fill with ink-deep text, and its dot grows from 0.6 to 1.15 scale. Changing it re-patterns the hero canvas, pulses the name and reorders the sections.

### Pigment Glyph (signature)
Each project carries a 48px SVG made of ink dots, and the structure of the dots encodes its category: a dense hex for shipped work, rings for hackathon and Web3, waves for personal projects, scatter for contributions, and a loose grid for repos. On hover the dots dilate to 1.3 scale with an 18ms stagger.

### Skin Canvas (signature)
The hero portrait is rendered as a halftone. Dots are sized by luminance and quantised to four tones (ridge, deep pigment, light pigment, mantle), and they reveal the real photo colour where they dilate around the pointer or touch. The static portrait image is the fallback without JS and under reduced motion.

### Contact Channels
These are ruled rows on the ridge with an 11rem key column, a large value (weight 620) and a trailing icon. On hover a row indents by 0.6rem. The primary channel value is set in iris.

### README Dialog
A native dialog with a mantle ground and a 14px radius over a 72% ridge backdrop. It has a hairline head and foot, pill tabs (the selected tab is ridge) and a round mantle-2 close button. README text is set in mono.

## Do's and Don'ts

### Do:
- **Do** build every texture and data visual from circular ink dots (glyphs, swatches, wave, activity grid, halftone).
- **Do** keep the three-state rhythm: the ink hero, mantle reading sections (with a mantle-2 band to separate them) and the ridge close.
- **Do** raise weight and width together for larger type (Anybody wdth 104–118%) and tighten tracking as size grows.
- **Do** use the house ease `cubic-bezier(0.16, 1, 0.3, 1)` for movement, and gate dilation, flashes and spreads behind `prefers-reduced-motion: no-preference`.
- **Do** use Phosphor and Simple Icons as inline SVG, at 1em.
- **Do** mirror any token used in canvas code as an sRGB constant that matches the OKLCH source.

### Don't:
- **Don't** use iridophore teal for anything except "available" and the primary action.
- **Don't** fill surfaces with gradients, glass or blur. Gradients may only mask a dot field.
- **Don't** set the mantle to neutral grey or cream. It always carries the ink hue.
- **Don't** add shadows to UI surfaces. The device-lift shadow belongs to app screenshots only.
- **Don't** put an uppercase label or kicker above a heading. Tracked caps are only for inline field labels.
- **Don't** set text on the light pigment tone.
