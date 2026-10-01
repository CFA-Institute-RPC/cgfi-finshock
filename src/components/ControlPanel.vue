<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useLabels } from '@/lib/labels'
import { useStore, scenarios } from '@/store/store'
import { useShepherd } from 'vue-shepherd'

const $l = useLabels()
const store = useStore()

const route = useRoute()

onMounted(async () => {})

const controlsRef = ref<HTMLElement | null>(null)

const chooseScenario = ref(false)

watch(
	() => [store.selectedLiability],
	() => {
		if (store.selectedLiability) {
			const el = document.getElementById(
				`owes${store.selectedLiability.to + 1}`,
			) as HTMLInputElement
			el.focus()
		}
	},
)

let tour = useShepherd({
	useModalOverlay: true,
})

const helpSteps: { [key: string]: any } = {
	chooseScenario: [
		{
			id: 'chooseScenario',
			title: 'Network Configuration',
			text: 'These buttons allow you to quickly configure the overall network structure.<ul><li>The "Choose Scenario" button will bring up a list of pre-defined scenarios to choose from.<li>The "Import Data" button will allow you to import a network configuration from a CSV file. For details of the format, see below<li>The "Randomise Network" button will randomly generate a network configuration, with somewhat realistic parameters.</ul>',
			cancelIcon: {
				enabled: true,
			},
			canClickTarget: false,
			attachTo: {
				element: '.scenarios',
				on: 'left',
			},
			buttons: [
				{
					text: 'CSV format details',
					action: () => tour.next(),
					secondary: true,
				},
				{
					text: 'Close',
					action: () => tour.complete(),
				},
			],
		},
		{
			id: 'csvFormat',
			title: 'CSV Format',
			text: 'To import data from a CSV file, it must have the following format:<table border="1"><tr><th>BankId</th><th>GroupID</th><th>ExtAssets</th><th>ExtLiab</th><th>OwedByBank1</th><th>OwedByBank2</th><th>OwedByBank3</th></tr><tr><td>Bank1</td><td>Group1</td><td>434</td><td>45</td><td>0</td><td>100</td><td>20</td></tr><tr><td>Bank2</td><td>Group1</td><td>330</td><td>28</td><td>40</td><td>0</td><td>50</td></tr><tr><td>Bank3</td><td>Group2</td><td>396</td><td>4</td><td>10</td><td>80</td><td>0</td></tr></table>The header IDs are not important, but the order of the columns is. The Group ID can be left blank, but if used, will group banks together in the network and plot them in similar colours. The number of rows of data must be equal to the number of <code>OwedByBank*</code> columns.',
			cancelIcon: {
				enabled: true,
			},
			classes: 'csv-table',
		},
	],
	equity: [
		{
			title: 'Equity',
			text: 'The equity value of the selected bank at the current time step. The equity is the external assets plus the effective internal assets (i.e. assets owed to the selected bank by other banks in the network), minus the external liabilities and internal liabilities (i.e. assets owed to other banks). Importantly, the internal assets are multiplied by the effective value of the owing bank, to statistically account for the fact that a debt from a bankrupt organisation is worthless.',
			attachTo: {
				element: '#equityVal',
				on: 'left',
			},
			cancelIcon: {
				enabled: true,
			},
		},
	],
	value: [
		{
			title: 'Valuation',
			text: 'The effective value of the selected bank at the current time step. This is a measure of how likely a bank is to be able to pay its current debts. All debts from a bank are multiplied by its effective value, which is calculated using the chosen valuation function. For further details on each function, see the help for the "Valuation Function" control.',
			attachTo: {
				element: '#valuationVal',
				on: 'left',
			},
			cancelIcon: {
				enabled: true,
			},
		},
	],
	shock: [
		{
			title: 'Shock',
			text: 'The shock value applied to the selected bank. This is the amount of external assets the bank loses at the start of the simulation. It is this initial reduction of equity which determines how the model progresses.',
			attachTo: {
				element: '#shockControl',
				on: 'left',
			},
			cancelIcon: {
				enabled: true,
			},
		},
	],
	extAssets: [
		{
			title: 'External Assets',
			text: 'The amount of external assets the selected bank has. This is the amount of money the bank has in reserve, which is not owed to any other bank in the network.',
			attachTo: {
				element: '#extAssetsControl',
				on: 'left',
			},
			cancelIcon: {
				enabled: true,
			},
		},
	],
	extLiabilities: [
		{
			title: 'External Liabilities',
			text: 'The amount of external liabilities the selected bank has. This is the amount of money the bank owes to organisations which are external to the network.',
			attachTo: {
				element: '#extLiabilityControl',
				on: 'left',
			},
			cancelIcon: {
				enabled: true,
			},
		},
	],
	valueFunc: [
		{
			title: 'Valuation Function',
			text: "The valuation function used to calculate the effective value of a bank. The three options are:<ul><li>Distress: Reevaluation is triggered by the firm's capital buffer and determined by a flexible beta distribution. If the firm's capital buffer (equity divided by total liabilities) under reevaluation is lower than its initial capital buffer, there is a decrease in valuation. The decrease is determined by a beta distribution (α and β parameters) and a loss given default (LGD), representing firm operational risks. A higher LGD leads to a lower valuation; with an LGD of 0 there is no contagion.</li><li>Merton: Valuation is determined by the likelihood of default based on firm leverage, volatility, debt maturity and loss given default (as in Distress). Reevaluation is triggered by a firm's equity relative to its external asset holdings. An increase in leverage and volatility increases its probability of default, decreasing the firm's valuation function.</li><li>Black: Like the Merton valuation function, valuation accounts for default before firm debt maturity. This leads to a lower valuation than Merton, which is also based on the firm's leverage, volatility and loss given default.</li></ul>",
			attachTo: {
				element: '#valueFuncControl',
				on: 'left',
			},
			cancelIcon: {
				enabled: true,
			},
		},
	],
	minDenMaxEnt: [
		{
			title: 'Minimum Density and Maximum Entropy',
			text: "Matrix reconstruction methods are used when only partial information is known. In this context, the network can be represented as a matrix where partial information represents the row and column sums of the matrix. Using partial information and financial assumptions, we reconstruct a network which respects the partial information and assumptions. We provide methods for two approaches: <ul><li>Maximum Entropy – representing a fully interconnected network of firms' interbank assets and liabilities</li><li>Minimum Density – representing a probabilistic network where the number of network connections is minimised.</li></ul>These two methods have been applied to both a fragile and a stable balance sheet which can be pre-selected. Both networks will have the same initial set of equities, but the interbank assets and liabilities will differ.",
			cancelIcon: {
				enabled: true,
			},
		},
	],
}

