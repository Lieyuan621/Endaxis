/** 将站点内的公共资源路径解析为当前部署目录下的 URL。 */
export function publicAssetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith(base)) return path;
  return `${base}${path.slice(1)}`;
}
