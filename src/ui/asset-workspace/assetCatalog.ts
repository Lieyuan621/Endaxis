/** 资产浏览器只消费目录信息，不读取或修改定义；子资源由所属资产内部导航。 */
export interface AssetCatalogEntry {
  /** 在当前目录中唯一的标识，可由资产类型与资源 ID 组合。 */
  id: string;
  name: string;
  kind: string;
  kindName: string;
  custom: boolean;
  /** 使用资产自己的图片；自定义资产可以沿用其原始资产的图片。 */
  iconPath?: string;
}
