<script setup lang="ts">
import { onMounted, ref, Ref, computed, watch, nextTick } from 'vue'
import { useStore, transpose } from '@/store/store'
import * as d3 from 'd3'

const store = useStore()
store.rerunModel().then(() => draw())

const chartRef = ref(null) as unknown as Ref<HTMLElement>
const lineChartRef = ref(null) as unknown as Ref<HTMLElement>

const width = ref(0)
const height = ref(0)
const margin = ref({
	top: 10,
	right: 10,
	bottom: 10,
	left: 10,
})

const lineChartWidth = ref(0)
const lineChartHeight = ref(0)
const lineChartMargin = ref({
	top: 20,
	right: 20,
	bottom: 40,
	left: 60,
})

const stepLength = computed(() => {
	const maxStepLength = 500 // maximum step length for the first iteration
	const minStepLength = 50 // minimum step length for the final iteration
	const maxStepsToFull = 50

	// Exponential decay formula
	const stepLength =
		maxStepLength * Math.exp(-2.5 * ((store.modelI - 1) / maxStepsToFull))

	// Ensure step length is not below the minimum step length
	return Math.max(stepLength, minStepLength)
})

const maxEquity = computed(() => Math.max(...store.equityOuts.flat()))
const maxEquityBarHeight = computed(
	() => Math.min(width.value, height.value) * 0.25,
)
const maxEquityLineHeight = computed(() => lineChartHeight.value)
const chartEqScale = computed(() =>
	d3
		.scaleLinear()
		.domain([0, maxEquity.value])
		.range([0, maxEquityBarHeight.value]),
)
const lineEqScale = computed(() =>
	d3
		.scaleLinear()
		.domain([0, maxEquity.value])
		.range([maxEquityLineHeight.value, 0]),
)
const lineXScale = computed(() =>
	d3
		.scaleLinear()
		.domain([0, store.equityOuts.length - 1])
		.range([0, lineChartWidth.value]),
)

