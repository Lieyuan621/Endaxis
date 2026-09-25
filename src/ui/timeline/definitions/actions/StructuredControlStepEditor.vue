<script setup lang="ts">
import type {
  CombatStepForKind,
  CombatStepParameters,
} from '../../../../../packages/game-data-contract/src/actions';
import type {
  ActionValueOperand,
  CombatStepDefinition,
  LevelValues,
} from '../../../../core/game-data/operatorDefinition';
import ActionValueAssignmentMapEditor from './ActionValueAssignmentMapEditor.vue';
import ActionValueOperandEditor from './ActionValueOperandEditor.vue';
import SkillBlackboardEditor from '../skills/SkillBlackboardEditor.vue';
import {
  NATIVE_SKILL_TYPES,
  type NativeSkillType,
} from '../../../../core/game-data/operatorDefinition';

type Step = CombatStepForKind<
  | 'createSpatialPointTargets'
  | 'jumpTimeline'
  | 'finishTimeline'
  | 'withActionBlackboardScope'
  | 'repeatByActionValue'
  | 'launchProjectile'
>;
const props = defineProps<{ step: Step; skillLevel: number }>();
const emit = defineEmits<{ update: [step: CombatStepDefinition] }>();
const labels = {
  constant: '常量',
  blackboard: '动作黑板',
  blackboardKey: '黑板键',
  constantValue: '常量值',
};

function setScopeParameters(
  parameters: Readonly<CombatStepParameters['withActionBlackboardScope']>,
): void {
  if (props.step.kind === 'withActionBlackboardScope')
    emit('update', { ...props.step, parameters });
}

function setOptionalLevelValues(
  field: 'entityInitialValues',
  values: Readonly<Record<string, LevelValues>>,
): void {
  if (props.step.kind !== 'withActionBlackboardScope') return;
  const parameters = { ...props.step.parameters };
  if (Object.keys(values).length === 0) delete parameters[field];
  else parameters[field] = values;
  setScopeParameters(parameters);
}

function setEntityAssignments(values: Readonly<Record<string, ActionValueOperand>>): void {
  if (props.step.kind !== 'withActionBlackboardScope') return;
  const parameters = { ...props.step.parameters };
  if (Object.keys(values).length === 0) delete parameters.entityAssignments;
  else parameters.entityAssignments = values;
  setScopeParameters(parameters);
}

function setShareParent(event: Event): void {
  if (props.step.kind !== 'withActionBlackboardScope') return;
  const enabled = (event.target as HTMLInputElement).checked;
  if (enabled) {
    const {
      entityInitialValues: _initial,
      entityAssignments: _assignments,
      ...remaining
    } = props.step.parameters;
    setScopeParameters({
      ...remaining,
      shareParentBlackboard: true,
      initialValues: {},
      inheritParent: true,
    });
  } else {
    const parameters = { ...props.step.parameters };
    delete parameters.shareParentBlackboard;
    setScopeParameters(parameters);
  }
}
</script>

