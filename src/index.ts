
import {RuleSystem, Term, Rule} from "lsys/rules"

function init() {

	function mod(n: string): Term {
		return {type: n}
	}
	let A = mod('A')
	let B = mod('B')
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
		from: 'X', left:'B',
		to: (from) => {
			return Math.random() < 0.5 ? [Q] : [F]
		}
	}])

	rs.init([B])

	for(let n = 5; n > 0; --n) {
		rs.next()
		console.log(rs.state())
	}
	console.log("Hello World FTW")
}

init()

