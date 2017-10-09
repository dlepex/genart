
import {assert, jsonStr, Opt, illegalArgErr} from "util/util"
import {traceFor} from "util/log"
import _ from "lodash"

const [trace, isTraceOn]  = traceFor("lsys")

export type Term = {
	type: string
}
export type NonFlatArray<T> = (T|T[])[]
export type RewriterFunc = (from: Term, ctx: RuleCtx, left?: Term, right?: Term) => NonFlatArray<Term>
export type FromWithCtx = [string[],string,string[]] // [[leftctx], from, [rightctx]]

export interface RuleConf {
	from: string | FromWithCtx
	to: NonFlatArray<Term> | RewriterFunc
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

function matchCtx(c: RuleCtxImpl, sgn: 1|-1, ll: Opt<string[]>, cl: Opt<Term>): boolean {
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

	constructor(private c: RuleConf) {
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
			if (_.isEmpty(this.ll) && _.isEmpty(this.rr)) {
				this.requiresCtx = false
			}
		}
		if (typeof c.to === 'function') {
			this.apply = c.to
		} else {
			let arr = c.to
			this.apply = () => arr
		}
	}
	matches(c: RuleCtxImpl): boolean {
		if (!this.requiresCtx) {
			return true
		}
		if (!matchCtx(c, 1, this.rr, c.r) || !matchCtx(c, -1, this.ll, c.l)) {
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

export interface RuleSysConf {
	rules: RuleConf[]
	init?: Term[] // aka axiom, it's possible to call init() later.
}

export interface RuleSystem {
	readonly state: Term[]
	readonly step: number

	init(state: Term[]): void
	next(): Term[]
}

export function ruleSystem(c: RuleSysConf): RuleSystem {
	return new RuleSystemImpl(c);
}

class RuleSystemImpl {
	private rmap: Map<string, Rule[]>
  state: Term[]
	step: number

 constructor(conf: RuleSysConf) {
		let ruleCfgs = conf.rules
		let rules = ruleCfgs.map(c => new Rule(c))
		this.rmap = new Map()
		rules.forEach((rule, index) => {
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
		this.rmap.forEach(rules => Rule.sort(rules))
		trace("Created RuleSystem", this.rmap)
		if (conf.init) {
			this.init(conf.init)
		}
	}

	init(state: Term[]) {
		if (!state) throw illegalArgErr('state')
		this.state = state;
		this.step = 0
	}

	next(): Term[] {
		let state = this.state
		if (!state.length) {
			return state
		}
		let newState: Term[] = []
		let maxIndex  = state.length - 1
		let ctx = new RuleCtxImpl()
		ctx.state = state;
		for (let index = 0; index <= maxIndex; ++index) {
			let from = state[index]
			if (!from) {
				assert(false, `Corrupted state: ${jsonStr(state)} idx: ${index} step: ${this.step}`)
			}
			let rules = this.rmap.get(from.type)
			let terms: Opt<NonFlatArray<Term>>
			if (rules) {
				ctx.idx = index; ctx.l = state[index - 1]; ctx.r = state[index + 1]
				let rule = rules.find(r => r.matches(ctx))
				if (rule) {
					if(isTraceOn) trace('Applying rule', rule, ctx, `at ${index} step: ${this.step}`)
					terms = rule.apply(from, ctx, ctx.l, ctx.r)
				}
			}
			if (terms) {
				terms.forEach(t => {
					if (!_.isArray(t)) {
						newState.push(t)
					} else {
						newState.push(...t)
					}
				})
			} else {
				newState.push(from)
			}
		}
		this.state = newState
		this.step ++
		return newState
	}
}
