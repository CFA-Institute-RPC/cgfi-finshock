<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLabels } from '@/lib/labels'
import { useStore } from '@/store/store'
import Chart from '@/components/Chart.vue'
import ControlPanel from '@/components/ControlPanel.vue'

const $l = useLabels()
const store = useStore()

const route = useRoute()

onMounted(async () => {
	console.log(import.meta.env)
})
</script>

<template>
	<div class="main">
		<Chart id="chart"></Chart>
		<ControlPanel id="controls"></ControlPanel>
	</div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/scssVars.scss';

.main {
	display: flex;
	flex-direction: row;
	padding-bottom: $gap;

	#chart {
		flex: 1 1 70%;
	}

	#controls {
		flex: 1 1 30%;
		min-width: 25rem;
	}
}
</style>
