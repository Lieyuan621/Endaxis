import { describe, expect, it } from 'vitest';
import { parseWorkbenchLayoutState, serializeWorkbenchLayoutState } from './workbenchLayoutState';

describe('workbench layout state', () => {
  it('reads the main branch field names', () => {
    expect(
      parseWorkbenchLayoutState({
        leftPanelWidth: 280,
        rightPanelWidth: 360,
        bottomPanelHeight: 420,
        isLeftPanelCollapsed: true,
        isRightPanelCollapsed: false,
        isBottomPanelCollapsed: true,
        leftBottomTool: 'global',
        rightPanelTool: 'battleLog',
      }),
    ).toEqual({
      leftWidth: 280,
      rightWidth: 360,
      bottomHeight: 420,
      leftCollapsed: true,
      rightCollapsed: false,
      bottomCollapsed: true,
      bottomTool: 'global',
      rightTool: 'battleLog',
    });
  });

  it('writes the shared main branch schema', () => {
    expect(
      serializeWorkbenchLayoutState({
        leftWidth: 240.4,
        rightWidth: 300.6,
        bottomHeight: 320.5,
        leftCollapsed: false,
        rightCollapsed: true,
        bottomCollapsed: false,
        bottomTool: 'enemy',
        rightTool: 'inspector',
      }),
    ).toEqual({
      leftPanelWidth: 240,
      rightPanelWidth: 301,
      bottomPanelHeight: 321,
      isLeftPanelCollapsed: false,
      isRightPanelCollapsed: true,
      isBottomPanelCollapsed: false,
      leftBottomTool: 'enemy',
      rightPanelTool: 'inspector',
    });
  });
});
