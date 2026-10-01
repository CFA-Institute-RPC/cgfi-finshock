// Helper function for matrix sum along rows
function rowSum(matrix: Array<Array<number>>, i: number): number {
	let sum: number = 0
	for (let j = 0; j < matrix[i].length; j++) {
		sum += matrix[i][j]
	}
	return sum
}

// Helper function for matrix sum along rows
function colSum(matrix: Array<Array<number>>, j: number): number {
	let sum: number = 0
	for (let i = 0; i < matrix.length; i++) {
		sum += matrix[i][j]
	}
	return sum
}

const erfCof = [
	-1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2,
	-9.561514786808631e-3, -9.46595344482036e-4, 3.66839497852761e-4,
	4.2523324806907e-5, -2.0278578112534e-5, -1.624290004647e-6, 1.30365583558e-6,
	1.5626441722e-8, -8.5238095915e-8, 6.529054439e-9, 5.059343495e-9,
	-9.91364156e-10, -2.27365122e-10, 9.6467911e-11, 2.394038e-12, -6.886027e-12,
	8.94487e-13, 3.13092e-13, -1.12708e-13, 3.81e-16, 7.106e-15, -1.523e-15,
	-9.4e-17, 1.21e-16, -2.8e-17,
]
function erf(x: number): number {
	let j = erfCof.length - 1
	let isneg = false
	let d: number = 0
	let dd: number = 0
	let t: number, ty: number, tmp: number, res: number

	if (x < 0) {
		x = -x
		isneg = true
	}

	t = 2 / (2 + x)
	ty = 4 * t - 2

	for (; j > 0; j--) {
		tmp = d
		d = ty * d - dd + erfCof[j]
		dd = tmp
	}

	res = t * Math.exp(-x * x + 0.5 * (erfCof[0] + ty * d) - dd)
	return isneg ? res - 1 : 1 - res
}

function normalCDF(x: number): number {
	// Standard normal CDF with mean 0 and standard deviation 1
	return 0.5 * (1.0 + erf(x / Math.sqrt(2.0)))
}

const gammaCof = [
	76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155,
	0.1208650973866179e-2, -0.5395239384953e-5,
]
function gammaln(x: number): number {
	let j = 0
	let ser = 1.000000000190015
	let xx: number, y: number, tmp: number
	tmp = (y = xx = x) + 5.5
	tmp -= (xx + 0.5) * Math.log(tmp)
	for (; j < 6; j++) ser += gammaCof[j] / ++y
	return Math.log((2.5066282746310005 * ser) / xx) - tmp
}

function betacf(x: number, a: number, b: number): number {
	let fpmin: number = 1e-30
	let m: number = 1
	let qab: number = a + b
	let qap: number = a + 1
	let qam: number = a - 1
	let c: number = 1
	let d: number = 1 - (qab * x) / qap
	let m2: number, aa: number, del: number, h: number

	// These q's will be used in factors that occur in the coefficients
	if (Math.abs(d) < fpmin) d = fpmin
	d = 1 / d
	h = d

	for (; m <= 100; m++) {
		m2 = 2 * m
		aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
		// One step (the even one) of the recurrence
		d = 1 + aa * d
		if (Math.abs(d) < fpmin) d = fpmin
		c = 1 + aa / c
		if (Math.abs(c) < fpmin) c = fpmin
		d = 1 / d
		h *= d * c
		aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
		// Next step of the recurrence (the odd one)
		d = 1 + aa * d
		if (Math.abs(d) < fpmin) d = fpmin
		c = 1 + aa / c
		if (Math.abs(c) < fpmin) c = fpmin
		d = 1 / d
		del = d * c
		h *= del
		if (Math.abs(del - 1.0) < 3e-7) break
	}

	return h
}
function iBeta(x: number, a: number, b: number): number {
	// Factors in front of the continued fraction.
	let bt =
		x === 0 || x === 1
			? 0
			: Math.exp(
					gammaln(a + b) -
						gammaln(a) -
						gammaln(b) +
						a * Math.log(x) +
						b * Math.log(1 - x),
				)
	if (x < 0 || x > 1) throw new Error('Argument x must be between 0 and 1.')
	if (x < (a + 1) / (a + b + 2))
		// Use continued fraction directly.
		return (bt * betacf(x, a, b)) / a
	// else use continued fraction after making the symmetry transformation.
	return 1 - (bt * betacf(1 - x, b, a)) / b
}

