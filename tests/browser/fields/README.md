# Field component browser tests

Run `npm run test:browser:fields` after installing dependencies and the supported
Playwright Chromium browser (`npx playwright install chromium`). The dedicated
configuration starts Vite on port 4188 and serves this test-only HTML entry. It
imports the real `DefinitionField`, `DefinitionValueCreator`, and
`NodeInspectorFields` components; no production route or browser-global hook is
added. The ordinary application browser suite excludes this component spec.

Optional environment variables:

- `PLAYWRIGHT_FIELDS_BASE_URL`: an already running Vite origin serving this checkout
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE`: a supported local Chromium executable path

Coverage includes union/optional/array/record reference identity, empty and absent
catalogs, unresolved values, creator cancellation and fresh drafts, optional draft
restoration, rejected node submissions, and Escape discard. P2 adds strict catalog
fixtures, duplicate/invisible identity diagnostics, read-only target navigation,
and submit-time revalidation that retains stale creator drafts. P3 adds atomic string operand literal/read switching, cancellation, and literal draft revalidation after a catalog changes. These browser assertions remain unexecuted in the authoring environment. Host undo checks only
immutable state round-tripping in this fixture. It is **not** application command
history, persistence, or full end-to-end undo verification.

`npm run type-check:browser` validates the test/config TypeScript. `npm run
test:browser:fields -- --list` validates test discovery. Neither runs a browser or
establishes that the assertions pass. The harness Vue entry must also compile.

The initial authoring environment could compile/discover this suite, but could
not run Chromium: both ordinary and approved elevated launch attempts failed at
process-singleton `socket()` with `Operation not permitted`. Its supported cloud
browser separately blocked the loopback harness URL with `ERR_BLOCKED_BY_CLIENT`.
Do not treat those infrastructure failures as a passing browser result; run the
suite in an authorized browser-capable environment.

P4.1 adds typed string collections and custom GameplayTag path search. The array
fixture now stages edits before Apply. The tag fixture tests duplicate retention,
empty-list versus cancel, Escape, readonly transitions, and real
`DefinitionDraftSession` undo/redo. It is still a component harness, not full
application persistence. These additional browser assertions remain unexecuted
in the restricted authoring environment.

P4.2 adds a real structured query inspector with field staging, node Apply,
rejected commit retention, sibling preservation, cancel/Escape/readonly, and
`DefinitionDraftSession` undo/redo. Browser discovery and harness compilation do
not execute these assertions; actual interaction still needs an authorized
browser-capable environment.

P4.3 adds the production curve control with finite/positive-infinite/negative-infinite
tangents, original weights, field staging, unchanged restaging, rejected node
commits, real draft graph undo/redo, branch cancel/Escape, invalid ordering and
readonly reset. The two new assertions remain **UNRUN** in the restricted
authoring environment. Project-serializer round trips and graph-command history
are verified by unit tests, not claimed as browser persistence coverage.

P4.4a adds a generated recursive Buff-condition fixture in a real WorkspaceAssetSession.
It checks bounded typed-subtree focus, Back, readonly navigation and reopening.
The scenario is **UNRUN**; browser discovery/types/harness compilation are separate
from interaction. Real deep edit undo/redo and project roundtrip are unit-tested.

P4.4b1 adds the open native GlobalBuff ID query list using real validated resource
commands and draft history. It checks unknown IDs, exact spaces/duplicates,
empty-list rejection, cancel/reopen, readonly and undo/redo without a catalog.
The new browser scenario remains **UNRUN**. Field/containing-value creation and
roundtrip are unit-tested; no whole-node creation wizard was added.

P4.4b2 adds a real equipment inline-condition resource fixture with condition-level
staging, numeric operands, invalid drafts, cancel, readonly and workspace undo/redo.
This browser assertion remains **UNRUN**. Seven generated definition hosts have
unit-tested creation and WorkspaceAssetSession save/serialize/parse roundtrips;
four skill availability/legacy-handler authoring entries remain deferred.

P4.4c1 新增两个 dealDamage modifier 容器场景，GraphOperandHarness 使用实际 ActionNodeInspector/useResourceGraphEditor/DefinitionDraftSession/replaceResourceNodeAction，覆盖非法数字原位修正、Stage/整节点 Apply、共享来源保留、undo/redo 和 readonly。fixture/type/discovery/build 与实际执行分别报告；本环境实际浏览器仍 UNRUN，不尝试绕过既有启动限制。

P4.4c2 adds keywordEnhancements, onActionEndBuffs and readSkillSettingData.items to the same real graph-host harness. Scenarios cover invalid operand repair, nested mapping acceptance, atomic Stage/Apply, shared source preservation, undo/redo and readonly controls. Actual browser execution remains **UNRUN** under the established environment restriction; discovery/types/harness compilation are not interaction passes.

P4.4c3 adds GlobalBuffHarness with the real graph editor, definition-local values, a shared graph number source, atomic field/node staging, rejection when removing a required numeric creation override, undo/redo and readonly. Actual browser execution remains **UNRUN**; compile/discovery checks cannot certify interaction behavior.

P4.4c4 adds two BranchSequenceHarness scenes using the real inspector, resource graph
commands and history. Both reject row deletion while execution/data references remain,
show explicit sequence disconnection and shared-target retention, then undo/redo and
readonly. Rendered non-browser tests independently exercise row creation, staging and
canvas stale-event rejection across both hosts. Actual browser scenarios remain **UNRUN**;
discovery/types/template or production-harness builds are not interaction passes.

P4.4c5 adds SpawnResourceHarness with a real WorkspaceAssetSession and workspace graph
editor. The field’s resource button is disabled while a structure draft is active, then
opens the actual independent child graph; child edits, Back, undo/redo and readonly
navigation share the existing session. Actual browser execution remains **UNRUN**;
source/template compilation and scenario discovery do not certify browser interaction.

P5 adds a real resource graph string-input fixture using the existing immutable
host and draft history. It covers type-filtered source selection, one inline
semantic editor, source navigation, connected-source deletion rejection, exact
literal replacement/cancel, undo/redo and readonly. The new assertion is **UNRUN**
in this environment; discovery, TypeScript and harness compilation do not count
as interaction. Official project serialization and compiler/runtime checkpoint
coverage are separate unit tests.
