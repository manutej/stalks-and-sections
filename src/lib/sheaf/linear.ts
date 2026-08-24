/** Tiny dense linear algebra for stalks (dims 2–16). */

export function zeros(n: number): number[] {
  return Array.from({ length: n }, () => 0);
}

export function zeros2(r: number, c: number): number[][] {
  return Array.from({ length: r }, () => zeros(c));
}

export function copy(a: number[]): number[] {
  return a.slice();
}

export function copy2(A: number[][]): number[][] {
  return A.map((row) => row.slice());
}

export function dot(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += (a[i] ?? 0) * (b[i] ?? 0);
  return s;
}

export function nrm2(a: number[]): number {
  return Math.sqrt(dot(a, a));
}

export function add(a: number[], b: number[]): number[] {
  const n = Math.max(a.length, b.length);
  const o = zeros(n);
  for (let i = 0; i < n; i++) o[i] = (a[i] ?? 0) + (b[i] ?? 0);
  return o;
}

export function sub(a: number[], b: number[]): number[] {
  const n = Math.max(a.length, b.length);
  const o = zeros(n);
  for (let i = 0; i < n; i++) o[i] = (a[i] ?? 0) - (b[i] ?? 0);
  return o;
}

export function scale(a: number[], s: number): number[] {
  return a.map((v) => v * s);
}

export function axpy(y: number[], a: number, x: number[]): void {
  const n = Math.min(y.length, x.length);
  for (let i = 0; i < n; i++) y[i]! += a * x[i]!;
}

export function matVec(M: number[][], x: number[]): number[] {
  const out = zeros(M.length);
  for (let i = 0; i < M.length; i++) {
    const row = M[i]!;
    let s = 0;
    const n = Math.min(row.length, x.length);
    for (let j = 0; j < n; j++) s += row[j]! * x[j]!;
    out[i] = s;
  }
  return out;
}

export function matTVec(M: number[][], y: number[]): number[] {
  const cols = M[0]?.length ?? 0;
  const out = zeros(cols);
  for (let i = 0; i < M.length; i++) {
    const yi = y[i] ?? 0;
    const row = M[i]!;
    for (let j = 0; j < cols; j++) out[j]! += row[j]! * yi;
  }
  return out;
}

export function identity(n: number): number[][] {
  const I = zeros2(n, n);
  for (let i = 0; i < n; i++) I[i]![i] = 1;
  return I;
}

/** Thin (or square) restriction: rows = outDim, cols = inDim. */
export function projector(outDim: number, inDim: number): number[][] {
  const M = zeros2(outDim, inDim);
  const k = Math.min(outDim, inDim);
  for (let i = 0; i < k; i++) M[i]![i] = 1;
  return M;
}

export function embedder(outDim: number, inDim: number): number[][] {
  return projector(outDim, inDim);
}

/** Orthonormal rows (when out ≤ in) via modified Gram–Schmidt. */
export function spectralMap(
  outDim: number,
  inDim: number,
  rng: () => number,
): number[][] {
  const M = zeros2(outDim, inDim);
  for (let i = 0; i < outDim; i++) {
    for (let j = 0; j < inDim; j++) M[i]![j] = rng() * 2 - 1;
    const row = M[i]!;
    for (let k = 0; k < i; k++) {
      const proj = dot(row, M[k]!);
      axpy(row, -proj, M[k]!);
    }
    const n = nrm2(row) || 1;
    for (let j = 0; j < inDim; j++) row[j]! /= n;
  }
  return M;
}

export function typeAwareMap(
  outDim: number,
  inDim: number,
  rng: () => number,
): number[][] {
  const M = zeros2(outDim, inDim);
  const k = Math.min(outDim, inDim);
  for (let i = 0; i < k; i++) {
    const j = Math.min(inDim - 1, Math.floor(rng() * inDim));
    M[i]![j] = rng() > 0.5 ? 1 : -1;
    if (rng() > 0.55 && j + 1 < inDim) M[i]![j + 1] = 0.35 * (rng() * 2 - 1);
  }
  return M;
}

/** Gaussian elimination for a small dense system A x = b. */
export function solve(Ain: number[][], bin: number[]): number[] {
  const n = Ain.length;
  const A = copy2(Ain);
  const b = copy(bin);
  for (let k = 0; k < n; k++) {
    let piv = k;
    let best = Math.abs(A[k]![k]!);
    for (let i = k + 1; i < n; i++) {
      const v = Math.abs(A[i]![k]!);
      if (v > best) {
        best = v;
        piv = i;
      }
    }
    if (best < 1e-12) {
      A[k]![k] = 1e-9;
    } else if (piv !== k) {
      const tmp = A[k]!;
      A[k] = A[piv]!;
      A[piv] = tmp;
      const tb = b[k]!;
      b[k] = b[piv]!;
      b[piv] = tb;
    }
    const akk = A[k]![k]!;
    for (let i = k + 1; i < n; i++) {
      const f = A[i]![k]! / akk;
      for (let j = k; j < n; j++) A[i]![j]! -= f * A[k]![j]!;
      b[i]! -= f * b[k]!;
    }
  }
  const x = zeros(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i]!;
    for (let j = i + 1; j < n; j++) s -= A[i]![j]! * x[j]!;
    x[i] = s / (A[i]![i] || 1e-9);
  }
  return x;
}

export function orthonormalPair(dim: number, rng: () => number): [number[], number[]] {
  const a = zeros(dim);
  const b = zeros(dim);
  for (let i = 0; i < dim; i++) {
    a[i] = rng() * 2 - 1;
    b[i] = rng() * 2 - 1;
  }
  const na = nrm2(a) || 1;
  for (let i = 0; i < dim; i++) a[i]! /= na;
  const proj = dot(b, a);
  axpy(b, -proj, a);
  const nb = nrm2(b) || 1;
  for (let i = 0; i < dim; i++) b[i]! /= nb;
  return [a, b];
}
