
type Dot = {
  color: string
  row: number
  col: number
}

const DELIMITER = ','

const data1 = `
gr, pp, gr
tu, bk, tu
bk, pi, bk
pu, bk, pu
  , pu
`

function parseInput(input: string) {
  const lines = input.split('\n').map((s: string) => s.trim())
    .filter((s: string) => s.length > 0)
  const dots: Dot[] = []
  lines.reverse().forEach((line: string, row: number) => {
    const segs = line.split(DELIMITER)
    segs.forEach((seg: string, col: number) => {
      const colorStr = seg.trim()
      if (!colorStr) { return }
      const dot = {
        color: colorStr,
        row,
        col,
      }
      dots.push(dot)
    })
  })
  console.log('dots', dots)
}

parseInput(data1)