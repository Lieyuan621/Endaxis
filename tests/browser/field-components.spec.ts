import { test, expect } from './helpers';
import type { Locator, Page } from '@playwright/test';

async function choose(page: Page, control: Locator, option: string) {
  // ElSelect 的文字覆盖内部 combobox 输入，点击可见的选择器外壳。
  await control
    .locator(
      'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " el-select ")][1]',
    )
    .click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/browser/fields/index.html');
  await expect(page.getByRole('heading', { name: 'Real field components' })).toBeVisible();
});

for (const name of ['union', 'optional', 'array', 'record']) {
  test(`${name} keeps reference identity through missing catalogs and host undo`, async ({
    page,
  }) => {
    const field = page.getByTestId(name);
    const reference = field.locator('.reference-field').first();
    await expect(reference).toHaveAttribute('data-reference-state', 'invalid');
    await expect(reference).toContainText('stale-id');
    await expect(reference.getByRole('combobox')).toHaveCount(1);
    await expect(field.locator('textarea')).toHaveCount(0);
    // ElSelect has an internal input; the important invariant is no plain EaInput.
    await expect(reference.locator('.ea-input')).toHaveCount(0);
    for (const [button, catalog, state] of [
      ['Empty catalog', 'empty', 'invalid'],
      ['Unknown catalog', 'contextUnknown', 'contextUnknown'],
    ]) {
      await page.getByRole('button', { name: button, exact: true }).click();
      await expect(reference).toHaveAttribute('data-reference-catalog', catalog!);
      await expect(reference).toHaveAttribute('data-reference-state', state!);
      await expect(reference).toContainText('stale-id');
      await expect(page.getByTestId('commits')).toHaveText('0');
    }
    await page.getByRole('button', { name: 'Available catalog' }).click();
    if (name === 'array')
      await field.getByRole('button', { name: 'Edit list', exact: true }).click();
    await choose(page, reference.getByRole('combobox'), 'Known buff · Project');
    if (name === 'array') await field.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(reference).toHaveAttribute('data-reference-state', 'valid');
    await expect(page.getByTestId('commits')).toHaveText('1');
    await page.getByRole('button', { name: 'Host undo' }).click();
    await expect(reference).toHaveAttribute('data-reference-state', 'invalid');
    await expect(reference).toContainText('stale-id');
  });
}

test('optional disable/enable restores its reference draft', async ({ page }) => {
  const optional = page.getByTestId('optional');
  await optional.locator('label.ea-checkbox').click();
  await expect(optional.getByRole('checkbox')).not.toBeChecked();
  await expect(page.getByTestId('state')).not.toContainText('"optional"');
  await optional.locator('label.ea-checkbox').click();
  await expect(optional.getByRole('checkbox')).toBeChecked();
  await expect(page.getByTestId('state')).toContainText('"optional":"stale-id"');
  await expect(optional.locator('.reference-field')).toHaveAttribute(
    'data-reference-state',
    'invalid',
  );
});

test('creator selects a union reference, cancels without committing, then starts fresh', async ({
  page,
}) => {
  const creator = page.getByTestId('creator');
  await creator.getByRole('button', { name: 'Open creator' }).click();
  const editor = creator.locator('.definition-value-creator');
  await choose(
    page,
    editor.locator('.definition-value-creator__selector').getByRole('combobox'),
    'Text',
  );
  const reference = editor.locator('.reference-field');
  await expect(reference).toHaveAttribute('data-reference-state', 'unset');
  const apply = editor.locator('.definition-value-creator__actions button').first();
  await expect(apply).toBeDisabled();
  await choose(page, reference.getByRole('combobox'), 'Known buff · Project');
  await expect(apply).toBeEnabled();
  await editor.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByTestId('created')).toHaveText('null');
  await creator.getByRole('button', { name: 'Open creator' }).click();
  await expect(editor.locator('.reference-field')).toHaveCount(0);
  await choose(
    page,
    editor.locator('.definition-value-creator__selector').getByRole('combobox'),
    'Text',
  );
  await expect(editor.locator('.reference-field')).toHaveAttribute('data-reference-state', 'unset');
  await choose(
    page,
    editor.locator('.reference-field').getByRole('combobox'),
    'Known buff · Project',
  );
  await editor.locator('.definition-value-creator__actions button').first().click();
  await expect(page.getByTestId('created')).toHaveText('"known"');
});

test('node reference survives absent candidates and numeric drafts can be discarded', async ({
  page,
}) => {
  const node = page.getByTestId('node');
  const reference = node.locator('.reference-field');
  await expect(reference).toHaveAttribute('data-reference-state', 'invalid');
  await page.getByRole('button', { name: 'Empty catalog' }).click();
  await expect(reference).toHaveAttribute('data-reference-catalog', 'empty');
  await expect(reference).toContainText('stale-id');
  await page.getByRole('button', { name: 'Unknown catalog' }).click();
  await expect(reference).toHaveAttribute('data-reference-catalog', 'contextUnknown');
  await page.getByRole('button', { name: 'Available catalog' }).click();
  await choose(page, reference.getByRole('combobox'), 'Known buff · Project');
  await expect(page.getByTestId('node-value')).toContainText('"buffId":"known"');
  const number = node.locator('input[type="number"]');
  await number.fill('7');
  await expect(page.getByTestId('node-pending')).toHaveText('true');
  await number.press('Escape');
  await expect(number).toHaveValue('1');
  await expect(page.getByTestId('node-value')).toContainText('"amount":1');
  await expect(page.getByTestId('node-commits')).toHaveText('1');
});