const help = (event: MouseEvent, id: string) => {
	event.stopPropagation()
	tour = useShepherd({
		useModalOverlay: true,
	})
	tour.addSteps(helpSteps[id])
	tour.start()
}
</script>

<template>
	<div
		ref="controlsRef"
		class="controls"
		:class="{ disabled: store.animating }"
	>
		<div class="scenarios">
			<label>Network configuration</label>
			<button @click="store.chooseScenario" class="choose">
				Choose scenario
			</button>
			<button @click="store.importData" class="import">Import data</button>
			<button @click="store.randomise" class="randomise">
				Randomise network
			</button>
			<button @click="help($event, 'chooseScenario')" class="help big">
				?
			</button>
		</div>
		<div id="chooseScenario" v-if="store.choosingScenario">
			<div class="frame">
				<div class="close" @click="store.choosingScenario = false">
					<fa-icon icon="close"></fa-icon>
				</div>
				<div v-for="(scenario, id) in scenarios" class="scenarioButton">
					<button @click="store.selectScenario(id as unknown as string)">
						{{ scenario.name }}
					</button>
					<button
						v-if="
							scenario.name.indexOf('Density') >= 0 ||
							scenario.name.indexOf('Entropy') >= 0
						"
						@click="help($event, `minDenMaxEnt`)"
						class="help"
					>
						?
					</button>
				</div>
			</div>
		</div>
		<div class="control">
			<label for="node">{{ $l.selNode }}</label>
			<select class="ui" id="node" v-model="store.selectedNode">
				<option v-for="i in store.nNodes" :key="i" :value="i - 1">
					{{
						store.nodeIds !== null && store.nodeIds[i - 1]
							? store.nodeIds[i - 1]
							: i - 1
					}}
				</option>
			</select>
			<button class="addremove" @click="store.addNode">+</button>
			<button class="addremove" @click="store.removeNode">-</button>
		</div>
		<div class="control info">
			<label id="equityVal">
				{{ $l.equityIs }}:
				{{
					store.equityOuts.length > store.modelI
						? store.equityOuts[store.modelI][store.selectedNode].toFixed(2)
						: 'N/A'
				}}
				<button @click="help($event, 'equity')" class="help">?</button>
			</label>
			<label id="valuationVal">
				{{ $l.valueIs }}:
				{{
					store.effectiveValues.length > store.modelI
						? store.effectiveValues[store.modelI][store.selectedNode].toFixed(3)
						: 'N/A'
				}}
				<button @click="help($event, 'value')" class="help">?</button>
			</label>
		</div>
		<div class="spacer"></div>
		<div class="control" id="shockControl">
			<label for="shock"
				>{{ $l.shock }}
				<button @click="help($event, 'shock')" class="help">?</button></label
			>
			<input
				class="ui"
				id="shock"
				type="number"
				step="10"
				v-model="store.shock[store.selectedNode]"
			/>
		</div>
		<div class="control" id="extAssetsControl">
			<label for="extAsset"
				>{{ $l.extAsset }}
				<button @click="help($event, 'extAssets')" class="help">
					?
				</button></label
			>
			<input
				class="ui"
				id="extAsset"
				type="number"
				min="0"
				step="10"
				v-model="store.extAssets[store.selectedNode]"
			/>
		</div>
		<div class="control" id="extLiabilityControl">
			<label for="extLiability"
				>{{ $l.extLiability }}
				<button @click="help($event, 'extLiabilities')" class="help">
					?
				</button></label
			>
			<input
				class="ui"
				id="extLiability"
				type="number"
				min="0"
				step="10"
				v-model="store.extLiabilities[store.selectedNode]"
			/>
		</div>
		<div class="spacer" />
		<div id="valuation">
			<div class="control" id="valueFuncControl">
				<label for="valueFunc"
					>{{ $l.valueFunc }}
					<button @click="help($event, 'valueFunc')" class="help">
						?
					</button></label
				>
				<select class="ui" id="valueFunc" v-model="store.valueFunc">
					<option value="Distress">Distress</option>
					<option value="Merton">Merton</option>
					<option value="Black">Black</option>
				</select>
			</div>
			<div class="control">
				<label for="recoveryRate">{{ $l.recoveryRate }} </label>
				<input
					class="ui"
					id="recoveryRate"
					type="number"
					min="0"
					max="1"
					step="0.1"
					v-model="store.R"
				/>
			</div>
			<div class="control" v-show="store.valueFunc === 'Distress'">
				<label for="alpha">{{ $l.alphabeta }} </label>
				<input
					class="ui lmat"
					id="alpha"
					type="number"
					min="0"
					max="1"
					step="0.1"
					v-model="store.alpha"
				/>
				<input
					class="ui lmat"
					id="beta"
					type="number"
					min="0"
					max="1"
					step="0.1"
					v-model="store.beta"
				/>
			</div>
			<div class="control" v-show="store.valueFunc !== 'Distress'">
				<label for="volatility">{{ $l.volatility }} </label>
				<input
					class="ui"
					id="volatility"
					type="number"
					min="0"
					max="1"
					step="0.1"
					v-model="store.volatility"
				/>
			</div>
			<div class="control" v-show="store.valueFunc !== 'Distress'">
				<label for="maturity">{{ $l.maturity }}</label>
				<input
					class="ui"
					id="maturity"
					type="number"
					min="0"
					max="50"
					step="1"
					v-model="store.maturity"
				/>
			</div>
		</div>
		<div class="spacer"></div>
		<div class="control">
			<label> </label>
			<label class="Ltitle"> Owes</label>
			<label class="Ltitle"> Owed by</label>
		</div>
		<div id="liabilityMatrix">
			<div
				class="control"
				v-for="i in store.nNodes"
				:key="i"
				v-show="i - 1 != store.selectedNode"
			>
				<label :for="'owes' + i">{{
					store.nodeIds !== null && store.nodeIds[i - 1]
						? store.nodeIds[i - 1]
						: i - 1
				}}</label>
				<input
					class="ui lmat"
					:id="'owes' + i"
					type="number"
					min="0"
					step="10"
					v-model="store.liabilityMatrix[store.selectedNode][i - 1]"
					@focus="
						store.selectedLiability = { from: store.selectedNode, to: i - 1 }
					"
				/>
				<input
					class="ui lmat"
					:id="'owed' + i"
					type="number"
					min="0"
					step="10"
					v-model="store.liabilityMatrix[i - 1][store.selectedNode]"
					@focus="
						store.selectedLiability = { to: store.selectedNode, from: i - 1 }
					"
				/>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/scssVars.scss';

