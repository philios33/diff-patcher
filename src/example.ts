
// npm ci
// npx ts-node ./src/example.ts 

import { compare } from './index';

let origin = {
    one: 1,
    two: {
        three: 3,
    },
    four: {},
    $del: null,
    things: ["one", "two", "three", "four"],
}

let target = {
    one: 1,
    two: {
        three: 3,
        four: 4,
    },
    four: {
        a: 1,
        b: {},
    },
    things: ["one", "one and a half", "two", "three", "four"],
}

const patch = compare(origin, target);
console.log("Patch", JSON.stringify(patch, null, 4));