test('rejected node commit retains the pending draft for correction', async ({ page }) => {
  const node = page.getByTestId('node');
  await node.getByRole('checkbox', { name: 'Reject node commits' }).check();
  const number = node.locator('input[type="number"]');
  await number.fill('7');
  await number.press('Tab');
  await expect(node.getByRole('alert')).toBeVisible();
  await expect(number).toHaveValue('7');
  await expect(page.getByTestId('node-value')).toContainText('"amount":1');
  await expect(page.getByTestId('node-commits')).toHaveText('0');
  await number.focus();
  await number.press('Escape');
  await expect(number).toHaveValue('1');
  await expect(node.getByRole('alert')).toHaveCount(0);
});

test('read-only target navigation is available only for a unique visible identity', async ({
  page,
}) => {
  const scope = page.getByTestId('scoped-reference');
  const reference = scope.locator('.reference-field');
  await expect(reference.getByRole('combobox')).toBeDisabled();
  await expect(reference).toHaveAttribute('data-reference-state', 'valid');
  await expect(reference).toContainText('Read-only target');
  await reference.getByRole('button', { name: 'Open target' }).click();
  await expect(page.getByTestId('navigation-count')).toHaveText('1');
  await scope.getByRole('button', { name: 'Duplicate target' }).click();
  await expect(reference).toHaveAttribute('data-reference-state', 'ambiguous');
  await expect(reference.getByRole('button', { name: 'Open target' })).toHaveCount(0);
  await scope.getByRole('button', { name: 'Invisible target' }).click();
  await expect(reference).toHaveAttribute('data-reference-state', 'invisible');
  await expect(reference.getByRole('button', { name: 'Open target' })).toHaveCount(0);
  await expect(page.getByTestId('navigation-count')).toHaveText('1');
});

test('creator keeps its reference draft but blocks apply after catalog refresh', async ({
  page,
}) => {
  const creator = page.getByTestId('creator');
  await creator.getByRole('button', { name: 'Open creator' }).click();
  const editor = creator.locator('.definition-value-creator');
  await choose(
    page,
    editor.locator('.definition-value-creator__selector').getByRole('combobox'),
    'Text',
  );
  const reference = editor.locator('.reference-field');
  await choose(page, reference.getByRole('combobox'), 'Known buff · Project');
  const apply = editor.locator('.definition-value-creator__actions button').first();
  await expect(apply).toBeEnabled();
  await page.getByRole('button', { name: 'Empty catalog' }).click();
  await expect(apply).toBeDisabled();
  await expect(reference).toContainText('known');
  await expect(page.getByTestId('created')).toHaveText('null');
  await page.getByRole('button', { name: 'Available catalog' }).click();
  await expect(apply).toBeEnabled();
  await apply.click();
  await expect(page.getByTestId('created')).toHaveText('"known"');
});

test('字符串常量草稿支持取消，并在目录失效时禁止提交', async ({ page }) => {
  const field = page.getByTestId('string-operand');
  const chooseKnown = async () => {
    await field.locator('.reference-field .el-select__wrapper').click();
    await page.getByRole('option', { name: 'Known buff · Project', exact: true }).click();
  };
  await chooseKnown();
  await field.getByRole('button', { name: 'Discard' }).click();
  await expect(page.getByTestId('string-operand-value')).toHaveText('"stale-id"');
  await chooseKnown();
  await page.getByRole('button', { name: 'Empty catalog' }).click();
  await expect(field.getByRole('button', { name: 'Apply', exact: true })).toBeDisabled();
  await expect(page.getByTestId('string-operand-value')).toHaveText('"stale-id"');
  await page.getByRole('button', { name: 'Available catalog' }).click();
  await expect(field.getByRole('button', { name: 'Apply', exact: true })).toBeEnabled();
});

const conditionTrue = { kind: 'constant', value: true };
const conditionFalse = { kind: 'constant', value: false };
const conditionReference = { kind: 'conditionNode', nodeId: 'shared' };
const originalConditions = [conditionTrue, conditionReference, conditionFalse];

async function expectConditions(page: Page, kind: 'all' | 'any', conditions: readonly unknown[]) {
  await expect(page.getByTestId(`condition-${kind}-value`)).toHaveText(
    JSON.stringify({ kind, conditions }),
  );
}

function conditionList(page: Page, kind: 'all' | 'any') {
  return page.getByTestId(`condition-${kind}`).locator('.condition-list');
}