function betaCDF(x: number, a: number, b: number): number {
	if (x > 1) return 1
	if (x < 0) return 0
	return iBeta(x, a, b)
}

function distressVal(
	L: Array<Array<number>>,
	EL: Array<number>,
	OE: Array<number>,
	k: Array<number>,
	R: number,
	a: number,
	b: number,
): Array<number> {
	let frac: Array<number> = new Array(OE.length)
	for (let i = 0; i < OE.length; i++) {
		frac[i] = 1 + OE[i] / (rowSum(L, i) + EL[i])
		if (!isFinite(frac[i]) || isNaN(frac[i])) {
			frac[i] = 0
		}
		if (k[i] === 0) {
			frac[i] = frac[i] >= 1 ? 1 : 0
		} else {
			frac[i] =
				(frac[i] >= 1 + k[i] ? 1 : 0) +
				(frac[i] >= 1 && frac[i] < 1 + k[i]
					? 1 - R * betaCDF((1 + k[i] - frac[i]) / k[i], a, b)
					: 0)
		}
	}
	return frac
}

function mertonVal(
	Ae: Array<number>,
	X: Array<number>,
	OE2: Array<number>,
	R: number,
	vol: number,
	maturity: number,
): Array<number> {
	const ret: Array<number> = new Array(OE2.length)
	for (let i = 0; i < OE2.length; i++) {
		ret[i] = OE2[i] / (Ae[i] - X[i])
		if (ret[i] >= 1) {
			ret[i] = 1
		} else {
			ret[i] =
				1 -
				R *
					(1 -
						normalCDF(
							(Math.log(1 / (1 - ret[i])) - (vol * vol * maturity) / 2) /
								(vol * Math.sqrt(maturity)),
						))
		}
	}

	return ret
}

function blackVal(
	ExtA: Array<number>,
	X: Array<number>,
	OE2: Array<number>,
	R: number,
	vol: number,
	maturity: number,
): Array<number> {
	const val = new Array<number>(OE2.length)
	for (let i = 0; i < OE2.length; i++) {
		const levi = OE2[i] / (ExtA[i] - X[i])
		if (levi >= 1) {
			val[i] = 1
		} else if (levi >= 0 && levi < 1) {
			const part1 = normalCDF(
				(Math.log(1 / (1 - levi)) - (vol * vol * maturity) / 2) /
					(vol * Math.sqrt(maturity)),
			)
			const part2 =
				(1 / (1 - levi)) *
				normalCDF(
					(-Math.log(1 / (1 - levi)) - (vol * vol * maturity) / 2) /
						(vol * Math.sqrt(maturity)),
				)
			val[i] = 1 - R * (1 - part1 + part2)
		} else {
			val[i] = 1 - R
		}
	}
	return val
}

function getCopy(E: Array<number>): Array<number> {
	const Ecopy: Array<number> = new Array(E.length)
	for (let i = 0; i < E.length; i++) {
		Ecopy[i] = E[i]
	}
	return Ecopy
}

