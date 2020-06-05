import { hidden } from 'ansi-styles';

function cross1<A, B, C>(
  f: (a: A, b: B, c: C) => void,
  a: A,
  b: B,
  c: C
): void {
  const x: Parameters<typeof f> = [a, b, c];
  f.apply(undefined, [a, b, c]);
}

function cross2<A, B, C>(
  f: (a: A, b: B, c: C) => void,
  a: A | A[],
  b: B | B[],
  c: C | C[]
): void {
  // const x = arguments[0];
  const a1 = a instanceof Array ? a : [a];
  const b1 = b instanceof Array ? b : [b];
  const c1 = c instanceof Array ? c : [c];

  for (const a2 of a1) {
    for (const b2 of b1) {
      for (const c2 of c1) {
        f.apply(undefined, [a2, b2, c2]);
      }
    }
  }
}

// function foo<T extends Function>(f: T) {
//     const x: Parameters<typeof f>;
// }

// function bar<S, T extends (...args: S) => void>(f: T, ...args: S) {
//     const x: Parameters<typeof f> = [...arguments];
// }

function cross3<A, B, C>(
  f: (a: A, b: B, c: C) => void,
  a: A | A[],
  b: B | B[],
  c: C | C[]
): void {
  // const x = arguments[0];
  const a1 = a instanceof Array ? a : [a];
  const b1 = b instanceof Array ? b : [b];
  const c1 = c instanceof Array ? c : [c];

  for (const a2 of a1) {
    for (const b2 of b1) {
      for (const c2 of c1) {
        f.apply(undefined, [a2, b2, c2]);
      }
    }
  }
}

// // tslint:disable-next-line:no-any
// function args<T>(a: T | T[], ...rest: any) {
//     if (rest.length > 0) {
//         if (a instanceof Array) {
//             return [a, ...args(rest)];
//         } else {
//             return [[a], ...args(rest)];
//         }
//     } else {
//         return [];
//     }
// }

function print(a: string, b: number, c: boolean) {
  console.log(`a: ${a}, b: ${b}, c: ${c}`);
}

cross2(print, ['hello', 'world'], [1, 2, 3], [true, false]);

// // const p = args(1, [2], 'hello');

// // Convert args of A | A[] to A[]
// // tslint:disable-next-line:no-any
// function one<T, U extends any[]>(a:T, ...rest: U) {
//     // return [a, ...rest];
//     return rest;
// }

// function two<T>(a: T[]): T;
// function two<T, U>(a: T[], b: U[]): [T, U];
// // tslint:disable-next-line:no-any
// function two(...args: any): any {
//     const [x, rest] = args;
//     return [x, ...rest];
// }

// const a = two([1], [true]);
// const b = two([1]);

// // const b: [number, string] = [1, 'hi'];
// // const a = one(1, 'hi');

// // tslint:disable-next-line:no-any
// function tuple<T extends any[]>(...args: T): T {
//     const [a, ...b] = args;
//     return a;
//     // return args;
// }

// const p = tuple(1, 'hi', true);

function* merge<A, B>(a: A | A[], b: B | B[]): IterableIterator<A & B> {
  const a1 = a instanceof Array ? a : [a];
  const b1 = b instanceof Array ? b : [b];

  for (const a2 of a1) {
    for (const b2 of b1) {
      yield { ...a2, ...b2 };
    }
  }
}

const catalog = merge({ tensor: 5 }, [
  { name: 'latte', sku: 3 },
  { name: 'americano', sku: 3 },
]);

console.log(JSON.stringify([...catalog], null, 4));

// Generate all arg combinations

// Invoke function on each combination

// // tslint:disable-next-line:no-any
// function* gen<A, U extends any[], V>(a: A, ...args : U): IterableIterator<V> {
//     if (b.length > 0) {
//         for (const x of gen(b)) {
//             yield [a, ...x];
//         }
//     }
// }

// const z = gen(1, 2, 3);

// // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html#generic-rest-parameters
// // tslint:disable-next-line:no-any
// function bind<T, U extends any[], V>(f: (x: T, ...args: U) => V, x: T): (...args: U) => V;

// function f3(x: number, y: string, z: boolean): void;

// const f2 = bind(f3, 42);  // (y: string, z: boolean) => void
// const f1 = bind(f2, "hello");  // (z: boolean) => void
// const f0 = bind(f1, true);  // () => void

// console.log(f3(42, "hello", true));
// console.log(f2("hello", true));
// console.log(f1(true));
// console.log(f0());