test('empty any appends only explicit boolean choices in one undoable inspector transaction', async ({
  page,
}) => {
  const inspector = page.getByTestId('condition-any');
  const list = conditionList(page, 'any');
  await expect(list).toHaveAttribute('data-condition-list');
  await expect(list.locator('.condition-list__row')).toHaveCount(0);
  await expect(inspector.locator('textarea')).toHaveCount(0);
  await expectConditions(page, 'any', []);
  await list.getByRole('button', { name: 'Edit list', exact: true }).click();
  const add = list.getByRole('button', { name: 'Add condition', exact: true });
  const choice = list.getByRole('combobox', { name: 'New condition', exact: true });
  await expect(add).toBeDisabled();
  await choose(page, choice, 'True');
  await add.click();
  await expect(add).toBeDisabled();
  await choose(page, choice, 'False');
  await add.click();
  await expect(list.locator('.condition-list__row')).toHaveCount(2);
  await expectConditions(page, 'any', []);
  await expect(page.getByTestId('condition-commits')).toHaveText('0');
  await list.getByRole('button', { name: 'Apply condition list', exact: true }).click();
  await expectConditions(page, 'any', [conditionTrue, conditionFalse]);
  await expect(page.getByTestId('condition-commits')).toHaveText('1');
  await page.getByRole('button', { name: 'Undo condition graph' }).click();
  await expectConditions(page, 'any', []);
  await expect(page.getByRole('button', { name: 'Undo condition graph' })).toBeDisabled();
  await page.getByRole('button', { name: 'Redo condition graph' }).click();
  await expectConditions(page, 'any', [conditionTrue, conditionFalse]);
  await expectConditions(page, 'all', originalConditions);
});

test('mixed all removes and reorders locally, then cancels or applies the whole list atomically', async ({
  page,
}) => {
  const list = conditionList(page, 'all');
  await expect(page.getByTestId('condition-all').locator('textarea')).toHaveCount(0);
  await expect(list.locator('.condition-list__row')).toHaveCount(3);
  for (const commit of [false, true]) {
    await list.getByRole('button', { name: 'Edit list', exact: true }).click();
    await list.getByRole('button', { name: 'Move condition 3 up', exact: true }).click();
    await list.getByRole('button', { name: 'Remove condition 1', exact: true }).click();
    await expect(list.locator('.condition-list__row')).toHaveCount(2);
    await expectConditions(page, 'all', originalConditions);
    await expect(page.getByTestId('condition-commits')).toHaveText('0');
    await list
      .getByRole('button', {
        name: commit ? 'Apply condition list' : 'Cancel condition list',
        exact: true,
      })
      .click();
    if (!commit) {
      await expect(list.locator('.condition-list__row')).toHaveCount(3);
      await expectConditions(page, 'all', originalConditions);
    }
  }
  await expectConditions(page, 'all', [conditionFalse, conditionReference]);
  await expect(page.getByTestId('condition-commits')).toHaveText('1');
  await expect(page.getByTestId('condition-shared')).toHaveText(
    '{"type":"boolean","expression":{"kind":"combatActive"}}',
  );
  await expect(page.getByTestId('condition-other')).toHaveText(
    '{"type":"boolean","expression":{"kind":"not","condition":{"kind":"conditionNode","nodeId":"shared"}}}',
  );
  await page.getByRole('button', { name: 'Undo condition graph' }).click();
  await expectConditions(page, 'all', originalConditions);
  await expect(page.getByRole('button', { name: 'Undo condition graph' })).toBeDisabled();
  await page.getByRole('button', { name: 'Redo condition graph' }).click();
  await expectConditions(page, 'all', [conditionFalse, conditionReference]);
});

test('rejected condition list retains its draft and cancel prevents a later host flush from committing', async ({
  page,
}) => {
  const list = conditionList(page, 'all');
  await page.getByRole('checkbox', { name: 'Reject condition commits' }).check();
  await list.getByRole('button', { name: 'Edit list', exact: true }).click();
  await list.getByRole('button', { name: 'Remove condition 2', exact: true }).click();
  await list.getByRole('button', { name: 'Apply condition list', exact: true }).click();
  await expectConditions(page, 'all', originalConditions);
  await expect(list.locator('.condition-list__row')).toHaveCount(2);
  await expect(
    list.getByRole('button', { name: 'Apply condition list', exact: true }),
  ).toBeVisible();
  await expect(list.getByRole('alert')).toBeVisible();
  await expect(page.getByTestId('condition-attempts')).toHaveText('1');
  await expect(page.getByTestId('condition-commits')).toHaveText('0');
  await list.getByRole('button', { name: 'Cancel condition list', exact: true }).click();
  await expect(list.locator('.condition-list__row')).toHaveCount(3);
  await expect(list.getByRole('alert')).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Reject condition commits' }).uncheck();
  await page.getByRole('button', { name: 'Apply inspector drafts' }).click();
  await expectConditions(page, 'all', originalConditions);
  await expect(page.getByTestId('condition-attempts')).toHaveText('1');
  await expect(page.getByTestId('condition-commits')).toHaveText('0');
  await expect(page.getByRole('button', { name: 'Undo condition graph' })).toBeDisabled();
  await list.getByRole('button', { name: 'Edit list', exact: true }).click();
  await expect(list.locator('.condition-list__row')).toHaveCount(3);
});

test('read-only condition inspector shows structured conditions and source navigation without mutation controls', async ({
  page,
}) => {
  const inspector = page.getByTestId('condition-readonly');
  await expect(inspector.locator('.condition-list__row')).toHaveCount(3);
  await expect(inspector.locator('textarea')).toHaveCount(0);
  await expect(inspector.getByRole('combobox')).toHaveCount(0);
  await expect(
    inspector.getByRole('button', {
      name: /^(Edit list|Add condition|Remove condition \d+|Move condition \d+ (up|down)|Apply condition list|Cancel condition list)$/,
    }),
  ).toHaveCount(0);
  await inspector
    .locator('[data-input-path="conditions.1"] .typed-data-input')
    .getByRole('button')
    .click();
  await expect(page.getByTestId('condition-located')).toHaveText('shared');
  await expect(page.getByTestId('condition-commits')).toHaveText('0');
});

