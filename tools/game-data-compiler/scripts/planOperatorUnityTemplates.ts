import { planOperatorUnityTemplateReferences } from '../src/index.ts';
import {
  parseOperatorSourceFileArguments,
  readOperatorSourceFiles,
} from './operatorSourceFiles.ts';

const args = parseOperatorSourceFileArguments(process.argv.slice(2), false);
const report = planOperatorUnityTemplateReferences(readOperatorSourceFiles(args));
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
