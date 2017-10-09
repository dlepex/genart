import {Term} from "lsys/rules"
import {Opt} from "util/util"
import _ from "lodash"

type Color = paper.Color

interface Style {
	penWidth: number;
	penColor: paper.Color
}

export interface State {
	x: number;
	y: number;
	angle: number; 
	style: Style
}

export class Turtle {
	private stack:State[]
	private state: State
	scale: number
	lineWidthMult: number


	constructor(private p:p5, s: State) {
		this.scale = c.scale || 1
		this.lineWidthMult = c.penWidthMult || 1
		this.state = {x: c.x||0, y: c.y||0, angle:0,penWidth:1}
		this.stack= []
	}

	pushState() {
		this.stack.push(_.cloneDeep(this.state))
	}

	popState() {
		let state = this.stack.pop()
		if (!state) {
			throw new Error("states stack is empty")
		}
		this.state = state
	}

	lineWidth(delta: number) {
		this.state.penWidth += delta
	}

	angle(delta: number) {
		this.state.angle += this.p.radians(delta);
	}

	line(delta: number, invisible?:boolean ) {
		let s = this.state;
		if (delta < 0) {
			this.angle(180)
			delta *= -1;
		}
		let d = delta*this.scale
		let p = this.p;
		let x = s.x
		let y = s.y
		s.x = s.x + d * p.cos(s.angle);
		s.y = s.y + d * p.sin(s.angle);
		if (invisible) return
		p.strokeWeight(Math.max((s.penWidth * this.lineWidthMult)|0, 1))
		p.line(x, y, s.x, s.y)
	}

	move(delta: number) {
		this.line(delta, true)
	}
}


export interface TurtleCommandsDefaults {
	angle: number // angle default
	move: number // forward default
}



export type TurtleAction = 'f'|'b'|'>'|'<'|'+'|'-'|'['|']'|'!'
export type TurtleParametrizedCmd = [TurtleAction, any]
export type TurtleCmd = TurtleAction|TurtleParametrizedCmd


export function turtleDo(t: Turtle, def: TurtleCommandsDefaults, commands: TurtleCmd[]) {

	commands.forEach(cmd => {
		let action: string
		let param: any
		if(_.isArray(cmd)) {
			[action, param] = cmd
		} else {
			action = cmd
		}
		switch(action) {
			case '>': t.line(param || def.move); break
			case '<': t.line(- (param || def.move)); break
			case 'f': t.move(param || def.move); break
			case 'b': t.move(- (param || def.move)); break
			case '+': t.angle(param || def.angle); break
			case '-': t.angle(- (param || def.angle)); break
			case '[': t.pushState(); break
			case ']': t.popState(); break
			case '!': t.lineWidth(param || 1); break
		}
	})
}