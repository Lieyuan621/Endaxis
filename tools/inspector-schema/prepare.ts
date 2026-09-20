import { syncInspectorSchema } from './sync.ts';

// 供无 Vite 的类型检查生命周期调用，不是业务开发者需要执行的生成命令。
syncInspectorSchema(process.cwd());
