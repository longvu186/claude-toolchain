/**
 * Extract computed styles from every major element on a live page.
 *
 * Usage:
 *   node extract-styles.js <url> [output-json-path]
 *
 * Outputs a JSON file with colors, typography, spacing, and component styles.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function extractStyles(url, outputPath = 'extracted-styles.json') {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  const extraction = await page.evaluate(() => {
    const rgbToHex = (rgb) => {
      const match = rgb.match(/\d+/g);
      if (!match || match.length < 3) return rgb;
      const [r, g, b] = match.map(Number);
      return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
    };

    const allElements = document.querySelectorAll('*');
    const textColors = new Map();
    const bgColors = new Map();
    const fontStacks = new Map();
    const spacingValues = new Set();
    const borderRadii = new Set();
    const shadows = new Set();

    for (const el of allElements) {
      const s = getComputedStyle(el);

      // Colors
      if (s.color && s.color !== 'rgba(0, 0, 0, 0)') {
        const hex = rgbToHex(s.color);
        textColors.set(hex, (textColors.get(hex) || 0) + 1);
      }
      if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const hex = rgbToHex(s.backgroundColor);
        bgColors.set(hex, (bgColors.get(hex) || 0) + 1);
      }

      // Typography
      const fontKey = `${s.fontFamily}|${s.fontSize}|${s.fontWeight}|${s.lineHeight}`;
      if (!fontStacks.has(fontKey)) {
        fontStacks.set(fontKey, {
          tag: el.tagName.toLowerCase(),
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          lineHeight: s.lineHeight,
          letterSpacing: s.letterSpacing,
          sample: el.textContent?.trim().slice(0, 50) || '',
        });
      }

      // Spacing (padding and margin)
      for (const prop of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
                           'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'gap']) {
        const val = s[prop];
        if (val && val !== '0px' && val !== 'normal' && val !== 'auto') {
          spacingValues.add(val);
        }
      }

      // Border radius
      if (s.borderRadius && s.borderRadius !== '0px') {
        borderRadii.add(s.borderRadius);
      }

      // Shadows
      if (s.boxShadow && s.boxShadow !== 'none') {
        shadows.add(s.boxShadow);
      }
    }

    // Sort colors by frequency (most used first)
    const sortByFreq = (map) =>
      [...map.entries()].sort((a, b) => b[1] - a[1]).map(([val, count]) => ({ value: val, count }));

    // Sort spacing numerically
    const sortedSpacing = [...spacingValues].sort((a, b) => parseFloat(a) - parseFloat(b));

    return {
      textColors: sortByFreq(textColors).slice(0, 20),
      backgroundColors: sortByFreq(bgColors).slice(0, 20),
      typography: [...fontStacks.values()].slice(0, 30),
      spacing: sortedSpacing,
      borderRadii: [...borderRadii].sort((a, b) => parseFloat(a) - parseFloat(b)),
      shadows: [...shadows],
    };
  });

  await browser.close();

  const dir = path.dirname(outputPath);
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(extraction, null, 2));
  console.log(`Styles extracted to: ${outputPath}`);
  console.log(`  Text colors: ${extraction.textColors.length}`);
  console.log(`  Background colors: ${extraction.backgroundColors.length}`);
  console.log(`  Typography variants: ${extraction.typography.length}`);
  console.log(`  Spacing values: ${extraction.spacing.length}`);
  console.log(`  Border radii: ${extraction.borderRadii.length}`);
  console.log(`  Box shadows: ${extraction.shadows.length}`);

  return extraction;
}

// CLI entry point
if (require.main === module) {
  const url = process.argv[2];
  const outputPath = process.argv[3] || 'extracted-styles.json';
  if (!url) {
    console.error('Usage: node extract-styles.js <url> [output-json-path]');
    process.exit(1);
  }
  extractStyles(url, outputPath).catch((err) => {
    console.error('Extraction failed:', err.message);
    process.exit(1);
  });
}

module.exports = { extractStyles };
