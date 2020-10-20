export interface Artifacts<T> {
  type: T
  toolChain: string
  fitImage: string
  app: string
  dtb: string
  uboot: string
  zImage: string
  image: string
}

export interface Artifacts1 extends Artifacts<number> {
  test: string
}

export interface Artifacts2 extends Artifacts<string> {
  test: string
}

export type Artifacts3 = Artifacts<boolean>