const darkenColor = (hex: string, amount: number): string => {
	// Check if hex string is valid
	if (!/^#[0-9A-F]{6}$/i.test(hex)) throw new Error('Invalid hex color format')

	// Convert hex string to RGB values (0-255)
	const rgb = hex
		.slice(1)
		.match(/.{2}/g)!
		.map((x) => parseInt(x, 16))

	// Darken each color channel by the specified amount
	for (let i = 0; i < 3; i++) {
		rgb[i] = Math.min(255, rgb[i] - amount)
	}

	// Convert RGB values back to hex string
	const newHex = '#' + rgb.map((x) => x.toString(16).padStart(2, '0')).join('')

	return newHex
}

const allColors = [
	...d3.schemeSet3,
	...d3.schemeTableau10,
	...d3.schemeSet1,
	...d3.schemeDark2,
]

const allGroups = computed(() => [...new Set(store.nodeGroups)])
let count = 0
let lastColor = ''
const color = (index: number) => {
	if (store.nodeGroups === null) return allColors[index % allColors.length]
	const colorI = allGroups.value.indexOf(store.nodeGroups[index])
	const color = allColors[colorI % allColors.length]
	if (color == lastColor) {
		count++
		return darkenColor(color, count * 15)
	}
	lastColor = color
	count = 0
	return color
}

const startAnimation = () => {
	if (store.animating) {
		store.animating = false
		return
	}

	store.animating = true
	const runFunc = () => {
		if (!store.animating) return

		if (store.modelI >= store.equityOuts.length - 1) {
			store.animating = false
		} else {
			store.modelI++
			setTimeout(runFunc, stepLength.value)
		}
		draw()
	}
	if (store.modelI >= store.equityOuts.length - 1) {
		store.modelI = 0
		draw()
	}

	setTimeout(runFunc, stepLength.value)
}

function setSizes(resizing: boolean) {
	if (!resizing) {
		return
	}
	if (chartRef) {
		let rect = chartRef.value.getBoundingClientRect()
		width.value = rect.width - margin.value.left - margin.value.right
		height.value = rect.height - margin.value.top - margin.value.bottom
	}
	if (lineChartRef) {
		let rect = lineChartRef.value.getBoundingClientRect()
		lineChartWidth.value =
			rect.width - lineChartMargin.value.left - lineChartMargin.value.right
		lineChartHeight.value =
			rect.height - lineChartMargin.value.top - lineChartMargin.value.bottom
	}
}

const innerRadius = computed(
	() => Math.min(width.value, height.value) * 0.25 - 5,
)
const chord = d3
	.chordDirected()
	.sortSubgroups(() => 0)
	.sortChords(d3.descending)
const gap = 4
const arc = d3
	.arc()
	.innerRadius(() => innerRadius.value)
	.outerRadius(
		(_, i) =>
			Math.max(0, chartEqScale.value(store.equityOuts[store.modelI][i])) +
			innerRadius.value +
			gap,
	)
const ribbon = d3
	.ribbonArrow()
	.radius(() => innerRadius.value - 0.5)
	.padAngle(() => 3 / (innerRadius.value * store.nNodes))

const shockArc = d3
	.arc()
	.innerRadius((_, i) =>
		store.shock[i] >= 0
			? Math.max(
					0,
					chartEqScale.value(0.1 + store.equityOuts[0][i] - store.shock[i]),
				) +
				innerRadius.value +
				gap
			: Math.max(0, chartEqScale.value(store.equityOuts[store.modelI][i])) +
				innerRadius.value +
				gap,
	)
	.outerRadius((_, i) =>
		store.shock[i] >= 0
			? Math.max(0, chartEqScale.value(store.equityOuts[store.modelI][i])) +
				innerRadius.value +
				gap
			: Math.max(
					0,
					chartEqScale.value(0.1 + store.equityOuts[0][i] - store.shock[i]),
				) +
				innerRadius.value +
				gap,
	)
	.startAngle((d) => d.startAngle)
	.endAngle((d) => d.endAngle)

const fillFunc = (d: any) => {
	if (store.equityOuts[store.modelI][d.index] < 0) {
		return '#df2828'
	} else {
		return color(d.index)
	}
}
const shockFillFunc = (_: any, i: number) => {
	if (store.modelI <= 0) {
		return 'url(#diagonalHatch)'
	}
	return 'none'
}

const line = d3
	.line()
	.x((d, i) => lineXScale.value(i))
	// Bottom out at zero
	// @ts-ignore - this is because I'm abusing line and not sending it an array of 2d arrays.
	.y((d, i) => lineEqScale.value(d < 0 ? 0 : d))
const fractionalModelI = ref(store.modelI)
const dragging = ref(false)
const drag = d3
	.drag()
	.on('start', (e) => {
		dragging.value = true
	})
	.on('drag', (e) => {
		fractionalModelI.value = lineXScale.value.invert(e.x)
		const newModelI = Math.round(fractionalModelI.value)
		if (newModelI < 0 || newModelI >= store.equityOuts.length) return
		if (newModelI !== store.modelI) {
			store.modelI = newModelI
			drawGraph()
		}
		const chartContainer = d3.select(lineChartRef.value).select('#chart')
		chartContainer
			.select('g#decor')
			.selectAll('line.time')
			.data([fractionalModelI.value])
			.attr('x1', (d, i) => lineXScale.value(d))
			.attr('x2', (d, i) => lineXScale.value(d))
	})
	.on('end', (e) => {
		fractionalModelI.value = store.modelI
		draw()
		dragging.value = false
	})
let chords: d3.Chords

function draw(resizing = false) {
	drawGraph(resizing)
	drawLineChart(resizing)
	drawLCAxes(resizing)
}

function drawGraph(resizing = false) {
	if (store.equityOuts.length === 0) return
	const graphContainer = d3.select(chartRef.value).select('#graph')
	graphContainer.attr(
		'transform',
		`translate(${margin.value.left + width.value / 2}, ${margin.value.top + height.value / 2})`,
	)

	chord.padAngle(12 / (innerRadius.value * store.nNodes))

	chords = chord(store.liabilityMatrix)
	chords.forEach((chord) => {
		// Now go through and reduce the target angle spans, such that the
		// end of the arrow represents the *effective* value of the liability
		const t = chord.target
		let tspan = t.endAngle - t.startAngle
		if (tspan < 0) {
			tspan += 2 * Math.PI
		}
		const tdiff =
			(1.0 - store.effectiveValues[store.modelI][chord.source.index]) * tspan
		t.startAngle += tdiff / 2
		t.endAngle -= tdiff / 2
		if (t.endAngle < 0) {
			t.endAngle += 2 * Math.PI
		}
		if (t.startAngle > 2 * Math.PI) {
			t.startAngle -= 2 * Math.PI
		}
	})

	graphContainer
		.datum(chords)
		.selectAll('path.chord')
		.data(
			(chords) => chords,
			(d: any) => d.source.index + '-' + d.target.index,
		)
		.join(
			(enter) =>
				enter
					.append('path')
					.classed('chord', true)
					.classed(
						'highlight',
						(d) =>
							store.selectedLiability !== null &&
							d.source.index === store.selectedLiability.from &&
							d.target.index === store.selectedLiability.to,
					)
					.attr('fill', (d) => color(d.source.index))
					// @ts-ignore
					.attr('d', ribbon)
					.on('click', (e, d) => {
						store.selectedNode = d.source.index
						store.selectedLiability = {
							from: d.source.index,
							to: d.target.index,
						}
					})
					.call((enter) =>
						enter
							.append('title')
							.text(
								(d) =>
									`${d.source.index} owes ${d.target.index} ${d.source.value}`,
							),
					),
			(update) =>
				update
					.attr('fill', (d) => color(d.source.index))
					.call((update) =>
						update
							.transition()
							.duration(
								resizing ? 0 : dragging.value ? 50 : stepLength.value / 3,
							)
							// @ts-ignore
							.attr('d', ribbon),
					),
		)

	const g = graphContainer.select('#bars')
	g.selectAll('path.bar')
		.data(chords.groups)
		.join(
			(enter) =>
				enter
					.append('path')
					.attr(
						'd',
						arc as unknown as d3.ValueFn<SVGPathElement, d3.ChordGroup, string>,
					)
					.classed('bar', true)
					.classed('highlight', (d) => d.index == store.selectedNode)
					.attr('fill', fillFunc)
					.on('click', (e, d) => (store.selectedNode = d.index))
					.append('title')
					.text(
						(d) =>
							`${d.index} has ${store.equityOuts[store.modelI][d.index]} equity`,
					),
			(update) =>
				update
					.transition()
					.duration(resizing ? 0 : dragging.value ? 50 : stepLength.value / 3)
					.attr('fill', fillFunc)
					// @ts-ignore
					.attr('d', arc)
					.select('title')
					.text(
						(d) =>
							`${d.index} has ${store.equityOuts[store.modelI][d.index]} equity`,
					),
		)
	g.selectAll('path.shockbar')
		.data(chords.groups)
		.join(
			(enter) =>
				enter
					.append('path')
					.attr(
						'd',
						shockArc as unknown as d3.ValueFn<
							SVGPathElement,
							d3.ChordGroup,
							string
						>,
					)
					.classed('shockbar', true)
					.attr('fill', shockFillFunc)
					.on('click', (e, d) => (store.selectedNode = d.index)),
			(update) =>
				update
					.transition()
					.duration(resizing ? 0 : dragging.value ? 50 : stepLength.value / 3)
					// @ts-ignore
					.attr('d', shockArc)
					.transition()
					.delay(resizing ? 0 : dragging.value ? 50 : stepLength.value / 3)
					.attr('fill', shockFillFunc),
		)
}

function drawLineChart(resizing = false) {
	const chartContainer = d3.select(lineChartRef.value).select('#chart')

	chartContainer.attr(
		'transform',
		`translate(${lineChartMargin.value.left}, ${lineChartMargin.value.top})`,
	)
	chartContainer
		.select('g#lines')
		.selectAll('path.line')
		.data(transpose(store.equityOuts))
		.join(
			// @ts-ignore
			(enter) => {
				enter
					.append('path')
					.attr(
						'd',
						line as unknown as d3.ValueFn<SVGPathElement, number[], string>,
					)
					.attr('fill', 'none')
					.attr('stroke', (d, i) => color(i))
					.attr('stroke-width', 2)
					.classed('line', true)
			},
			(update) => {
				update.attr(
					'd',
					// @ts-ignore
					line as unknown as d3.ValueFn<SVGPathElement, number[], string>,
				)
			},
		)

	chartContainer
		.select('g#decor')
		.selectAll('line.time')
		.data([store.modelI])
		.join(
			// @ts-ignore
			(enter) => {
				enter
					.append('line')
					.attr('x1', (d, i) => lineXScale.value(d))
					.attr('x2', (d, i) => lineXScale.value(d))
					.attr('y1', (d, i) => 0)
					.attr('y2', (d, i) => lineChartHeight.value)
					.attr('fill', 'none')
					.attr('stroke', 'white')
					.attr('stroke-width', 4)
					.classed('time', true)
					// @ts-ignore
					.call(drag)
			},
			(update) => {
				update
					.transition()
					.duration(resizing ? 0 : stepLength.value / 3)
					.attr('x1', (d, i) => lineXScale.value(d))
					.attr('x2', (d, i) => lineXScale.value(d))
					.attr('y2', (d, i) => lineChartHeight.value)
			},
		)
}

function drawLCAxes(resizing = false) {
	const chartContainer = d3.select(lineChartRef.value).select('#chart')
	const axes = chartContainer.select('g#axes')
	axes.selectAll('g.axis').remove()

	const xAxis = d3.axisBottom(lineXScale.value).ticks(10)
	axes
		.append('g')
		.attr('class', 'axis')
		.attr('transform', `translate(0, ${lineChartHeight.value})`)
		.call(xAxis)
		.append('text')
		.attr('class', 'axis-label')
		.attr('x', lineChartWidth.value / 2)
		.attr('y', 32)
		.text('Timestep')

	const yAxis = d3
		.axisLeft(lineEqScale.value)
		.ticks(5)
		.tickFormat(d3.format('.2s'))

	axes
		.append('g')
		.attr('class', 'axis')
		.call(yAxis)
		.append('text')
		.attr('class', 'axis-label')
		.attr('transform', 'rotate(-90)')
		.attr('y', -40)
		.attr('x', -lineChartHeight.value / 2)
		.text('Equity')
}

function drawHighlight() {
	const graphContainer = d3.select(chartRef.value).select('#graph')
	graphContainer
		.selectAll('path.chord')
		.data(chords)
		.join(
			(enter) => enter,
			(update) =>
				update.classed(
					'highlight',
					(d) =>
						store.selectedLiability !== null &&
						d.source.index === store.selectedLiability.from &&
						d.target.index === store.selectedLiability.to,
				),
		)

	const g = graphContainer.select('#bars')
	g.selectAll('path.bar')
		.data(chords.groups)
		.join(
			(enter) => enter,
			(update) =>
				update.classed('highlight', (d) => d.index == store.selectedNode),
		)
}

watch(
	() => [
		store.equities,
		...store.shock,
		store.valueFunc,
		store.R,
		store.alpha,
		store.beta,
		store.volatility,
		store.maturity,
		store.updating,
	],
	async () => {
		if (!store.updating) {
			store.setLoading()
			await store.rerunModel()
			store.setLoadingDone()
			draw()
		}
	},
)
watch(
	() => store.modelI,
	() => {
		draw()
	},
)
watch(
	() => {
		let ls
		if (store.selectedLiability) {
			ls = [store.selectedLiability.from, store.selectedLiability.to]
		} else {
			ls = [null, null]
		}
		return [store.selectedNode, ...ls]
	},
	() => {
		drawHighlight()
	},
)
onMounted(() => {
	setSizes(true)
	// draw()
	window.addEventListener('resize', () => {
		setSizes(true)
		draw(true)
	})
})
</script>

<template>
	<div class="charts">
		<svg class="chart-svg" ref="chartRef">
			<defs>
				<pattern
					id="diagonalHatch"
					width="10"
					height="10"
					patternUnits="userSpaceOnUse"
				>
					<path d="M 0 0 L 10 10" stroke="#600000" stroke-width="1" />
					<path d="M 10 0 L 0 10" stroke="#600000" stroke-width="1" />
				</pattern>
			</defs>
			<g id="graph">
				<g id="bars"></g>
			</g>
		</svg>
		<svg class="line-chart-svg" id="lineChart" ref="lineChartRef">
			<g id="chart" :class="{ hidden: store.equityOuts.length > 0 }">
				<g id="axes"></g>
				<g id="lines"></g>
				<g id="decor"></g>
			</g>
		</svg>
		<div class="buttons">
			<p class="label" id="noSteps">
				Step {{ store.modelI }} / {{ store.equityOuts.length - 1 }}
			</p>
			<button
				@click="
					() => {
						store.modelI = 0
						store.animating = false
						draw()
					}
				"
				:disabled="store.modelI <= 0"
			>
				<fa-icon icon="backward-fast"></fa-icon>
			</button>
			<button
				@click="
					() => {
						store.prevModelI()
						store.animating = false
						draw()
					}
				"
				:disabled="store.modelI <= 0"
			>
				<fa-icon icon="backward-step"></fa-icon>
			</button>
			<button @click="startAnimation" :disabled="store.equityOuts.length < 2">
				<fa-icon :icon="store.animating ? 'pause' : 'play'"></fa-icon>
			</button>
			<button
				@click="
					() => {
						store.nextModelI()
						store.animating = false
						draw()
					}
				"
				:disabled="store.modelI >= store.equityOuts.length - 1"
			>
				<fa-icon icon="forward-step"></fa-icon>
			</button>
			<button
				@click="
					() => {
						store.modelI = store.equityOuts.length - 1
						store.animating = false
						draw()
					}
				"
				:disabled="store.modelI >= store.equityOuts.length - 1"
			>
				<fa-icon icon="forward-fast"></fa-icon>
			</button>
		</div>
		<div class="info"></div>
	</div>
</template>

<style lang="scss">
@import '@/assets/styles/scssVars.scss';

.charts {
	display: flex;
	flex-direction: column;
	height: 100%;

	.chart-svg {
		flex: 1 1 70%;
		background-color: $bgContrast;
		height: 100%;

		.shockbar,
		.bar,
		.chord {
			fill-opacity: 0.75;
			stroke: none;
			// }

			// .shockbar,
			// .bar {
			cursor: pointer;

			&.highlight {
				fill-opacity: 0.85;
				stroke-width: 1px;
				stroke: white;
			}
		}
	}

	.line-chart-svg {
		flex: 1 1 30%;
		background-color: $bgContrast;
		height: 100%;
		margin-top: 0.5rem;

		line {
			&.time {
				stroke-width: 12px;
				stroke-linecap: round;
				opacity: 0.5;
				stroke: white;
				cursor: pointer;
			}
		}
		path.line {
			cursor: pointer;
		}
	}

	.spacer {
		flex-basis: 0 0 32px;
		background-color: green;
	}

	.buttons {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;

		.label {
			position: absolute;
			left: 1rem;
		}

		button {
			flex: 0 1 10%;
			height: 3rem;
			font-size: 1.5rem;
			color: white;
			border: none;
			cursor: pointer;

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
		}
	}

	.axis-label {
		font-size: 0.75rem;
		fill: white;
		text-anchor: middle;
	}
}
</style>
