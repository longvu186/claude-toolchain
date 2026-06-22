/**
 * Compare two screenshots and report pixel differences.
 *
 * Usage:
 *   node compare-screenshots.js <reference.png> <current.png> [diff-output.png]
 *
 * Requires: pixelmatch, pngjs (npm install pixelmatch pngjs)
 *
 * Returns exit code 0 if images match within tolerance, 1 if they differ.
 */

const fs = require('fs');
const path = require('path');

async function compareScreenshots(referencePath, currentPath, diffPath, options = {}) {
  let pixelmatch, PNG;
  try {
    pixelmatch = require('pixelmatch');
    PNG = require('pngjs').PNG;
  } catch {
    console.error('Missing dependencies. Install them with:');
    console.error('  npm install pixelmatch pngjs');
    process.exit(1);
  }

  const threshold = options.threshold ?? 0.1;

  const refBuf = fs.readFileSync(referencePath);
  const curBuf = fs.readFileSync(currentPath);

  const refImg = PNG.sync.read(refBuf);
  const curImg = PNG.sync.read(curBuf);

  if (refImg.width !== curImg.width || refImg.height !== curImg.height) {
    console.error(`Size mismatch: reference=${refImg.width}x${refImg.height}, current=${curImg.width}x${curImg.height}`);
    console.error('Screenshots must be the same dimensions for comparison.');
    return { match: false, error: 'size-mismatch' };
  }

  const { width, height } = refImg;
  const totalPixels = width * height;
  const diffImg = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    refImg.data,
    curImg.data,
    diffImg.data,
    width,
    height,
    { threshold, includeAA: false }
  );

  const diffPercent = ((numDiffPixels / totalPixels) * 100).toFixed(3);

  // Save diff image
  const outputDiff = diffPath || referencePath.replace('.png', '-diff.png');
  const dir = path.dirname(outputDiff);
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputDiff, PNG.sync.write(diffImg));

  // Classify severity
  let severity;
  if (numDiffPixels === 0) severity = 'exact-match';
  else if (parseFloat(diffPercent) < 0.5) severity = 'sub-pixel';
  else if (parseFloat(diffPercent) < 2) severity = 'minor-drift';
  else if (parseFloat(diffPercent) < 5) severity = 'notable-gap';
  else severity = 'major-deviation';

  const result = {
    match: numDiffPixels === 0,
    numDiffPixels,
    totalPixels,
    diffPercent: `${diffPercent}%`,
    severity,
    dimensions: `${width}x${height}`,
    diffImage: outputDiff,
  };

  console.log('\n─── Visual Comparison Report ───');
  console.log(`  Reference:   ${referencePath}`);
  console.log(`  Current:     ${currentPath}`);
  console.log(`  Diff image:  ${outputDiff}`);
  console.log(`  Dimensions:  ${width}x${height}`);
  console.log(`  Diff pixels: ${numDiffPixels} / ${totalPixels} (${diffPercent}%)`);
  console.log(`  Severity:    ${severity.toUpperCase()}`);
  console.log('────────────────────────────────\n');

  return result;
}

// CLI entry point
if (require.main === module) {
  const ref = process.argv[2];
  const cur = process.argv[3];
  const diff = process.argv[4];
  if (!ref || !cur) {
    console.error('Usage: node compare-screenshots.js <reference.png> <current.png> [diff-output.png]');
    process.exit(1);
  }
  compareScreenshots(ref, cur, diff).then((result) => {
    process.exit(result.match || result.severity === 'sub-pixel' ? 0 : 1);
  }).catch((err) => {
    console.error('Comparison failed:', err.message);
    process.exit(1);
  });
}

module.exports = { compareScreenshots };
