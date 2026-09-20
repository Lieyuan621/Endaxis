<script setup>
import { ElConfigProvider } from 'element-plus';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getElementPlusLocale } from '@/i18n/elementPlusLocale';

const { locale } = useI18n({ useScope: 'global' });
const elementLocale = computed(() => getElementPlusLocale(locale.value));
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <router-view />
  </el-config-provider>
</template>
