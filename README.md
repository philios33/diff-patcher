# diff-patcher

**diff-patcher** is a node.js module which provides utility functions to both compare the differences between two objects and apply the generated patch somewhere.  The main reason this was written was to help compress state changes on the server side so that only the deltas/patches are sent across the wire and are applied properly to the client state at the other end.

In this library, a patch refers to a JSON object that defines an array of operations that you need to apply to the origin object to reach the target object.  It is similar to other implementations out there but not the same.  I have tried to keep the patch payload as small as possible.

A patch can be applied to an object so that it changes the original (mutates it), or it can be applied so that it reduces the original (returns a different object).  Avoiding direct state mutation is crucial when working with immutable state like in React hooks.

## Features

* Create a patch object by working out the differences between two objects, an origin and a target.
* Apply the patch to an object so that it mutates that object.
* Apply the patch to an object to reduce it to another object.  Useful for processing state, e.g. with React.js
* No recursion! (see below)
* Full array comparison works out if items have been removed, inserted or deleted as efficiently as possible.
* Focus on avoiding patch bloat if objects are too dissimillar.
* Unit tests using jest.

### Note about recursion

Recursion is almost always a memory hog and should really be considered an antipattern for programmers.  In this case, for example, comparing two very deep objects will use up exponential memory resources O(n*n) if using comparison code that recurses at each nesting level.  By avoiding recursion, the code uses less memory O(n) in the same situation so is more memory efficient.

## Install

```bash
npm install diff-patcher
```

## Example

```javascript

import { compare } from 'diff-patcher';

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

/*
Patch [
    {
        "t": "u",
        "p": [
            "$del"
        ]
    },
    {
        "t": "p",
        "i": 1,
        "r": 0,
        "v": [
            "one and a half"
        ],
        "p": [
            "things"
        ]
    },
    {
        "t": "s",
        "p": [
            "two",
            "four"
        ],
        "v": 4
    },
    {
        "t": "s",
        "p": [
            "four",
            "a"
        ],
        "v": 1
    },
    {
        "t": "s",
        "p": [
            "four",
            "b"
        ],
        "v": {}
    }
]
*/

```

## Other notes

### Object comparison

The idea is to create the smallest patch size to represent the data change.  Sometimes an object (or some sub object deeper down the structure) has changed so much that it becomes more efficient to just set a new object with all its data in a single patch operation, rather than work out every single key difference.  There is a cutoff used to determine if two objects are different enough and it won't bother comparing any deeper if this is the case.  This would be a waste of CPU and could bloat the patch.

### Array comparison

Array comparison is complicated.  We want to detect the case where a 100 item array has had 1 item unshifted to index 0.  Every item in that array will now change position since all items will be shifted, but we don't want 100 update operations within our patch, or to set the whole array again in 1 large patch operation.  The array comparison library tries to work out the minimum number of differences as efficiently as possible with arrays that have only a few changes.  As with object comparison (see above), if the array has had significant alterations that mean listing every change becomes less efficient than defining the whole array again, we don't bother to.


