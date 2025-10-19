# LucidJS

A lightweight reactive JavaScript library for building dynamic user interfaces.

## Quick Start

### CDN Usage

```html
<!-- Development version -->
<script type="module">
  import { createSignal, h, mount } from 'https://cdn.jsdelivr.net/gh/carlosxfelipe/lucidjs@main/dist/lucid.js';
</script>

<!-- Production version (minified) -->
<script type="module">
  import { createSignal, h, mount } from 'https://cdn.jsdelivr.net/gh/carlosxfelipe/lucidjs@main/dist/lucid.min.js';
</script>
```

### Local Development

```bash
deno task build  # Build the library
deno task serve  # Start development server
```
