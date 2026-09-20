/** 注册伤害分析面板实际使用的 ECharts 模块，避免把完整图表库打进主包。 */
import { use } from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);
