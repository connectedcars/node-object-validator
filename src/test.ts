export interface Artifacts<T> {
  type: T
  toolChain: string
  image: MySub
}

export interface Artifacts1 extends Artifacts<number> {
  test: string
}

export type Artifacts3 = Artifacts<boolean>

export interface MySub {
  test: string
}
