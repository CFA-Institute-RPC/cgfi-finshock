<script setup lang="ts">
// import { computed } from 'vue'
// import { langNames } from '../../lib/labels'

// const lang = computed({
// 	get() {
// 		return 'en'
// 	},
// 	set(value: string) {
// 		console.warn('Trying to set language - not supported yet')
// 	},
// })
</script>

<template>
	<div class="footer">
		<a target="_blank" href="https://cgfi.ac.uk"
			><img src="@/assets/img/cgfi-logo.png"
		/></a>
		<a target="_blank" href="https://cfainstitute.org"
			><img src="@/assets/img/cfa-logo.png"
		/></a>
		<!-- <a target="_blank" href="https://reading.ac.uk"
			><img src="@/assets/img/reading-logo.png"
		/></a> -->
		<a target="_blank" href="https://the-iea.org"
			><img src="@/assets/img/iea-logo-black.png"
		/></a>
	</div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/scssVars.scss';

.footer {
	padding-top: $gap/2;
	height: $footerHeight + $gap;
	background-color: $bgContrast;
	display: flex;
	align-items: center;
	justify-content: space-around;
	font-size: 0.75rem;

	a {
		height: $footerHeight - $gap;
		img {
			height: $footerHeight - $gap;
		}
	}
}
</style>
