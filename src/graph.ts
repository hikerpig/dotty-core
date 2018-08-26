"use strict"

class IndexOutOfBoundsException extends Error {}

export class BaseGraph {
  E: number
  V: number
  protected _adj: number[][] = []

  constructor(V: number) {
    this.V = V
    this.E = 0
    this._adj = new Array(V)
    for (let i = 0; i < V; i++) {
      this._adj[i] = []
    }
  }

  /**
   * Get adjacent vertices of a vertex
   */
  adj(v: number) {
    return this._adj[v]
  }
}

export class Graph extends BaseGraph {

  addEdge(v: number, w: number) {
    if (v < 0 || v >= this.V) throw new IndexOutOfBoundsException()
    if (w < 0 || w >= this.V) throw new IndexOutOfBoundsException()
    this.E++
    this._adj[v].push(w)
    this._adj[w].push(v)
  }
}

export class Digraph extends BaseGraph {
  addEdge(v: number, w: number) {
    if (v < 0 || v >= this.V) throw new IndexOutOfBoundsException()
    if (w < 0 || w >= this.V) throw new IndexOutOfBoundsException()
    this.E++
    this._adj[v].push(w)
  }

  reverse() {
    const g = new Digraph(this.V)
    for (let v = 0; v < this.V; v++) {
      this.adj(v).map((w: number) => g.addEdge(w, v))
    }
  }

  inspect() {
    let strs = ['digraph:']
    for (const list of this._adj) {
      if (list.length) {
        strs.push(list.join('->'))
      }
    }
    return strs.join('\n')
  }
}
