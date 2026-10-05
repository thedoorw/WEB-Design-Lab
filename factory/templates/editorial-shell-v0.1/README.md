# Editorial Shell Starter v0.1

Purpose: reusable static starting point for narrow, reading-led portfolio / archive sites.

Derived from the method proven by Case 001, but intentionally removes reference-specific content and measurements.

## Use when

- the site should feel like a book, journal, archive, or small studio site;
- content grows over time;
- projects and notes share one reading system;
- a large image grid is not required;
- GitHub Pages / static hosting is preferred.

## Included

- centered masthead;
- horizontal desktop navigation;
- collapsible mobile navigation;
- optional promo strip;
- optional intro split;
- narrow editorial stream;
- repeated project/note entries;
- archive/index pattern;
- responsive width tokens;
- zero external dependencies.

## Do not copy Case 001 blindly

This starter is grammar, not a frozen reproduction.

For every new target:

```text
starter
→ replace content
→ set case tokens
→ capture
→ freeze valid reference baseline
→ compare
→ correct deltas
```

## Editable tokens

Start with `site/styles.css`:

- `--content-width`
- `--mobile-width`
- `--ink`
- `--muted`
- `--line`
- `--display-size`
- `--entry-title-size`
- `--entry-gap`

Do not encode target-specific geometry into this starter unless the same rule survives multiple cases.

## Minimum replacement checklist

1. Site name / tagline.
2. Navigation labels.
3. Intro copy.
4. Project/note entries.
5. Footer text.
6. Baseline measurements.
7. Asset ownership/license check.
