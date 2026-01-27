/**
 * Setup symlinks to expo-example test data
 *
 * Usage: pnpm setup:data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to expo-example (adjust as needed)
const EXPO_EXAMPLE_PATH = process.env.EXPO_EXAMPLE_PATH ||
  path.resolve(__dirname, '../../hardware-js-sdk/packages/connect-examples/expo-example');

// Data mappings: source (relative to expo-example) -> target (relative to project root)
const DATA_MAPPINGS = [
  {
    source: 'src/testTools/addressTest/data',
    target: 'packages/test-core/src/data/address/data',
  },
  {
    source: 'src/testTools/addressTest/dataVariant',
    target: 'packages/test-core/src/data/address/dataVariant',
  },
  {
    source: 'src/testTools/addressTest/baseParams.ts',
    target: 'packages/test-core/src/data/address/baseParams.ts',
  },
  {
    source: 'src/testTools/slip39Test/addressData',
    target: 'packages/test-core/src/data/slip39/addressData',
  },
  {
    source: 'src/testTools/slip39Test/pubKeyData',
    target: 'packages/test-core/src/data/slip39/pubKeyData',
  },
  {
    source: 'src/testTools/chainMethodTest/data',
    target: 'packages/test-core/src/data/chain',
  },
  {
    source: 'src/testTools/pubkeyTest/data',
    target: 'packages/test-core/src/data/pubkey/data',
  },
  {
    source: 'src/testTools/pubkeyTest/dataVariant',
    target: 'packages/test-core/src/data/pubkey/dataVariant',
  },
];

function setupDataLinks() {
  const projectRoot = path.resolve(__dirname, '..');

  console.log('Setting up data links...');
  console.log(`Expo example path: ${EXPO_EXAMPLE_PATH}`);
  console.log('');

  // Check if expo-example exists
  if (!fs.existsSync(EXPO_EXAMPLE_PATH)) {
    console.error(`❌ Expo example not found at: ${EXPO_EXAMPLE_PATH}`);
    console.error('');
    console.error('Please set EXPO_EXAMPLE_PATH environment variable to the correct path.');
    console.error('Example: EXPO_EXAMPLE_PATH=/path/to/hardware-js-sdk/packages/connect-examples/expo-example pnpm setup:data');
    process.exit(1);
  }

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const mapping of DATA_MAPPINGS) {
    const sourcePath = path.join(EXPO_EXAMPLE_PATH, mapping.source);
    const targetPath = path.resolve(projectRoot, mapping.target);

    // Check if source exists
    if (!fs.existsSync(sourcePath)) {
      console.log(`⚠️  Source not found: ${mapping.source}`);
      skipCount++;
      continue;
    }

    try {
      // Ensure target directory's parent exists
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });

      // Remove existing target if it exists
      if (fs.existsSync(targetPath)) {
        const stats = fs.lstatSync(targetPath);
        if (stats.isSymbolicLink()) {
          fs.unlinkSync(targetPath);
        } else {
          fs.rmSync(targetPath, { recursive: true });
        }
      }

      // Create symlink
      fs.symlinkSync(sourcePath, targetPath, 'junction');
      console.log(`✓ ${mapping.source}`);
      console.log(`  → ${mapping.target}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to create link: ${mapping.target}`);
      console.error(`   Error: ${(error as Error).message}`);
      errorCount++;
    }
  }

  console.log('');
  console.log(`Done! Success: ${successCount}, Skipped: ${skipCount}, Errors: ${errorCount}`);
}

setupDataLinks();
