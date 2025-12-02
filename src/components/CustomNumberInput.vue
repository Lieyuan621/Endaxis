<script setup>
import { computed, ref } from 'vue'
import { ElIcon } from 'element-plus'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: -Infinity },
  max: { type: Number, default: Infinity },
  step: { type: Number, default: 1 },
  enableHover: { type: Boolean, default: true },
  activeColor: { type: String, default: null },
  borderColor: { type: String, default: null },
  maxWidth: { type: String, default: null },
  textAlign: { type: String, default: 'center' }
})

const emit = defineEmits(['update:modelValue'])

const isMinDisabled = computed(() => props.modelValue <= props.min)
const isMaxDisabled = computed(() => props.modelValue >= props.max)

// === Color Logic ===
function lightenHex(hex, percent) {
  if (!hex) return null;
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  const p = percent / 100;
  r = Math.round(Math.min(255, r + (255 - r) * p));
  g = Math.round(Math.min(255, g + (255 - g) * p));
  b = Math.round(Math.min(255, b + (255 - b) * p));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// === Dynamic Classes & Styles ===
const containerClass = computed(() => ({ 'has-hover': props.enableHover }))

const containerStyle = computed(() => {
  const style = {};
  if (props.maxWidth) {
    style.maxWidth = props.maxWidth;
  }
  if (props.borderColor) {
    style['--default-border-color'] = props.borderColor;
    style['--text-color'] = props.borderColor;
    style['--hover-border-color'] = lightenHex(props.borderColor, 30) || '#999';
  }
  if (props.activeColor) {
    style['--active-color'] = props.activeColor;
  }
  return style;
});

const inputStyle = computed(() => ({
  textAlign: props.textAlign
}))

// === Continuous Change Logic ===
const longPressTimer = ref(null)
const speedUpTimer = ref(null)

function startChange(changeFn) {
  stopChange();
  longPressTimer.value = setTimeout(() => {
    speedUpTimer.value = setInterval(() => {
      changeFn();
    }, 80);
  }, 400);
}

function stopChange() {
  clearTimeout(longPressTimer.value);
  clearInterval(speedUpTimer.value);
  longPressTimer.value = null;
  speedUpTimer.value = null;
}

// === Value Update Logic ===
function getPrecision(num) {
  const str = String(num);
  return str.includes('.') ? str.split('.')[1].length : 0;
}

function updateValue(newValue, fromInput = false) {
  let finalValue
  if (fromInput && typeof newValue === 'string') {
      finalValue = parseFloat(newValue)
  } else {
      const precision = Math.max(getPrecision(props.modelValue), getPrecision(props.step));
      finalValue = parseFloat(newValue.toFixed(precision));
  }
  if(isNaN(finalValue)) return
  finalValue = Math.max(props.min, Math.min(props.max, finalValue));
  emit('update:modelValue', finalValue);
}

function handleInput(event) {
  let value = event.target.value;
  // Allow only numbers and a single decimal point
  const regex = /^-?\d*\.?\d*$/;
  if (regex.test(value)) {
    emit('update:modelValue', value);
  } else {
    // If invalid char, revert to old value immediately
    event.target.value = props.modelValue;
  }
}

function handleBlur(event) {
    let value = parseFloat(event.target.value)
    if(isNaN(value)) {
        value = props.min !== -Infinity ? props.min : 0
    }
    updateValue(value)
}


function decrement() {
  if (isMinDisabled.value) {
    stopChange();
    return;
  }
  updateValue(props.modelValue - props.step);
}

function increment() {
  if (isMaxDisabled.value) {
    stopChange();
    return;
  }
  updateValue(props.modelValue + props.step);
}
</script>

<template>
  <div
      class="custom-number-input"
      :class="containerClass"
      :style="containerStyle"
      tabindex="0"
  >
    <div v-if="$slots.prepend" class="prepend-slot"><slot name="prepend"></slot></div>
    <input
        type="text"
        class="value-display"
        :style="inputStyle"
        :value="modelValue"
        @input="handleInput"
        @blur="handleBlur"
    />
    <div class="controls-stack">
      <button
          class="control-btn increment"
          @mousedown="startChange(increment)"
          @mouseup="stopChange"
          @mouseleave="stopChange"
          @click.stop="increment"
          :disabled="isMaxDisabled"
      >
        <el-icon><ArrowUp /></el-icon>
      </button>
      <button
          class="control-btn decrement"
          @mousedown="startChange(decrement)"
          @mouseup="stopChange"
          @mouseleave="stopChange"
          @click.stop="decrement"
          :disabled="isMinDisabled"
      >
        <el-icon><ArrowDown /></el-icon>
      </button>
    </div>
  </div>
</template>

<style scoped>
.custom-number-input {
  --default-border-color: #555;
  --hover-border-color: #999;
  --active-color: var(--default-border-color);
  --text-color: white;

  display: flex;
  align-items: center;
  background-color: #222;
  border: 1px solid var(--default-border-color);
  border-radius: 4px;
  overflow: hidden;
  height: 28px;
  box-sizing: border-box;
  transition: border-color 0.2s;
  width: 100%;
}

.custom-number-input.has-hover:hover {
  border-color: var(--hover-border-color);
}

.custom-number-input:focus {
  outline: none;
}

.custom-number-input.has-hover:focus-within,
.custom-number-input:focus-within {
  border-color: var(--active-color);
}

.prepend-slot {
  display: flex;
  align-items: center;
  padding-left: 2px;
  flex-shrink: 0;
}

.controls-stack {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-left: 1px solid #555;
  flex-shrink: 0;
  transition: border-color 0.2s;
}

.control-btn {
  background-color: #3a3a3a;
  border: none;
  color: #ccc;
  cursor: pointer;
  width: 22px;
  height: 50%;
  font-size: 12px;
  line-height: 1;
  transition: background-color 0.2s;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover:not(:disabled) {
  background-color: #4f4f4f;
}

.control-btn:active:not(:disabled) {
  background-color: #5a5a5a;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.value-display {
  background-color: transparent;
  border: none;
  color: var(--text-color);
  width: 100%;
  padding: 0 8px;
  font-size: 13px;
  flex-grow: 1;
}

.value-display:focus {
  outline: none;
}
</style>