// Main function
function iterateModel(
	Ae: Array<number>,
	X: Array<number>,
	L: Array<Array<number>>,
	Le: Array<number>,
	k: Array<number>,
	Type: string,
	R: number,
	a: number,
	b: number,
	volatility: number,
	maturityT: number,
): Array<Array<Array<number>>> {
	/*
	 * Ae: External assets
	 * X: Shock
	 * L: Liabilities matrix
	 * Le: External liabilities
	 */
	const eqVals: Array<Array<number>> = []
	const effectiveAssetVals: Array<Array<number>> = []

	let E: Array<number> = new Array(Ae.length)
	for (let i = 0; i < Ae.length; i++) {
		E[i] = Ae[i] + colSum(L, i) - rowSum(L, i) - Le[i]
	}

	// eqVals stores the successive steps in the model run.
	// So we push E(0) to eqVals
	eqVals.push(getCopy(E))
	const initEffectiveAssetVals: Array<number> = new Array(L.length)
	let valuations: Array<number>
	initEffectiveAssetVals.fill(1)
	effectiveAssetVals.push(initEffectiveAssetVals)

	if (Type === 'Distress') {
		let shockPresent = false
		for (let x of X) {
			if (x !== 0) {
				shockPresent = true
				break
			}
		}
		if (!shockPresent) {
			return [eqVals, effectiveAssetVals]
		}
	}

	// Now calculate E(1) and push it to eqVals
	for (let i = 0; i < Ae.length; i++) {
		E[i] = Ae[i] - X[i] + colSum(L, i) - rowSum(L, i) - Le[i]
	}
	eqVals.push(getCopy(E))

	let iteration = 0
	const max_iterations = 5000
	let OE: Array<number> = new Array(E.length)
	for (let i = 0; i < E.length; i++) {
		OE[i] = 1e9
	}
	let notThereYet = true

	// Now we iterate until convergence or max_iterations
	// Each maturityT step we re-assess the relative values of the nodes
	// This valuation provides the basis for reassesssing the equity values of each node
	while (notThereYet && iteration < max_iterations) {
		notThereYet = false
		for (let i = 0; i < E.length; i++) {
			if (Math.abs(E[i] - OE[i]) > 1e-6) {
				notThereYet = true
				break
			}
		}

		OE = getCopy(E)
		if (Type === 'Distress') {
			valuations = distressVal(L, Le, OE, k, R, a, b)
		} else if (Type === 'Merton') {
			valuations = mertonVal(Ae, X, OE, R, volatility, maturityT)
		} else if (Type === 'Black') {
			valuations = blackVal(Ae, X, OE, R, volatility, maturityT)
		} else {
			throw new Error('Unknown Type specified.')
		}
		effectiveAssetVals.push(getCopy(valuations))

		// The definition of the new value for equity is:
		//
		// External assets - external liabilities
		// Plus assets from other nodes (liabilities in the L-matrix), multiplied by the effective value of that node
		// Minus the liabilities to other nodes.

		E = new Array(E.length)
		for (let i = 0; i < E.length; i++) {
			let effLSum: number = 0
			let intASum: number = 0
			for (let j = 0; j < L.length; j++) {
				effLSum += L[j][i] * valuations[j]
				intASum += L[i][j]
			}
			E[i] = Ae[i] - X[i] + effLSum - intASum - Le[i]
		}
		eqVals.push(getCopy(E))
		iteration++
	}
	// Once more, so we can save the final effective asset values
	OE = getCopy(E)
	if (Type === 'Distress') {
		valuations = distressVal(L, Le, OE, k, R, a, b)
	} else if (Type === 'Merton') {
		valuations = mertonVal(Ae, X, OE, R, volatility, maturityT)
	} else if (Type === 'Black') {
		valuations = blackVal(Ae, X, OE, R, volatility, maturityT)
	} else {
		throw new Error('Unknown Type specified.')
	}
	effectiveAssetVals.push(getCopy(valuations))

	if (iteration >= max_iterations) {
		console.warn('Maximum iterations reached without convergence.')
	}

	return [eqVals, effectiveAssetVals]
}

export function getEquities(
	extAssets: Array<number>,
	extLiabilities: Array<number>,
	liabilityMatrix: Array<Array<number>>,
): Array<number> {
	const ret = new Array<number>(extAssets.length)
	for (let i = 0; i < extAssets.length; i++) {
		ret[i] =
			extAssets[i] +
			colSum(liabilityMatrix, i) -
			rowSum(liabilityMatrix, i) -
			extLiabilities[i]
	}
	return ret
}

export function runModel(
	extAssets: Array<number>,
	extLiabilities: Array<number>,
	liabilityMatrix: Array<Array<number>>,
	shock: Array<number>,
	type: string = 'Distress',
	R: number = 1,
	a: number = 1,
	b: number = 1,
	volatility: number = 0.5,
	maturityT: number = 5,
): Array<Array<Array<number>>> {
	// Initial equity
	const E0: Array<number> = getEquities(
		extAssets,
		extLiabilities,
		liabilityMatrix,
	)
	const k0: Array<number> = new Array(E0.length)
	for (let i = 0; i < E0.length; i++) {
		k0[i] = E0[i] / (rowSum(liabilityMatrix, i) + extLiabilities[i])
	}

	return iterateModel(
		extAssets,
		shock,
		liabilityMatrix,
		extLiabilities,
		k0,
		type,
		R,
		a,
		b,
		volatility,
		maturityT,
	)
}
