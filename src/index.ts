/**
 * Endaxis 的应用层入口。外部模块应从这里使用稳定 API，
 * 避免跨层引用内部实现；尚未导出的模块不视为兼容性承诺。
 */
export * from './core';
export * from './application';
export * from './data/operators';
export * from './data/gameDataRepository';
export * from './ui/timeline';
