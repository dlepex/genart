

export type LazyStr = () => string

export function assert(cond: boolean, msg: string | LazyStr) {
	if (!cond) {
		let m = (typeof msg == 'function')? msg() : msg
		throw new Error(`Assertion failed: ${m}`)
	}
}


export let jsonStr = JSON.stringify

export type Opt<T> = T | undefined
export type OptNull<T> = T | undefined | null
	