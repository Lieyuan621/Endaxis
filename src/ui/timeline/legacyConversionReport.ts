/** 把旧轴转换器的结构化报告整理成面向用户的简明文本。 */

export interface LegacyConversionReportView {
  readonly issues: readonly { readonly path: string; readonly message: string }[];
  readonly fatalIssues: readonly { readonly path: string; readonly message: string }[];
  readonly unresolvedSkills: readonly unknown[];
  readonly identityChanges: readonly unknown[];
  readonly sequenceExpansions: readonly unknown[];
  readonly resourceAdjustments: readonly unknown[];
  readonly timingAdjustments: readonly unknown[];
  readonly skillFormAdjustments: readonly unknown[];
  readonly controlSwitchAdjustments: readonly unknown[];
  readonly inferredControlSwitches: readonly unknown[];
}

function issueLine(issue: { readonly path: string; readonly message: string }): string {
  return issue.path.length > 0 ? `${issue.path}：${issue.message}` : issue.message;
}

export function formatLegacyConversionReport(report: LegacyConversionReportView): string {
  const corrections =
    report.identityChanges.length +
    report.sequenceExpansions.length +
    report.resourceAdjustments.length +
    report.timingAdjustments.length +
    report.skillFormAdjustments.length +
    report.controlSwitchAdjustments.length +
    report.inferredControlSwitches.length;
  const lines: string[] = [];
  if (report.fatalIssues.length > 0) {
    lines.push('无法建立可打开的新版项目。');
  } else if (report.issues.length > 0) {
    lines.push('项目已转换并打开。无法转换的局部内容已省略或保留为直接转换结果。');
  } else {
    lines.push('项目已完整转换。');
  }
  lines.push(`自动调整：${corrections} 项`);
  if (report.unresolvedSkills.length > 0) {
    lines.push(`省略无法识别的技能块：${report.unresolvedSkills.length} 个`);
  }
  const problems = [...report.fatalIssues, ...report.issues];
  if (problems.length > 0) {
    lines.push('', '问题明细：');
    const visible = problems.slice(0, 100);
    visible.forEach((issue, index) => lines.push(`${index + 1}. ${issueLine(issue)}`));
    if (problems.length > visible.length) {
      lines.push(`另有 ${problems.length - visible.length} 项未在此处展开。`);
    }
  }
  return lines.join('\n');
}
