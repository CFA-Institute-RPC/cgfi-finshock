import { State } from '@/store/store'
import { TimeLocaleDefinition } from 'd3'
import { Store } from 'pinia'
import { App, computed, ComputedRef, inject, InjectionKey } from 'vue'

const langNames: Record<Language, string> = {
	en: 'English',
}

const labelsEn = {
	title: 'Network Reevaluation Model',
	main: 'Main page',
	tutorial: 'Tutorial',
	mainTitle: 'Main content goes here',
	selNode: 'Bank:',
	owes: 'Owes',
	owed: 'Owed by',
	shock: 'Shock',
	selScenario: 'Select scenario',
	extAsset: 'Ext. assets',
	extLiability: 'Ext. liabilities',
	valueFunc: 'Valuation function',
	equityIs: 'Equity',
	valueIs: 'Valuation',
	recoveryRate: 'Recovery rate',
	alphabeta: 'α, β',
	volatility: 'Volatility',
	maturity: 'Time to Maturity',
	e404Title: 'Page not found',
	e404: 'The page you are looking for does not exist, please navigate to another page using the menus at the top of the page.',
	errorTitle: 'Error',
	error:
		'A problem has occurred.  If this keeps happening, please contact the system administrator.',
}

export const getTutorial = (
	tour: any,
	store: Store<string, State>,
	showIntro: boolean = true,
) => {
	const intro = []
	if (showIntro) {
		intro.push({
			id: 'intro',
			title: 'Welcome!',
			text: '<p>This Network Reevaluation Model is a tool for visualizing and analyzing shocks to financial networks. If you are new to the model, we recommend you follow this intro to learn how to use it.</p><p>This tool is based on the work done in the paper <a href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4905653" target="_blank">Financial network valuation under climate transition risk</a></p>',
			cancelIcon: {
				enabled: true,
			},
			canClickTarget: false,
			buttons: [
				{
					text: "I know what I'm doing",
					action: () => {
						// TODO set a cookie here?
						tour.cancel()
					},
					secondary: true,
				},
				{
					text: 'Continue tutorial',
					action: tour.next,
				},
			],
		})
	}
	return [
		...intro,

		{
			id: 'banks',
			title: 'Banks',
			text: "Let's start with a simple model. Each bank in the network is represented by a different coloured bar. The height of the bar represents the bank's equity. The equity is a function of the bank's external assets and liabilities, as well interbank liabilities (i.e. interbank loans etc.) in the model.",
			attachTo: {
				element: '#bars .bar:nth-child(1)',
				on: 'bottom',
			},
			cancelIcon: {
				enabled: true,
			},
			canClickTarget: false,
			buttons: [
				{
					text: 'Back',
					action: tour.back,
				},
				{
					text: 'Next',
					action: tour.next,
				},
			],
			when: {
				show: () => {
					// @ts-ignore
					store.selectScenario('simple')
					store.selectedNode = 0
				},
			},
		},
		{
			id: 'liabilities1',
			title: 'Liabilities',
			text: 'The arrows in the graph represent liabilities between banks - e.g. interbank loans. The width of the arrow represents the amount of the liability. The colour of the arrow represents the bank that owes the money. For example, this arrow represents a liability from the blue bank (Bank 0) to the yellow one (Bank 1) - i.e. bank 0 owes money to bank 1.',
			attachTo: {
				element: '#graph .chord.highlight',
				on: 'bottom',
			},
			cancelIcon: {
				enabled: true,
			},
			canClickTarget: false,
			buttons: [
				{
					text: 'Back',
					action: tour.back,
				},
				{
					text: 'Next',
					action: tour.next,
				},
			],
			when: {
				show: () => {
					store.selectedLiability = { to: 1, from: 0 }
				},
			},
		},
		{
			id: 'liabilities2',
			title: 'Liabilities',
			text: 'The selected arrow (the one outlined in white, which we looked at in the last step) is representing this liability, where bank 0 owes bank 1 €50m',
			attachTo: {
				element: '#owes2',
				on: 'left',
			},
			cancelIcon: {
				enabled: true,
			},
			canClickTarget: false,
			buttons: [
				{
					text: 'Back',
					action: tour.back,
				},
				{
					text: 'Next',
					action: tour.next,
				},
			],
			when: {
				show: () => {
					store.selectedLiability = { to: 1, from: 0 }
				},
			},
		},
		{
			id: 'liabilities3',
			title: 'Liabilities',
			text: 'By modifying the liabilities in this liability matrix, you can see how the network configuration changes. Give it a try before moving onto the next step!',
			attachTo: {
				element: '#liabilityMatrix',
				on: 'left',
			},
			cancelIcon: {
				enabled: true,
			},
			buttons: [
				{
					text: 'Back',
					action: tour.back,
				},
				{
					text: 'Next',
					action: () => {
						store.liabilityMatrix = [
							[0, 50, 70, 0, 0, 0],
							[0, 0, 50, 70, 0, 0],
							[0, 0, 0, 50, 70, 0],
							[0, 0, 0, 0, 50, 70],
							[70, 0, 0, 0, 0, 50],
							[50, 70, 0, 0, 0, 0],
						]
						tour.next()
					},
				},
			],
		},
		{
			id: 'shock',
			title: 'Shock',
			text: 'Once the network has been configured, we can introduce a shock to the system. A shock is a sudden change in the value of a bank, which can have knock-on effects on the rest of the network. In this case, we are going to shock bank 0 with a value of €50m.',
			attachTo: {
				element: '#shockControl',
				on: 'left',
			},
			cancelIcon: {
				enabled: true,
			},
			canClickTarget: false,
			buttons: [
				{
					text: 'Back',
					action: tour.back,
				},
				{
					text: 'Next',
					action: tour.next,
				},
			],
			when: {
				show: () => {
					store.shock = [50, 0, 0, 0, 0, 0]
				},
			},
		},
		{
			id: 'shock2',
			title: 'Shock',
			text: 'This initial shock is represented by the shaded area of the bar for bank 0. The height of the shaded area represents the size of the shock.',
			attachTo: {
				element: '#bars .bar:nth-child(1)',
				on: 'bottom',
			},
			cancelIcon: {
				enabled: true,
			},
			canClickTarget: false,
			buttons: [
				{
					text: 'Back',
					action: tour.back,
				},
				{
					text: 'Next',
					action: tour.next,
				},
			],
		},
		{
			id: 'shock3',
			title: 'Shock',
			text: 'Introducing a shock allows the model to evolve, and the playback can be controlled with these buttons. Try clicking the buttons to see how this model responds to shock.',
			attachTo: {
				element: '.charts .buttons',
				on: 'top',
			},
			cancelIcon: {
				enabled: true,
			},
			canClickTarget: true,
			buttons: [
				{
					text: 'Back',
					action: tour.back,
				},
				{
					text: 'Next',
					action: () => {
						store.modelI = 0
						tour.next()
					},
				},
			],
		},
		{
			id: 'chart',
			title: 'Equity chart',
			text: 'This line chart shows the evolution of the equity of each bank in the network over time. The x-axis represents time, and the y-axis represents the total equity. This chart will update dynamically as the model parameters are adjusted, allowing you to see the impact of different shocks and configurations on the network.<br>You can drag the thick white bar to move through the model steps.',
			attachTo: {
				element: '#lineChart',
				on: 'top',
			},
			cancelIcon: {
				enabled: true,
			},
			canClickTarget: true,
			buttons: [
				{
					text: 'Back',
					action: tour.back,
				},
				{
					text: 'Next',
					action: () => {
						store.selectedNode = 5
						store.selectedLiability = { to: 1, from: 5 }
						store.modelI = 7
						tour.next()
					},
				},
			],
		},
		{
			id: 'value1',
			title: 'Valuation function',
			text: 'As the model evolves, the values of banks in the network will decrease. This results in a reduction in the effective values of the interbank loans, which in turn has a knock-on effect on the values of banks owed money. The effective value of a loan is illustrated here by the decreasing width of the arrow.',
			attachTo: {
				element: '#graph .chord.highlight',
				on: 'bottom',
			},
			cancelIcon: {
				enabled: true,
			},
			canClickTarget: false,
			buttons: [
				{
					text: 'Back',
					action: tour.back,
				},
				{
					text: 'Next',
					action: () => {
						tour.next()
					},
				},
			],
			when: {
				show: () => {
					store.selectedNode = 5
					store.selectedLiability = { to: 1, from: 5 }
					store.modelI = 7
				},
			},
		},
		{
			id: 'value2',
			title: 'Valuation function',
			text: "The effective value of a bank can be seen here, alongside the equity associated with that bank. The valuation function can be interpreted as a measure of a bank's probability of default. The smaller the valuation function, the higher the likelihood the bank is in default.",
			attachTo: {
				element: '.control.info',
				on: 'left',
			},
			cancelIcon: {
				enabled: true,
			},
			canClickTarget: false,
			buttons: [
				{
					text: 'Back',
					action: () => {
						store.selectedNode = 5
						store.selectedLiability = { to: 1, from: 5 }
						store.modelI = 7
						tour.back()
					},
				},
				{
					text: 'Next',
					action: () => {
						tour.next()
					},
				},
			],
			when: {
				show: () => {
					store.selectedLiability = { to: 1, from: 5 }
					store.modelI = 6
				},
			},
		},
		{
			id: 'value3',
			title: 'Valuation function',
			text: 'The parameters controlling the valuation function can be adjusted here. For more details on what these parameters mean, click the help buttons, or see the model description document.',
			attachTo: {
				element: '#valuation',
				on: 'left',
			},
			cancelIcon: {
				enabled: true,
			},
			canClickTarget: true,
			buttons: [
				{
					text: 'Back',
					action: tour.back,
				},
				{
					text: 'Next',
					action: () => {
						tour.next()
					},
				},
			],
			when: {
				show: () => {
					store.selectedLiability = { to: 1, from: 5 }
					store.modelI = 6
				},
			},
		},
		{
			id: 'control',
			title: 'Control Panel',
			text: 'In addition to the features we have already seen, the control panel allows you to add/remove banks from the network, adjust their initial equities and liabilities, and set the initial shock. You can also select a predefined example network from the dropdown list, or import data from a CSV file.<br>You can select a bank to view its details by selecting it from the dropdown list, or clicking on it on one of the charts.<br>For further information, click the help button next to the appropriate control.',
			attachTo: {
				element: '.controls',
				on: 'left',
			},
			cancelIcon: {
				enabled: true,
			},
			canClickTarget: true,
			buttons: [
				{
					text: 'Back',
					action: tour.back,
				},
				{
					text: 'Finish tour',
					action: () => {
						store.modelI = 0
						tour.complete()
					},
				},
			],
		},
	]
}

type Labels = typeof labelsEn

const labels: Record<Language, Labels> = {
	en: labelsEn,
}

// Locale definitions from here: https://github.com/d3/d3-time-format/tree/main/locale
const enLocale: TimeLocaleDefinition = {
	dateTime: '%a %e %b %X %Y',
	date: '%d/%m/%Y',
	time: '%H:%M:%S',
	periods: ['AM', 'PM'],
	days: [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
	],
	shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
	months: [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	],
	shortMonths: [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	],
}

const locales: Record<Language, TimeLocaleDefinition> = {
	en: enLocale,
}

const LabelsKey: InjectionKey<ComputedRef<Labels>> = Symbol('labels')
function useLabels() {
	return inject(
		LabelsKey,
		computed(() => labels.en),
	)
}

function createI18n(langFunc: () => Language) {
	return (app: App) =>
		app.provide(
			LabelsKey,
			computed(() => labels[langFunc()]),
		)
}

export { createI18n, labels, langNames, locales, useLabels }