test('selection identity and readonly changes discard condition drafts before a later host flush', async ({
  page,
}) => {
  const list = conditionList(page, 'all');
  await expect(page.getByTestId('condition-shared-expression')).toHaveText('true');
  await list.getByRole('button', { name: 'Edit list', exact: true }).click();
  await list.getByRole('button', { name: 'Remove condition 2', exact: true }).click();
  await expect(list.locator('.condition-list__row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Select alias condition node' }).click();
  await expect(page.getByTestId('condition-selected-node')).toHaveText('alias');
  await expect(page.getByTestId('condition-shared-expression')).toHaveText('true');
  await expect(list.locator('.condition-list__row')).toHaveCount(3);
  await expect(list.getByRole('button', { name: 'Edit list', exact: true })).toBeVisible();
  await expect(list.getByRole('button', { name: 'Apply condition list', exact: true })).toHaveCount(
    0,
  );
  await page.getByRole('button', { name: 'Apply inspector drafts' }).click();
  await expect(page.getByTestId('condition-attempts')).toHaveText('0');

  await page.getByRole('checkbox', { name: 'Reject condition commits' }).check();
  await list.getByRole('button', { name: 'Edit list', exact: true }).click();
  await list.getByRole('button', { name: 'Remove condition 2', exact: true }).click();
  await list.getByRole('button', { name: 'Apply condition list', exact: true }).click();
  await expect(list.getByRole('alert')).toBeVisible();
  await expect(page.getByTestId('condition-attempts')).toHaveText('1');
  await page.getByRole('checkbox', { name: 'Read-only condition inspector' }).check();
  await expect(list.locator('.condition-list__row')).toHaveCount(3);
  await expect(list.getByRole('button', { name: 'Edit list', exact: true })).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Reject condition commits' }).uncheck();
  await page.getByRole('checkbox', { name: 'Read-only condition inspector' }).uncheck();
  await expect(list.getByRole('button', { name: 'Edit list', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Apply inspector drafts' }).click();
  await expect(page.getByTestId('condition-attempts')).toHaveText('1');
  await expect(page.getByTestId('condition-commits')).toHaveText('0');
  await expectConditions(page, 'all', originalConditions);
  await expect(page.getByTestId('condition-alias-value')).toHaveText(
    JSON.stringify({ kind: 'all', conditions: originalConditions }),
  );
});

test('list reorder resets an open index-addressed inline draft even when that slot retains its value', async ({
  page,
}) => {
  const inspector = page.getByTestId('condition-all');
  const first = inspector.locator('[data-input-path="conditions.0"] .typed-data-input');
  await first.getByRole('button', { name: /^Edit .* inline value$/ }).click();
  await choose(page, first.getByRole('combobox'), 'False');
  await expectConditions(page, 'all', originalConditions);
  // 第一项对象不变，只交换后两项；仅监听 input.value 无法清理这个旧草稿。
  await page.getByRole('button', { name: 'Reorder all conditions externally' }).click();
  await expect(page.getByTestId('condition-retained-slot')).toHaveText('true');
  await expectConditions(page, 'all', [conditionTrue, conditionFalse, conditionReference]);
  await expect(first.getByRole('combobox')).toHaveCount(0);
  await expect(first.getByRole('button', { name: /^Apply .* inline value$/ })).toHaveCount(0);
  await expect(first.locator('.typed-data-input__preview')).toHaveText('true');
  await expect(page.getByTestId('condition-commits')).toHaveText('1');

  // 重排后仍走真实引脚路径；取消断开保留来源，应用只替换当前消费者。
  const linked = inspector.locator('[data-input-path="conditions.2"] .typed-data-input');
  await linked.getByRole('button', { name: /^Edit .* inline value$/ }).click();
  const applyInline = linked.getByRole('button', { name: /^Apply .* inline value$/ });
  await expect(applyInline).toBeDisabled();
  await choose(page, linked.getByRole('combobox'), 'False');
  await linked.getByRole('button', { name: /^Cancel .* inline edit$/ }).click();
  await expectConditions(page, 'all', [conditionTrue, conditionFalse, conditionReference]);
  await linked.getByRole('button', { name: /^Edit .* inline value$/ }).click();
  await choose(page, linked.getByRole('combobox'), 'True');
  await applyInline.click();
  await expectConditions(page, 'all', [conditionTrue, conditionFalse, conditionTrue]);
  await expect(page.getByTestId('condition-commits')).toHaveText('2');
  await expect(page.getByTestId('condition-shared')).toHaveText(
    '{"type":"boolean","expression":{"kind":"combatActive"}}',
  );
  await page.getByRole('button', { name: 'Undo condition graph' }).click();
  await expectConditions(page, 'all', [conditionTrue, conditionFalse, conditionReference]);
  await page.getByRole('button', { name: 'Undo condition graph' }).click();
  await expectConditions(page, 'all', originalConditions);
  await expect(page.getByRole('button', { name: 'Undo condition graph' })).toBeDisabled();
});

test('tag collection custom paths preserve duplicates, cancel, and real history undo/redo', async ({
  page,
}) => {
  const panel = page.getByTestId('tag-collection');
  const state = panel.getByTestId('tag-state');
  await expect(state).toContainText('"tags":["Custom/One","Custom/One"]');
  await panel.getByRole('button', { name: 'Edit list', exact: true }).click();
  const custom = panel.getByRole('textbox', { name: 'Custom tag path', exact: true }).last();
  await custom.fill('Custom/Two');
  await panel.getByRole('button', { name: 'Use tag', exact: true }).last().click();
  await panel.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(state).not.toContainText('Custom/Two');
  await panel.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(state).not.toContainText('Custom/Two');
  await panel.getByRole('button', { name: 'Edit list', exact: true }).click();
  await panel.getByRole('button', { name: 'Set empty list', exact: true }).click();
  await panel.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(state).toContainText('"tags":[]');
  await panel.getByRole('button', { name: 'Undo tags', exact: true }).click();
  await expect(state).toContainText('"tags":["Custom/One","Custom/One"]');
  await panel.getByRole('button', { name: 'Redo tags', exact: true }).click();
  await expect(state).toContainText('"tags":[]');
});

test('tag collection Escape and readonly transitions discard local staged values', async ({
  page,
}) => {
  const panel = page.getByTestId('tag-collection');
  await panel.getByRole('button', { name: 'Edit list', exact: true }).click();
  await panel.getByRole('button', { name: 'Set empty list', exact: true }).click();
  await panel.locator('[data-string-collection]').press('Escape');
  await expect(panel.getByTestId('tag-state')).toContainText('Custom/One');
  await panel.getByRole('button', { name: 'Edit list', exact: true }).click();
  await panel.getByRole('button', { name: 'Set empty list', exact: true }).click();
  await panel.getByRole('button', { name: 'Toggle tags readonly', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Apply', exact: true })).toHaveCount(0);
  await expect(panel.getByTestId('tag-state')).toContainText('Custom/One');
});

test('structured queries stage before one node commit, keep rejection drafts, and support real history', async ({
  page,
}) => {
  const panel = page.getByTestId('structured-query');
  const state = panel.getByTestId('structured-state');
  await panel.getByRole('button', { name: 'Edit structure', exact: true }).click();
  const selectors = panel.locator('[data-structured-value]').getByRole('combobox');
  await choose(page, selectors.first(), 'All operators');
  await panel.getByRole('button', { name: 'Stage field', exact: true }).click();
  await expect(panel.getByTestId('structured-pending')).toHaveText('true');
  await expect(state).toContainText('lowestHealthRatioOperator');
  await panel.getByRole('checkbox', { name: 'Reject structured commits' }).check();
  await panel.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(panel.getByRole('alert')).toBeVisible();
  await expect(panel.getByTestId('structured-commits')).toHaveText('0');
  await panel.getByRole('checkbox', { name: 'Reject structured commits' }).uncheck();
  await panel.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(state).toContainText('allOperators');
  await expect(state).toContainText('"next":"sibling"');
  await expect(panel.getByTestId('structured-commits')).toHaveText('1');
  await panel.getByRole('button', { name: 'Undo structure', exact: true }).click();
  await expect(state).toContainText('lowestHealthRatioOperator');
  await panel.getByRole('button', { name: 'Redo structure', exact: true }).click();
  await expect(state).toContainText('allOperators');
});

test('structured local cancel, Escape and readonly transitions never submit the node', async ({
  page,
}) => {
  const panel = page.getByTestId('structured-query');
  await panel.getByRole('button', { name: 'Edit structure', exact: true }).click();
  await panel.getByRole('button', { name: 'Cancel', exact: true }).click();
  await panel.getByRole('button', { name: 'Edit structure', exact: true }).click();
  await panel.getByRole('button', { name: 'Cancel', exact: true }).press('Escape');
  await expect(panel.getByRole('button', { name: 'Stage field', exact: true })).toHaveCount(0);
  await panel.getByRole('button', { name: 'Edit structure', exact: true }).click();
  await panel.getByRole('checkbox', { name: 'Read-only structured inspector' }).check();
  await expect(panel.getByRole('button', { name: 'Edit structure', exact: true })).toHaveCount(0);
  await expect(panel.getByTestId('structured-commits')).toHaveText('0');
  await expect(panel.getByTestId('structured-pending')).toHaveText('false');
});

test('weighted curve staging preserves infinite tangents and original weights through real undo and redo', async ({
  page,
}) => {
  const panel = page.getByTestId('time-scale-curve-panel');
  const state = panel.getByTestId('curve-state');
  await expect(state).toContainText('in=Infinity out=-Infinity mode=0 weights=-2,4');
  await expect(panel.locator('[data-curve-preview]')).toBeVisible();
  await panel.getByRole('button', { name: 'Edit curve', exact: true }).click();
  await panel.getByRole('spinbutton', { name: '1: Out weight', exact: true }).fill('7');
  await panel.getByRole('button', { name: 'Stage field', exact: true }).click();
  await expect(state).toContainText('weights=-2,4');
  await panel.getByRole('button', { name: 'Edit curve', exact: true }).click();
  await panel.getByRole('button', { name: 'Stage field', exact: true }).click();
  await expect(panel.getByTestId('curve-pending')).toHaveText('true');
  await panel.getByRole('checkbox', { name: 'Reject curve commits' }).check();
  await panel.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(panel.getByTestId('curve-commits')).toHaveText('0');
  await panel.getByRole('checkbox', { name: 'Reject curve commits' }).uncheck();
  await panel.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(state).toContainText('in=Infinity out=-Infinity mode=0 weights=-2,7');
  await panel.getByRole('button', { name: 'Undo curve', exact: true }).click();
  await expect(state).toContainText('weights=-2,4');
  await panel.getByRole('button', { name: 'Redo curve', exact: true }).click();
  await expect(state).toContainText('weights=-2,7');
});

test('curve branch switching, invalid ordering, cancel and readonly never publish local edits', async ({
  page,
}) => {
  const panel = page.getByTestId('time-scale-curve-panel');
  await panel.getByRole('button', { name: 'Edit curve', exact: true }).click();
  await panel.getByRole('spinbutton', { name: '2: Progress', exact: true }).fill('0');
  await panel.getByRole('button', { name: 'Stage field', exact: true }).click();
  await expect(panel.getByRole('alert')).toContainText('strictly increasing');
  await expect(panel.getByRole('spinbutton', { name: '2: Progress', exact: true })).toHaveValue(
    '0',
  );
  await panel.getByRole('button', { name: 'Cancel', exact: true }).click();
  await panel.getByRole('button', { name: 'Edit curve', exact: true }).click();
  await choose(page, panel.getByRole('combobox').first(), 'Named curve');
  await expect(panel.getByTestId('curve-state')).toContainText('in=Infinity');
  await panel.getByRole('button', { name: 'Cancel', exact: true }).press('Escape');
  await expect(panel.getByTestId('curve-pending')).toHaveText('false');
  await panel.getByRole('button', { name: 'Edit curve', exact: true }).click();
  await panel.getByRole('checkbox', { name: 'Read-only curve inspector' }).check();
  await expect(panel.getByRole('button', { name: 'Stage field', exact: true })).toHaveCount(0);
  await expect(panel.getByTestId('curve-commits')).toHaveText('0');
});

test('native GlobalBuff ID queries preserve exact unknown IDs, validate empty drafts and retain history', async ({
  page,
}) => {
  const panel = page.getByTestId('native-id-query');
  const collection = panel.locator('[data-collection-kind="nativeId"]');
  const state = panel.getByTestId('native-id-state');
  await expect(collection.locator('[data-reference-kind]')).toHaveCount(0);
  await collection.getByRole('button', { name: 'Edit list', exact: true }).click();
  await collection
    .getByRole('textbox', { name: 'New entry', exact: true })
    .fill(' unknown with spaces ');
  await collection.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(state).not.toContainText(' unknown with spaces ');
  await collection.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(state).toContainText('["unknown","unknown"," unknown with spaces "]');
  await expect(panel.getByTestId('native-id-commits')).toHaveText('1');
  await panel.getByRole('button', { name: 'Undo native IDs', exact: true }).click();
  await expect(state).not.toContainText(' unknown with spaces ');
  await panel.getByRole('button', { name: 'Redo native IDs', exact: true }).click();
  await expect(state).toContainText(' unknown with spaces ');
  await collection.getByRole('button', { name: 'Edit list', exact: true }).click();
  await collection.getByRole('button', { name: 'Set empty list', exact: true }).click();
  await collection.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(collection.getByRole('alert')).toContainText('at least one nonempty ID');
  await expect(panel.getByTestId('native-id-commits')).toHaveText('1');
  await collection.getByRole('button', { name: 'Cancel', exact: true }).click();
  await collection.getByRole('button', { name: 'Edit list', exact: true }).click();
  await collection.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(panel.getByTestId('native-id-commits')).toHaveText('1');
  await panel.getByRole('checkbox', { name: 'Readonly native IDs' }).check();
  await expect(collection.getByRole('button', { name: 'Edit list', exact: true })).toHaveCount(0);
});

for (const field of ['instantAttributeModifiers', 'instantDamageScaleModifiers']) {
  test(`graph ${field} stages a typed operand atomically, retains shared sources and supports undo/readonly`, async ({
    page,
  }) => {
    const panel = page.getByTestId(`graph-operand-${field}`);
    const structure = panel.locator(`[data-structured-path="parameters.${field}"]`);
    await structure.getByRole('button', { name: 'Edit structure', exact: true }).click();
    // A row may start collapsed; opening its existing details retains the field path.
    for (const details of await structure.locator('details').all())
      if ((await details.getAttribute('open')) === null)
        await details.locator(':scope > summary').click();
    const number = structure.locator('input[type="number"]').last();
    await number.fill('');
    await structure.getByRole('button', { name: 'Stage field', exact: true }).click();
    await expect(structure.getByRole('alert')).toBeVisible();
    await expect(panel.getByTestId('graph-operand-commits')).toHaveText('0');
    await number.fill('4');
    await structure.getByRole('button', { name: 'Stage field', exact: true }).click();
    await expect(panel.getByTestId('graph-operand-commits')).toHaveText('0');
    await panel.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(panel.getByTestId('graph-operand-commits')).toHaveText('1');
    await expect(panel.getByTestId('graph-operand-state')).toContainText('"value":4');
    await expect(panel.getByTestId('graph-operand-state')).toContainText('"nodeId":"shared"');
    await panel.getByRole('button', { name: 'Undo modifiers' }).click();
    await expect(panel.getByTestId('graph-operand-state')).toContainText('"value":1');
    await panel.getByRole('button', { name: 'Redo modifiers' }).click();
    await panel.getByRole('checkbox', { name: 'Readonly graph operands' }).check();
    await expect(
      structure.getByRole('button', { name: 'Edit structure', exact: true }),
    ).toHaveCount(0);
    await expect(structure.locator('textarea')).toHaveCount(0);
  });
}

for (const field of ['keywordEnhancements', 'onActionEndBuffs', 'items']) {
  test(`nested ${field} repairs and stages typed values through real graph history`, async ({
    page,
  }) => {
    const panel = page.getByTestId(`graph-operand-${field}`);
    const structure = panel.locator(`[data-structured-path="parameters.${field}"]`);
    await structure.getByRole('button', { name: 'Edit structure', exact: true }).click();
    for (const details of await structure.locator('details').all())
      if ((await details.getAttribute('open')) === null)
        await details.locator(':scope > summary').click();
    const mapping = structure.locator('[data-mapping-destination="exitBuff"]');
    if (field === 'onActionEndBuffs')
      await mapping.getByRole('button', { name: 'Edit mappings', exact: true }).click();
    const number = structure.locator('[data-mapping-value="operand"] input[type="number"]').last();
    await number.fill('');
    if (field === 'onActionEndBuffs') {
      await mapping.getByRole('button', { name: 'Apply mappings', exact: true }).click();
      await expect(mapping.getByRole('alert')).toBeVisible();
    } else {
      await structure.getByRole('button', { name: 'Stage field', exact: true }).click();
      await expect(structure.getByRole('alert')).toBeVisible();
    }
    await number.fill('3');
    if (field === 'onActionEndBuffs')
      await mapping.getByRole('button', { name: 'Apply mappings', exact: true }).click();
    await structure.getByRole('button', { name: 'Stage field', exact: true }).click();
    await expect(panel.getByTestId('graph-operand-commits')).toHaveText('0');
    await panel.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(panel.getByTestId('graph-operand-commits')).toHaveText('1');
    await expect(panel.getByTestId('graph-operand-state')).toContainText('"value":3');
    await expect(panel.getByTestId('graph-operand-state')).toContainText('"nodeId":"shared"');
    await panel.getByRole('button', { name: 'Undo modifiers' }).click();
    await expect(panel.getByTestId('graph-operand-state')).toContainText('"value":1');
    await panel.getByRole('button', { name: 'Redo modifiers' }).click();
    await panel.getByRole('checkbox', { name: 'Readonly graph operands' }).check();
    await expect(
      structure.getByRole('button', { name: 'Edit structure', exact: true }),
    ).toHaveCount(0);
    await expect(structure.locator('textarea')).toHaveCount(0);
  });
}

test('GlobalBuff definition uses its local board and rejects removing a required numeric override', async ({
  page,
}) => {
  const panel = page.getByTestId('global-buff-definition');
  const structure = panel.locator('[data-structured-path="parameters.definition"]');
  await structure.getByRole('button', { name: 'Edit structure', exact: true }).click();
  for (const details of await structure.locator('details').all())
    if ((await details.getAttribute('open')) === null)
      await details.locator(':scope > summary').click();
  const child = structure.locator('[data-mapping-destination="globalBuffChild"]');
  await child.getByRole('button', { name: 'Edit mappings', exact: true }).click();
  await child.locator('input[type="number"]').fill('4');
  await child.getByRole('button', { name: 'Apply mappings', exact: true }).click();
  await structure.getByRole('button', { name: 'Stage field', exact: true }).click();
  await panel.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(panel.getByTestId('graph-operand-commits')).toHaveText('1');
  await expect(panel.getByTestId('graph-operand-state')).toContainText('"value":4');
  const overrides = panel.locator('[data-mapping-destination="globalBuff"]');
  await overrides.getByRole('button', { name: 'Edit mappings', exact: true }).click();
  await overrides.getByRole('button', { name: 'Remove mapping ratio', exact: true }).click();
  await overrides.getByRole('button', { name: 'Apply mappings', exact: true }).click();
  await expect(overrides.getByRole('alert')).toBeVisible();
  await expect(panel.getByTestId('graph-operand-commits')).toHaveText('1');
  await overrides.getByRole('button', { name: 'Cancel', exact: true }).click();
  await panel.getByRole('button', { name: 'Undo GlobalBuff' }).click();
  await expect(panel.getByTestId('graph-operand-state')).toContainText('"value":3');
  await panel.getByRole('button', { name: 'Redo GlobalBuff' }).click();
  await panel.getByRole('checkbox', { name: 'Readonly GlobalBuff' }).check();
  await expect(structure.getByRole('button', { name: 'Edit structure', exact: true })).toHaveCount(
    0,
  );
  await expect(structure.locator('textarea')).toHaveCount(0);
});

for (const kind of ['switch', 'listenForCombatEvents']) {
  test(`${kind} rows preserve shared targets and require explicit disconnection before removal`, async ({
    page,
  }) => {
    const panel = page.getByTestId(`sequence-${kind}`);
    const structure = panel.locator('[data-structured-value]');
    await structure.getByRole('button', { name: 'Edit structure', exact: true }).click();
    await structure.getByRole('button', { name: 'Delete', exact: true }).first().click();
    await structure.getByRole('button', { name: 'Stage field', exact: true }).click();
    await expect(structure.getByRole('alert')).toBeVisible();
    await expect(panel.getByTestId('sequence-commits')).toHaveText('0');
    await structure.getByRole('button', { name: 'Cancel', exact: true }).click();
    await panel.getByRole('button', { name: 'Disconnect first sequence', exact: true }).click();
    // The listener condition connection remains separately protected after its execution port disconnects.
    await expect(panel.getByTestId('sequence-state')).toContainText('"$sequence":null');
    await expect(panel.getByTestId('sequence-state')).toContainText('"target":{"action"');
    await panel.getByRole('button', { name: 'Undo branches', exact: true }).click();
    await expect(panel.getByTestId('sequence-commits')).toHaveText('1');
    await panel.getByRole('button', { name: 'Redo branches', exact: true }).click();
    await panel.getByRole('checkbox', { name: 'Readonly branches' }).check();
    await expect(
      structure.getByRole('button', { name: 'Edit structure', exact: true }),
    ).toHaveCount(0);
    await expect(structure.locator('textarea')).toHaveCount(0);
  });
}

test('spawn field preserves unstaged work and opens an independent child resource with shared history', async ({
  page,
}) => {
  const panel = page.getByTestId('spawn-resource');
  const structure = panel.locator('[data-structured-value]');
  await structure.getByRole('button', { name: 'Edit structure', exact: true }).click();
  await expect(
    structure.getByRole('button', { name: 'Open action graph', exact: true }),
  ).toBeDisabled();
  await structure.getByRole('button', { name: 'Cancel', exact: true }).click();
  await structure.getByRole('button', { name: 'Open action graph', exact: true }).click();
  await expect(panel.getByTestId('spawn-resource-path')).toContainText('childSkill');
  await panel.getByRole('button', { name: 'Edit child metadata', exact: true }).click();
  await expect(panel.getByTestId('spawn-resource-state')).toContainText('edited-child');
  await panel.getByRole('button', { name: 'Back to spawn', exact: true }).click();
  await expect(panel.getByTestId('spawn-resource-path')).toHaveText('["dodgeSkill"]');
  await panel.getByRole('button', { name: 'Undo spawn', exact: true }).click();
  await expect(panel.getByTestId('spawn-resource-state')).not.toContainText('edited-child');
  await panel.getByRole('button', { name: 'Redo spawn', exact: true }).click();
  await panel.getByRole('checkbox', { name: 'Readonly spawn' }).check();
  await expect(structure.getByRole('button', { name: 'Edit structure', exact: true })).toHaveCount(
    0,
  );
  await expect(
    structure.getByRole('button', { name: 'Open action graph', exact: true }),
  ).toBeEnabled();
  await expect(structure.locator('textarea')).toHaveCount(0);
});

test('string pins share an expression, preserve exact literals and undo without deleting the source', async ({
  page,
}) => {
  const host = page.getByTestId('string-graph');
  const pin = host.locator('[data-input-path="parameters.markerId"]');
  await expect(pin).toHaveAttribute('data-input-type', 'string');
  // Unconnected inspector literals have one semantic editor, not a competing raw editor.
  await expect(pin.getByRole('button', { name: /Edit/ })).toHaveCount(0);
  await pin.locator('.el-select').click();
  await expect(page.getByRole('option', { name: /number/ })).toHaveCount(0);
  await page.getByRole('option', { name: 'marker', exact: true }).click();
  await expect(host.getByTestId('string-graph-state')).toContainText(
    '"markerId":{"kind":"stringNode","nodeId":"shared"}',
  );
  await pin.getByRole('button', { name: /marker/ }).click();
  await expect(host.getByTestId('string-graph-located')).toHaveText('shared');
  await host.getByRole('button', { name: 'Delete string source', exact: true }).click();
  await expect(host.getByRole('alert')).toBeVisible();
  await pin.getByRole('button', { name: /Edit/ }).click();
  await pin.getByRole('textbox').fill('  exact replacement  ');
  await pin.getByRole('button', { name: /Cancel/ }).click();
  await expect(host.getByTestId('string-graph-commits')).toHaveText('1');
  await pin.getByRole('button', { name: /Edit/ }).click();
  await pin.getByRole('textbox').fill('  exact replacement  ');
  await pin.getByRole('button', { name: /Apply/ }).click();
  await expect(host.getByTestId('string-graph-state')).toContainText(
    '"markerId":"  exact replacement  "',
  );
  await expect(host.getByTestId('string-graph-state')).toContainText(
    '"second":{"action":{"kind":"createTimedMarker","parameters":{"target":"caster","markerId":{"kind":"stringNode","nodeId":"shared"}',
  );
  await host.getByRole('button', { name: 'Undo string graph', exact: true }).click();
  await expect(pin.getByRole('button', { name: /marker/ })).toBeVisible();
  await host.getByRole('button', { name: 'Redo string graph', exact: true }).click();
  await expect(host.getByTestId('string-graph-state')).toContainText(
    '"markerId":"  exact replacement  "',
  );
  await host.getByRole('checkbox', { name: 'Readonly string graph' }).check();
  await expect(pin.getByRole('combobox')).toHaveCount(0);
});
