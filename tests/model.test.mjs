// Run with: npm test  (node --test tests/model.test.mjs)
// Needs Node >= 22.18 (built-in TypeScript type stripping), no dependencies.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runModel } from '../src/lib/model.ts'

const VOL = 0.5
const T = 5

// Two banks, no shock. Bank 0 holds 20 of external assets and owes 10 to bank 1,
// so its equity is 10 and its capital ratio E / (Ae - X) is 0.5.
// Bank 0 holds no interbank assets, so its equity (and its valuation) is fixed
// from the first iteration and the final valuation is exactly the one-period value.
function finalValuations(type, { R = 1, extAssets = [20, 10], liabilities = [[0, 10], [0, 0]] } = {}) {
	const [, effectiveValues] = runModel(
		extAssets,
		[0, 0],
		liabilities,
		[0, 0],
		type,
		R,
		1,
		1,
		VOL,
		T,
	)
	return effectiveValues[effectiveValues.length - 1]
}

// Reference values: closed-form first-passage survival with zero drift in assets,
// computed independently with scipy.stats.norm. A 200k-path Monte Carlo with 2,000
// monitoring steps gives 0.294 for the 0.5 case (discrete monitoring biases it up).
//   S = N((m - s^2 T / 2) / (s sqrt T)) - (A/D) N((-m - s^2 T / 2) / (s sqrt T)),  m = ln(A/D)
test('Black-Cox valuation matches the first-passage survival probability', () => {
	const [v0] = finalValuations('Black')
	assert.ok(Math.abs(v0 - 0.285898) < 1e-4, `expected ~0.2859, got ${v0}`)
})

test('Merton valuation matches N(d2) (unchanged by this fix)', () => {
	const [v0] = finalValuations('Merton')
	assert.ok(Math.abs(v0 - 0.524302) < 1e-4, `expected ~0.5243, got ${v0}`)
})

test('Black-Cox values a bank whose equity equals its external assets at par, like Merton and the R script', () => {
	// Bank 0 owes 10 and is owed 10, so E = Ae and the capital ratio is exactly 1.
	const [v0] = finalValuations('Black', {
		extAssets: [10, 10],
		liabilities: [[0, 10], [10, 0]],
	})
	assert.equal(v0, 1)
})

test('R is a loss given default: R = 0 leaves interbank claims at full value', () => {
	const [v0] = finalValuations('Merton', { R: 0 })
	assert.equal(v0, 1)
})

test('realdata.csv follows the documented import format (header row, then N banks with 4 + N columns)', async () => {
	const { readFile } = await import('node:fs/promises')
	const text = (await readFile(new URL('../realdata.csv', import.meta.url), 'utf8')).replace(/^﻿/, '')
	// Same rule as importData() in src/store/store.ts: the first line is a header and is dropped.
	const rows = text
		.split(/\r?\n/)
		.slice(1)
		.filter((line) => line.trim() !== '')
		.map((line) => line.split(','))
	const owedByColumns = rows[0].length - 4
	assert.equal(rows.length, owedByColumns, 'number of banks must equal number of OwedBy columns')
	for (const row of rows) {
		assert.equal(row.length, 4 + owedByColumns)
		assert.ok(Number.isFinite(Number(row[2])), `ExtAssets of ${row[0]} is not numeric`)
	}
})