<template>
  <div class="structured-control">
    <template v-if="step.kind === 'createSpatialPointTargets'">
      <label
        ><span>写入 Context 键</span
        ><input
          type="text"
          :value="step.parameters.saveToContextKey"
          @input="
            emit('update', {
              ...step,
              parameters: {
                ...step.parameters,
                saveToContextKey: ($event.target as HTMLInputElement).value,
              },
            })
          "
      /></label>
      <label
        ><span>临时点身份数量</span
        ><ActionValueOperandEditor
          :value="step.parameters.count"
          :labels="labels"
          @update="emit('update', { ...step, parameters: { ...step.parameters, count: $event } })"
      /></label>
      <p>零空间模型只保存数量和稳定临时身份，不编辑坐标、半径或距离排序。</p>
    </template>
    <template v-else-if="step.kind === 'jumpTimeline'">
      <label
        ><span>跳转到宿主局部帧</span
        ><input
          type="number"
          min="0"
          step="1"
          :value="step.parameters.destinationFrame"
          @input="
            emit('update', {
              ...step,
              parameters: {
                ...step.parameters,
                destinationFrame: Math.max(
                  0,
                  Math.round(Number(($event.target as HTMLInputElement).value)),
                ),
              },
            })
          "
      /></label>
      <p>可选判断条件从左侧导图添加和选择。</p>
    </template>
    <p v-else-if="step.kind === 'finishTimeline'">
      此步骤没有参数；执行时立即结束当前宿主的局部时间轴。
    </p>
    <template v-else-if="step.kind === 'repeatByActionValue'">
      <label
        ><span>同步执行次数</span
        ><ActionValueOperandEditor
          :value="step.parameters.count"
          :labels="labels"
          @update="emit('update', { ...step, parameters: { ...step.parameters, count: $event } })"
      /></label>
      <p>在左侧循环节点上添加动作，直接选择其下的动作编辑；每轮创建新的子步骤实例。</p>
    </template>
    <template v-else-if="step.kind === 'launchProjectile'">
      <p>一次发射对应一个投射物；在各事件回调下编辑完整技能。</p>
      <label v-if="typeof step.parameters.finish === 'number'"
        ><span>最长存活时间（秒）</span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          :value="step.parameters.finish"
          @input="
            emit('update', {
              ...step,
              parameters: {
                ...step.parameters,
                finish: Math.max(0.01, Number(($event.target as HTMLInputElement).value)),
              },
            })
          "
        />
      </label>
      <label
        ><span>结束后回收等待（秒）</span>
        <input
          type="number"
          min="0"
          step="0.01"
          :value="step.parameters.recycleDelaySeconds ?? 0"
          @input="
            emit('update', {
              ...step,
              parameters: {
                ...step.parameters,
                recycleDelaySeconds: Math.max(0, Number(($event.target as HTMLInputElement).value)),
              },
            })
          "
        />
      </label>
      <label v-for="(callback, index) in step.callbacks" :key="index">
        <span>{{ callback.event }} · {{ callback.skill.skillId }} 原生技能类型</span>
        <select
          :value="callback.skill.nativeSkillType"
          @change="
            emit('update', {
              ...step,
              callbacks: step.callbacks.map((item, i) =>
                i === index
                  ? {
                      ...item,
                      skill: {
                        ...item.skill,
                        nativeSkillType: ($event.target as HTMLSelectElement)
                          .value as NativeSkillType,
                      },
                    }
                  : item,
              ),
            })
          "
        >
          <option v-for="type in NATIVE_SKILL_TYPES" :key="type" :value="type">{{ type }}</option>
        </select>
      </label>
    </template>
    <template v-else>
      <label
        ><span>作用域稳定键</span
        ><input
          type="text"
          :value="step.parameters.scopeKey"
          @input="
            setScopeParameters({
              ...step.parameters,
              scopeKey: ($event.target as HTMLInputElement).value,
            })
          "
      /></label>
      <label
        ><span>作用域寿命</span
        ><select
          :value="step.parameters.lifetime ?? 'parent'"
          @change="
            setScopeParameters({
              ...step.parameters,
              lifetime: ($event.target as HTMLSelectElement).value as 'parent' | 'execution',
            })
          "
        >
          <option value="parent">父动作</option>
          <option value="execution">本次执行</option>
        </select></label
      >
      <label class="structured-control__toggle"
        ><input
          type="checkbox"
          :checked="step.parameters.alwaysNext === true"
          @change="
            setScopeParameters({
              ...step.parameters,
              alwaysNext: ($event.target as HTMLInputElement).checked,
            })
          "
        />忽略子动作序列的短路结果</label
      >
      <label class="structured-control__toggle"
        ><input
          type="checkbox"
          :checked="step.parameters.shareParentBlackboard === true"
          @change="setShareParent"
        />直接共享父动作黑板</label
      >
      <label class="structured-control__toggle"
        ><input
          type="checkbox"
          :checked="step.parameters.inheritParent"
          :disabled="step.parameters.shareParentBlackboard === true"
          @change="
            setScopeParameters({
              ...step.parameters,
              inheritParent: ($event.target as HTMLInputElement).checked,
            })
          "
        />创建时继承父动作黑板</label
      >
      <SkillBlackboardEditor
        title="子动作初始黑板"
        description="本次子 SkillData 调用创建时使用的 direct blackboard 初值。"
        :blackboard="step.parameters.initialValues"
        :skill-level="skillLevel"
        @update="setScopeParameters({ ...step.parameters, initialValues: $event })"
      />
      <template v-if="step.parameters.shareParentBlackboard !== true">
        <SkillBlackboardEditor
          title="独立逻辑宿主实体黑板"
          description="只有创建独立逻辑宿主时使用；键必须以 EntityBB_ 开头。"
          new-key-prefix="EntityBB_value"
          :blackboard="step.parameters.entityInitialValues ?? {}"
          :skill-level="skillLevel"
          @update="setOptionalLevelValues('entityInitialValues', $event)"
        />
        <ActionValueAssignmentMapEditor
          :assignments="step.parameters.entityAssignments ?? {}"
          title="父动作值写入独立实体黑板（键必须以 EntityBB_ 开头）"
          new-key-prefix="EntityBB_value"
          @update="setEntityAssignments"
        />
      </template>
      <p>在左侧当前节点上添加动作，直接选择其下的动作编辑。</p>
    </template>
  </div>
</template>

<style scoped>
.structured-control {
  min-width: 0;
  display: grid;
  gap: 10px;
}
.structured-control > label {
  display: grid;
  grid-template-columns: minmax(150px, 200px) minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}
.structured-control .structured-control__toggle {
  display: flex;
}
.structured-control input,
.structured-control select {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}
.structured-control p {
  margin: 0;
  color: var(--ea-fg-muted);
}
</style>
