import path from 'node:path';
import { formatGeneratedCandidate } from '../src/compiler/publication/formatGeneratedSource.ts';
import {
  GAME_DATA_PUBLISH_DIRECTORY_OUTPUTS,
  GAME_DATA_PUBLISH_FILE_OUTPUTS,
} from './gameDataOutputs.ts';

const args = process.argv.slice(2);
if (args.some(arg => arg !== '--check')) throw new Error('Usage: formatGameData.ts [--check]');
const result = await formatGeneratedCandidate(
  path.resolve(import.meta.dirname, '../../..'),
  [...GAME_DATA_PUBLISH_DIRECTORY_OUTPUTS, ...GAME_DATA_PUBLISH_FILE_OUTPUTS],
  { check: args.includes('--check') },
);
console.log(
  `${args.includes('--check') ? 'Checked' : 'Formatted'} ${result.fileCount} generated files.`,
);
