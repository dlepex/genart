
import {RuleSystem, Term, RuleConf} from "lsys/rules"

function init() {

	function mod(n: string): Term {
		return {type: n}
	}
	let [A, B] = [mod('A'), mod('B')]
	let X = mod('X')
	let Q = mod('Q')
	let F = mod('F')
	
	let rs = new RuleSystem([{
		from: 'A', 
		to: [A, B]
	},{
		from: 'B', 
		to: [X, A]
	}, {
		from: [[],'X',['X']],
		to: (from) => {
			return Math.random() < 0.5 ? [Q] : [F]
		}
	}, {
		from: [['X'],'A',['B']],
		to: (from) => {
			return [mod('$K')]
		}
	}])

	rs.init([B])

	for(let n = 5; n > 0; --n) {
		let st = rs.next()
		console.log(st)
	}
	console.log("Hello World FTW")
}

init()

