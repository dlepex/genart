
import {assert, strfy} from "util/util"



export type Term = {
	type: string
}

export type RewriterFunc = (from: Term, left?: Term, right?: Term) => Term[]

export interface Rule {
	from: string // [left?, from, to?]
	left?: string
	right?: string,
	match?:[string|null, string, string|null] // todo
	to: Term[] | RewriterFunc
}

function termType(t: Term|undefined): string|undefined {
	return t ? t.type : undefined
}

export class RuleSystem {
	private rmap: Map<string, Rule[]>
	private _state: Term[]
	private step: number

	constructor(rulesList: Rule[]) {
		this.rmap = new Map()
		rulesList.forEach((rule, index) => {
			let from = rule.from
			let list = this.rmap.get(from)
			if (list) {
				if (!list.every(v => (v.from === rule.from && (v.left !== rule.left || v.right !== rule.right)))) {
					throw Error(`Identical rule found: ${from}, ${index}`)
				}
				list.push(rule)
			} else {
				this.rmap.set(from, [rule])
			}
		})
	}

	init(state: Term[]) {
		this._state = state;
		this.step = 0
	}

	state(): Term[] {
		return this._state
	}

	stepNum(): number {
		return this.step
	}

	next() {
		let state = this._state
		if (!state || state.length === 0) {
			return
		}
		let newState: Term[] =[]
		let maxIndex  = this._state.length - 1
		for (let index = 0; index <= maxIndex; ++index) {
			let from = state[index]
			assert(from != null, () => `Corrupted state: ${strfy(state)} idx: ${index} step: ${this.step}`)
			let rules = this.rmap.get(from.type)
			let terms: Term[] | undefined
			if (rules) {
				let left = index > 0 ? state[index - 1] : undefined
				let right = index < maxIndex ? state[index + 1] : undefined
				let rule = rules.find(r => (!r.left || r.left === termType(left) && (!r.right || r.right === termType(right))))
				if (rule) {
					if (typeof rule.to == 'function') {
						terms = rule.to(from, left, right)
					} else {
						terms = rule.to
					}
				}
			}
			if (terms) {
				newState.push(...terms)
			} else {
				newState.push(from)
			}
		}
		this._state = newState
		this.step++
		return newState
	}
}
