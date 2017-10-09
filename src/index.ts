
import {RuleSystem, Term, RuleSysConf, ruleSystem} from "lsys/rules"

import {Turtle, command, Commander} from "cg/turtle"
import {assert} from "util/util"

function init() {

	function mod(n: string): Term {
		return {type: n}
	}
	let [A, B, K, C] = [mod('A'), mod('B'),mod('K'), mod('C')]
	let X = mod('X')
	let Q = mod('Q')
	let F = mod('F')

	let rs = ruleSystem({rules: [{
		from: 'A', to: [A, B]
	}, {
		from: [['B', 'X'],'A',['X']], to: [Q]
	}, {
		from: [['K'],'X',[]], to: () => [F]
	},{
		from: [['K'],'K',[]], to: () => [C]
	},{
		from: [['K'],'F',[]], to: () => [K]
	}, {
		from: [['X'],'A',['B']], to: [K]
	}]})

	rs.init([B])

	for(let n = 20; n > 0; --n) {
		let st = rs.next()
		console.log(st)
	}
	console.log("Hello World FTW")
}


function initProcessing(conf: any, init: (p:p5) => void) {
	new p5(init, 'drawing1')
}

function arg(x: any) {
	return x.arg
}
function lsys1(): RuleSystem {
	let c = command
	
	return ruleSystem({
		init: [c('>'),   c('-',120),c('>'),   c('-',120),c('>')],
		rules: [
		{
			from:'>', to: (f) => {
				let t = c('>', arg(f)/3)
				return [t,    c('+', 60), t,    c('-', 120), t,  c('+', 60), t]
			}
		}
	]})
}

function lsys2(): RuleSystem {
	let c = command


	interface Apice {
		type: string,
		arg: number
	} 
	
	return ruleSystem({
		init: [c('-',90), c('>',5)],
		rules: [{
			from:'>', to(f: Apice) {
				let s = arg(f)
				assert(!!s, "must have arg")
				return [c('<', s),   
				
					c('['), c('!', 0),c('-',30), c('>',s), c(']'),  
					c('['), c('+',25), c('>', s), c(']'), 
				
					
					c('-',10), c('<', s), c('+',20), c('>', s)]
			},
		}, {
			from: '<', to: (f) => [c('<', 2*arg(f))]
		}, {
			from: '!', to: [c('!',0)]
		}
	]})
}


function testTurtle() {
	let ls1 = lsys2()
	let st: Term[] = []
	
	for(let n = 5; n > 0; --n) {
		 st = ls1.next()
	}

	console.log(`state len`, st.length, st)
	
	initProcessing({}, p => {

		let tur = new Turtle(p, {x: 600, y:500,scale: 1, lineWidthMult: 0.3})
		let cmder = new Commander(tur, {a: 45, f: 10})
		p.setup = () => {
			p.createCanvas(1000, 1000);
			p.frameRate(50)
			st.forEach(s =>cmder.turtleDo(s))
		}

		let c = 1;
		let idx = 0;
		p.draw = () => {
		
		};
	})
}

init()
testTurtle()