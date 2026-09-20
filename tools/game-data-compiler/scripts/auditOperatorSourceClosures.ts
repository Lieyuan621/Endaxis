import { auditOperatorSourceClosures } from '../src/index.ts';
import {
  parseOperatorSourceFileArguments,
  readOperatorSourceFiles,
} from './operatorSourceFiles.ts';

const args = parseOperatorSourceFileArguments(process.argv.slice(2), true);
const input = readOperatorSourceFiles(args);
if (!input.projectileDataById || !input.abilityEntityDataById || !input.gameplayTagPaths) {
  throw new Error('Unity template directories or GameplayTag paths were not loaded');
}
const report = auditOperatorSourceClosures({
  ...input,
  projectileDataById: input.projectileDataById,
  abilityEntityDataById: input.abilityEntityDataById,
  gameplayTagPaths: input.gameplayTagPaths,
});
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.blockedCount > 0) process.exitCode = 1;
