

export type LazyStr = () => string

export function assert(cond: boolean, msg: string | LazyStr, ...args:any[]) {
	if (!cond) {
		let m = (typeof msg == 'function')? msg() : msg
		console.error(m, args)
		throw assertFailedErr(m)
	}
}
export let jsonStr = JSON.stringify
export type Opt<T> = T | undefined
export type OptNull<T> = T | undefined | null



export function illegalArgErr(msg: string): Error {
	return {name: 'IllegalArgumentError', message: msg }
}

export function assertFailedErr(msg: string): Error {
	return {name: 'AssertFailedError', message: msg }
}
	