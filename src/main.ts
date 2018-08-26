import { Graph } from './graph'

type Dot = {
  index: number
  color: string
  row: number
  col: number
}

const DELIMITER = ','

const data1 = `
gr, pu, gr
tu, bk, tu
bk, pi, bk
pu, bk, pu
  , pu
`

const data2 = `
yl, db, db, lb, pu
pu, lb, pi, yl, yl
lb, pu, lb, db, yl
lb, pu, pi, pu, pu
pu, yl, pi, pu, pu
  ,   , pi,
`

interface DottyPuzzle {
  dots: Dot[]
  graph: Graph
}

function parseInput(input: string): DottyPuzzle {
  const lines = input.split('\n').map((s: string) => s.trim())
    .filter((s: string) => s.length > 0)
  const dots: Dot[] = []
  let dotindex = 0
  const dotMatrix: Array<Dot[]> = []
  lines.reverse().forEach((line: string, row: number) => {
    if (!dotMatrix[row]) {
      dotMatrix[row] = []
    }
    const segs = line.split(DELIMITER)
    segs.forEach((seg: string, col: number) => {
      const colorStr = seg.trim()
      if (colorStr) {
        const dot = {
          index: dotindex++,
          color: colorStr,
          originColor: colorStr,
          row,
          col,
        }
        dots.push(dot)
        dotMatrix[row][col] = dot
      } else {
        dotMatrix[row][col] = null
      }
    })
  })

  const g = new Graph(dots.length)
  dotMatrix.forEach((arr, r) => {
    arr.forEach((dot, c) => {
      if (!dot) return
      const right = dotMatrix[r][c+1]
      if (right) {
        // console.log('right', right)
        g.addEdge(dot.index, right.index)
      }
      const down = dotMatrix[r+1] && dotMatrix[r+1][c]
      if (down) {
        g.addEdge(dot.index, down.index)
      }
    })
  })

  // console.log('dots', dots)
  // console.log('g', g)


  return {
    dots,
    graph: g,
  }
}

// type MarkPredicate = (d1: Dot, d2: Dot) => { shouldMark: boolean }

abstract class BaseBfs {
  marked: boolean[]
  dotty: DottyPuzzle

  abstract doMark(v: number)
  abstract predicate(v: number, w: number): { shouldMark: boolean }

  start() {
    this.bfs(this.dotty.graph, 0, this.predicate.bind(this))
  }

  protected bfs(g: Graph, v: number, predicate, onMarkRejected?) {
    this.marked[v] = true
    this.doMark(v)

    for (const w of g.adj(v)) {
      if (!this.marked[w]) {
        const pResult = predicate(v, w)
        if (pResult.shouldMark) {
          // console.log('should mark', w)
          this.bfs(g, w, predicate), onMarkRejected
        } else {
          if (onMarkRejected) {
            onMarkRejected.call(this, v, w)
          }
        }
      }
    }
  }
}

class Tainter extends BaseBfs {
  sourceColor: string
  destColor: string

  constructor(dotty: DottyPuzzle, sc: string, dc: string) {
    super()
    this.sourceColor = sc
    this.destColor = dc
    this.dotty = dotty
    const g = dotty.graph
    this.marked = new Array(g.V)
  }

  predicate(v: number, w: number) {
    const d2 = this.dotty.dots[w]
    // console.log( d2, this.sourceColor)
    // const shouldMark = d1.color === d2.color
    const shouldMark = d2.color === this.sourceColor
    // if (shouldMark) {
    //   console.log('should mark', d2)
    // }
    return { shouldMark }
  }

  doMark(v: number) {
    this.dotty.dots[v].color = this.destColor
    this.marked[v] = true
  }
}

class Checker extends BaseBfs {
  sourceColor: string
  mismatched: boolean

  constructor(dotty: DottyPuzzle, sc: string) {
    super()
    this.sourceColor = sc
    this.dotty = dotty
    const g = dotty.graph
    this.marked = new Array(g.V)
  }

  predicate(v: number, w: number) {
    const d2 = this.dotty.dots[w]
    const shouldMark = d2.color === this.sourceColor
    // if (shouldMark) {
    //   console.log('should mark', d2)
    // }
    return { shouldMark }
  }

  checkDotty() {
    this.bfs(this.dotty.graph, 0, this.predicate.bind(this), this.onMarkRejected)
    const headColor = this.dotty.dots[0].color
    let passed = true
    if (this.mismatched) passed = false
    else {
      this.dotty.dots.forEach((dot) => {
        if (dot.color != headColor) {
          passed = false
        }
      })

    }
    return {
      passed
    }
  }

  protected onMarkRejected() {
    // console.log('onMarkRejected')
    this.mismatched = true
  }

  doMark(v: number) {
  }
}

type Color = string

interface StepSnapshot {
  // dots: Dot[]
  color: Color
}

class Solver {
  posibleColors = []
  dotty: DottyPuzzle
  protected stepSnapshots: Array<StepSnapshot> = []
  maxSteps = 6
  passed = false

  constructor(dotty: DottyPuzzle, maxSteps: number) {
    const posibleColors = this.getPosibleColors(dotty.dots)
    this.posibleColors = posibleColors
    // console.log('before taint', dotty.dots)
    this.dotty = dotty
    this.maxSteps = maxSteps
  }

  protected addSnapshot(step:number, dots: Dot[], color: Color) {
    const snapshot = {
      // dots,
      color,
    }
    this.stepSnapshots[step] = snapshot
  }

  solve() {
    this.runStep(0, this.dotty.dots)
    return {
      passed: this.passed,
      steps: this.stepSnapshots.map((snapshot) => snapshot.color),
    }
  }

  runStep(step: number, inputDots: Dot[]) {
    if (this.passed) return
    const posibleColors = this.getPosibleColors(inputDots)

    for (const color of posibleColors) {
      const dots = inputDots.map((dot) => { return {...dot}})
      const curHeadColor = dots[0].color
      const newDotty = {
        graph: this.dotty.graph,
        dots,
      }
      this.addSnapshot(step, dots, color)
      dots[0].color = color
      let tainter = new Tainter(newDotty, curHeadColor, color)
      tainter.start()
      const checker = new Checker(newDotty, color)
      const cr = checker.checkDotty()

      // console.log('check result', cr)
      if (cr.passed) {
        // console.log(`passed at step ${step}`)
        // console.log(this.stepSnapshots)
        this.passed = true
        return
      }
      if (step < this.maxSteps) {
        this.runStep(step + 1, dots)
      }
    }
  }
  getPosibleColors(dots: Dot[]) {
    return dots.reduce((out, dot) => {
      if (out.indexOf(dot.color) === -1) {
        out.push(dot.color)
      }
      return out
    }, [])
  }
}

function solveDotty(dotty: DottyPuzzle) {
  const { graph, dots } = dotty
  const maxSteps = 6
  const solver = new Solver(dotty, maxSteps)
  const result = solver.solve()
  if (result.passed) {
    console.info('passed')
    console.log(result.steps)
  } else {
    console.warn(`Can not solve the puzzle in ${maxSteps}`)
  }
}

function main() {
  // const dotty = parseInput(data1)
  const dotty = parseInput(data2)
  solveDotty(dotty)
}

main()