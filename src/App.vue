<script setup lang="ts">
import { onMounted, ref } from 'vue'
import 'vue3-loading-overlay/dist/vue3-loading-overlay.css'
import Loading from 'vue3-loading-overlay'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/Footer.vue'
import { useLabels, getTutorial } from '@/lib/labels'
import { useStore } from '@/store/store'
import 'shepherd.js/dist/css/shepherd.css'

import { useShepherd } from 'vue-shepherd'

const l = useLabels()
const store = useStore()

const tour = useShepherd({
	useModalOverlay: true,
})

onMounted(() => {
	document.title = l.value.title

	tour.addSteps(getTutorial(tour, store))
	tour.start()
})
</script>

<template>
	<loading :active="store.isLoading" :isFullPage="true" id="loading"></loading>
	<AppHeader id="header" />
	<router-view id="main"></router-view>
	<AppFooter id="footer" />
</template>

<style lang="scss">
@import '@/assets/styles/main.scss';
@import '@/assets/styles/scssVars.scss';

.csv-table {
	min-width: 42rem;
}

#app {
	width: 100vw;
	height: 100vh;
	max-width: 100vw;
	max-height: 100vh;
	display: grid;
	grid-template-columns: 100%;
	// grid-template-rows: $headerHeight + $gap 1fr;
	// grid-template-areas: 'header' 'main';
	grid-template-rows: $headerHeight + $gap 1fr $footerHeight + $gap;
	grid-template-areas: 'header' 'main' 'footer';

	#loading {
		width: 100vw;
		height: 100vh;
		position: absolute;
		margin: auto;
	}

	#header {
		grid-area: header;
	}

	#main {
		grid-area: main;
		// Constrains certain badly-behaved elements
		max-height: calc(100vh - $headerHeight - $footerHeight - 3 * $gap);
		// max-height: calc(100vh - $headerHeight - 2 * $gap);
		// padding: $gap;
	}

	#footer {
		grid-area: footer;
	}
}
button.shepherd-cancel-icon:hover {
	background-color: rgba(0, 0, 0, 0);
}
</style>
