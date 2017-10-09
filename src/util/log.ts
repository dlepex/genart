import {Opt} from "util/util"

declare var GLOBAL_TRACE_CFG: Opt<{[key: string]:Opt<boolean>}>

export type LogFunc = (...rest: any[]) => void

const traceFunc: LogFunc = console.log
const emptyFunc: LogFunc = () => {} 


function optTraceFor(name: string): Opt<LogFunc> {
	if (!GLOBAL_TRACE_CFG) {
		return undefined
	}
	let funName = GLOBAL_TRACE_CFG[name]
	if(!funName) {
		return undefined
	}
	return console.log
}

export function traceFor(name: string): [LogFunc, boolean] {
	let f = optTraceFor(name)
	return [ f ||  emptyFunc, !!f ]
}