#chooseScenario {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.75);
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	z-index: 10;

	.frame {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		margin: 0.5rem;
		padding: 1rem;
		border-radius: 0.5rem;

		background-color: $bgContrast;
		button {
			margin: 0.5rem;
			position: relative;
		}

		.close {
			align-self: flex-end;
			color: $closeColor;
			cursor: pointer;
		}
	}
}

.controls {
	display: flex;
	flex-direction: column;
	overflow-y: scroll;
	padding: 0.5rem;

	#node {
		margin-bottom: 0;
	}

	&.disabled {
		pointer-events: none;
		opacity: 0.7;
	}

	.control {
		align-items: center;
		display: flex;
		flex-direction: row;
		justify-content: space-around;

		label {
			flex: 1 0 7rem;
			text-align: right;
			margin-right: 1rem;
			padding-right: 0.5rem;
			color: $primary;
			position: relative;
			&.Ltitle {
				flex: 1 0 30%;
				text-align: center;
			}
		}

		&.info {
			margin: 0.5rem 0;
			label {
				flex: 1 1 10%;
				text-align: center;
				margin: 0.25rem;
				font-size: 1.2rem;
				color: $textColor;
			}
		}

		select {
			margin: 0.5rem;
		}

		.ui {
			flex: 1 1 70%;
			min-width: 0;

			&.lmat:last-child {
				margin-left: 1rem;
			}

			&.lmat {
				flex: 1 1 35%;
			}
		}
	}

	.scenarios {
		display: flex;
		flex-direction: row;
		overflow: visible;
		position: relative;
		border: 2px solid $primary;
		padding: 1rem;
		button {
			margin: 0.25rem;
		}
		margin-top: 0;
		margin-bottom: 1rem;

		label {
			flex: 1 0 7rem;
			text-align: right;
			margin-right: 1rem;
			padding-right: 0.5rem;
			color: $primary;
			position: absolute;
			left: 0.5rem;
			top: -0.5rem;
			font-size: 0.75rem;
			padding-left: 0.5rem;
			background-color: $bg;
		}
	}

	.scenarioButton {
		position: relative;
	}

	button.help {
		width: 1rem;
		height: 1rem;
		position: absolute !important;
		top: -0.5rem;
		right: -0.5rem;
		background-color: $helpColor;
		border-radius: 0.75rem;
		padding: 0;
		font-size: 0.75rem;

		&.big {
			width: 1.5rem;
			height: 1.5rem;
			top: -0.75rem;
			right: -0.75rem;
			font-size: 1rem;
		}

		&:hover {
			background-color: darken($helpColor, 25%);
		}
	}

	.spacer {
		flex: 0 0 1rem;
	}

	button.addremove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: none;
		border-radius: 3px;
		background-color: $buttonColor;
		color: $textColor;
		font-size: 1.5rem;
		cursor: pointer;
		transition: background-color 0.3s ease;
		margin: 0.1rem;
	}
}
</style>
