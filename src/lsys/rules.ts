
import {assert, jsonStr, Opt} from "util/util"
import _ from "lodash"

export type Term = {
	type: string
}

export type RewriterFunc = (from: Term, ctx: RuleCtx, left?: Term, right?: Term) => Term[]
export type FromWithCtx = [string[],string,string[]] // [[leftctx], from, [rightctx]]

export interface RuleConf {
	from: string | FromWithCtx
	to: Term[] | RewriterFunc
	priority?: number
}

function termType(t: Opt<Term>): Opt<string> {
	return t ? t.type : undefined
}

export interface RuleCtx {
	readonly l?: Term
  readonly r?: Term
	ln(count: number): Opt<Term> // ln(0) == l
	rn(count: number): Opt<Term> // rn(0) == r
}

class RuleCtxImpl {
	l?: Term
	r?: Term
	state: Term[]
	idx: number

	ln(count: number): Opt<Term> {
		return this.state[this.idx - count]
	}

	rn(count: number): Opt<Term> {
		return this.state[this.idx + count]
	}
}

function isValidCtx(c: RuleCtxImpl, sgn: 1|-1, ll: Opt<string[]>, cl: Opt<Term>): boolean {
	if (!ll || !ll.length) {
		return true;
	}
	if (!cl) return false;
	if (ll.length === 1) {
		return ll[0]  === cl.type;
	} else {
		return ll.every((v, i) => termType(c.state[c.idx + sgn*(i + 1)]) === v)
	}
}

class Rule {
	from: string
	requiresCtx: boolean
	ll?: string[]
	rr?: string[]
	apply: RewriterFunc
	order: number
	conf: RuleConf

	constructor(private c: RuleConf) {
		this.conf = c
		if (typeof c.from === 'string') {
			this.requiresCtx = false
			this.from = c.from
			this.order = c.priority || 0
		} else {
			this.requiresCtx = true
			this.from = c.from[1]
			this.ll = c.from[0]
			if (this.ll) {
				this.ll = this.ll.reverse()
			}
			this.rr = c.from[2]
			this.order = c.priority || (this.ll.length + this.rr.length);
		}
		if (typeof c.to === 'function') {
			this.apply = c.to
		} else {
			let arr: Term[] = c.to
			this.apply = () => arr
		}
	}
	matches(c: RuleCtxImpl): boolean {
		if (!this.requiresCtx) {
			return true
		}
		if (!isValidCtx(c, 1, this.rr, c.r)) {
			return false;
		}
		if (!isValidCtx(c, -1, this.ll, c.l)) {
			return false;
		}
		return true
	}

	static sort(rules: Rule[]) {
		rules.sort((a, b) => b.order - a.order);
	}

	equal(r: Rule): boolean {
		return r.from == this.from && _.isEqual(r.ll, this.ll) && _.isEqual(r.rr, this.rr);
	}
}



export class RuleSystem {
	private rmap: Map<string, Rule[]>
  state: Term[]
  step: number

	constructor(confList: RuleConf[]) {
		this.rmap = new Map()
		let p = new p5()
		p.ellipse(1, 2, 200, 20)
		let rl = confList.map(c => new Rule(c))

		rl.forEach((rule, index) => {
			let from = rule.from
			let list = this.rmap.get(from)
			if (list) {
				if (list.find(r => r.equal(rule))) {
					throw Error(`Identical rule found: ${from}, ${index}`)
				}
				list.push(rule)
			} else {
				this.rmap.set(from, [rule])
			}
		})
	}

	init(state: Term[]) {
		this.state = state;
		this.step = 0
	}

	next() {
		let state = this.state
		if (!state || state.length === 0) {
			return
		}
		let newState: Term[] = []
		let maxIndex  = this.state.length - 1
		let ctx = new RuleCtxImpl()
		ctx.state = this.state;
		for (let index = 0; index <= maxIndex; ++index) {
			let from = state[index]
			assert(from != null, () => `Corrupted state: ${jsonStr(state)} idx: ${index} step: ${this.step}`)
			let rules = this.rmap.get(from.type)
			let terms: Opt<Term[]>
			if (rules) {
				let rule = rules[0] // fix me.
				if (rule) {
					if (rule.requiresCtx) {
						ctx.idx = index
						ctx.l = index > 0 ? state[index - 1] : undefined
						ctx.r = index < maxIndex ? state[index + 1] : undefined
					}
					if (rule.matches(ctx)) {
						terms = rule.apply(from, ctx, ctx.l, ctx.r)
					}
				}
			}
			if (terms) {
				newState.push(...terms)
			} else {
				newState.push(from)
			}
		}
		this.state = newState
		this.step ++
		return newState
	}
}
