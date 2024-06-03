
import { isEqualTo, getValueAtPath, getObjectSimilarity, getObjectLeafPaths, compareArrayReferences, compareArrays } from '../array';
import { patchObject, reduceState } from '../patcher';

describe('Equality function isEqualTo', () => {
    test("Disregards object key order", () => {
        let a = {
            yes: true,
            one: {
                two: 2,
                three: 3,
            }
        };
        let b = {
            one: {
                three: 3,
                two: 2,
            },
            yes: true,
        };
        expect(isEqualTo(a,b)).toBe(true);
    });

    test('Cares about array indexes being different', () => {
        let a = {
            yes: true,
            one: [2,3],
        };
        let b = {
            yes: true,
            one: [3,2],
        };
        expect(isEqualTo(a,b)).toBe(false);
    });

    test('Reports logically equal with equal deep keys', () => {
        let a = {
            deep: {
                deeper: {
                    deepest: true,
                }
            }
        };
        let b = {
            deep: {
                deeper: {
                    deepest: true,
                }
            }
        };
        expect(isEqualTo(a,b)).toBe(true);
    });

    test('Reports logically unequal with different deep keys', () => {
        let a = {
            deep: {
                deeper: {
                    deepest: true,
                }
            }
        };
        let b = {
            deep: {
                deeper: {
                    deepest: null,
                }
            }
        };
        expect(isEqualTo(a,b)).toBe(false);
    });

    test('Reports logically equal with equal deep array keys', () => {
        let a = {
            deep: {
                deeper: {
                    deepest: [1,2,3],
                }
            }
        };
        let b = {
            deep: {
                deeper: {
                    deepest: [1,2,3],
                }
            }
        };
        expect(isEqualTo(a,b)).toBe(true);
    });

    test('Different deep key changes', () => {
        let a = {
            deep: {
                deeper: {
                    deepest: [1,2,3],
                }
            }
        };
        let b = {
            deep: {
                deeper: {
                    deepest: [1,2,4],
                }
            }
        };
        expect(isEqualTo(a,b)).toBe(false);
    });
});

describe('Function getValueAtPath', () => {

    test('Reports the correct key value', () => {
        let obj = {
            yes: true,
            one: {
                two: 2,
                three: 3,
            }
        };
        expect(getValueAtPath(obj,['yes'])).toBe(true);
    });

    test('Reports the correct path value', () => {
        let obj = {
            yes: true,
            one: {
                two: 2,
                three: 3,
            }
        };
        expect(getValueAtPath(obj,['one','two'])).toBe(2);
    });

    test('Works with keys in the path which contain dots', () => {
        let obj = {
            yes: true,
            one: {
                '1.2': 'One point two',
                '3': 'Three',
            }
        };
        expect(getValueAtPath(obj,['one','1.2'])).toBe('One point two');
    });

    test('Works with deep keys and array indexes', () => {
        let obj = {
            one: {
                a: {
                    b: [
                        {
                            id: 1,
                        },
                        {
                            id: 2,
                        }
                    ]
                }
            }
        };
        expect(getValueAtPath(obj,['one','a','b','0','id'])).toBe(1);
        expect(getValueAtPath(obj,['one','a','b','1','id'])).toBe(2);
    });
});



describe('Function getObjectSimilarity', () => {
    test('Reports the correct percentage match of two objects', () => {
        let a = {
            x: 'x',
            y: 'y',
        };
        let b = {
            x: 'x',
            y: 'z',
        };
        expect(getObjectSimilarity(a,b)).toBe(50);
        expect(getObjectSimilarity(b,a)).toBe(50);
    });

    test('Reports partial match on added key', () => {
        let a = {
            x: 'x',
            y: 'y',
        };
        let b = {
            x: 'x',
            y: 'y',
            z: 'z',
        };
        expect(getObjectSimilarity(a,b) > 50).toBe(true);
        expect(getObjectSimilarity(a,b) < 100).toBe(true);
        expect(getObjectSimilarity(b,a) > 50).toBe(true);
        expect(getObjectSimilarity(b,a) < 100).toBe(true);
    });

    test('Takes keys in to consideration', () => {
        let a = {
            x: 'x',
            y: 'y',
            z: 'z',
        };
        let b = {
            a: 'x',
            b: 'y',
            c: 'z',
        };
        expect(getObjectSimilarity(a,b)).toBe(0);
        expect(getObjectSimilarity(b,a)).toBe(0);
    });

    test('Considers deep equality', () => {
        let a = {
            x: 'x',
            y: {
                deep: {
                    equal: true,
                }
            }
        };
        let b = {
            x: 'x',
            y: {
                deep: {
                    equal: true,
                }
            }
        };
        expect(getObjectSimilarity(a,b)).toBe(100);
        expect(getObjectSimilarity(b,a)).toBe(100);
    });
});



describe('Function getObjectLeafPaths', () => {
    test('Gets an array of path arrays', () => {
        let obj = {
            x: 'x',
            y: 'y',
        };
        let result = [
            ['x'],
            ['y']
        ];
        expect(getObjectLeafPaths(obj)).toStrictEqual(result);
    });

    test('Works on deep objects keys', () => {
        let obj = {
            x: 'x',
            y: {
                deep: {
                    yeah: true,
                    even: null,
                }
            }
        };
        let result = [
            ['x'],
            ['y'],
            ['y','deep'],
            ['y','deep','yeah'],
            ['y','deep','even'],
        ];
        expect(getObjectLeafPaths(obj)).toStrictEqual(result);
    });

    test('Works on empty objects', () => {
        let obj = {
            x: 'x',
            y: {
                deep: {
                }
            }
        };
        let result = [
            ['x'],
            ['y'],
            ['y','deep'],
        ];
        expect(getObjectLeafPaths(obj)).toStrictEqual(result);
    });

    test('Works on deep object structures', () => {
        let obj = {
            a: {
                b: {
                    c: true,
                }
            }
        };
        let result = [
            ['a'],
            ['a','b'],
            ['a','b','c'],
        ];
        expect(getObjectLeafPaths(obj)).toStrictEqual(result);
    });
});


describe('Function compareArrayReferences', () => {
    test('Matches up equal arrays', () => {
        let a = [1,2,3,4];
        let b = [1,2,3,4];
        let expected = [
            [{ offset: 0 }],
            [{ offset: 0 }],
            [{ offset: 0 }],
            [{ offset: 0 }],
        ]
        expect(compareArrayReferences(a,b)).toStrictEqual(expected);
    });

    test('Reports a new item pushed to the end', () => {
        let a = [1,2,3,4];
        let b = [1,2,3,4,5];
        let expected = [
            [{ offset: 0 }],
            [{ offset: 0 }],
            [{ offset: 0 }],
            [{ offset: 0 }],
            [],
        ]
        expect(compareArrayReferences(a,b)).toStrictEqual(expected);
    });

    test('Reports a new item unshifted to the start', () => {
        let a = [1,2,3,4];
        let b = [5,1,2,3,4];
        let expected = [
            [],
            [{ offset: -1 }],
            [{ offset: -1 }],
            [{ offset: -1 }],
            [{ offset: -1 }],
        ]
        expect(compareArrayReferences(a,b)).toStrictEqual(expected);
    });

    test('Reports a new item spliced to the middle', () => {
        let a = [1,2,3,4];
        let b = [1,2,5,3,4];
        let expected = [
            [{ offset: 0 }],
            [{ offset: 0 }],
            [],
            [{ offset: -1 }],
            [{ offset: -1 }],
        ]
        expect(compareArrayReferences(a,b)).toStrictEqual(expected);
    });

    test('Reports multiple solutions with duplicate items in the array', () => {
        let a = [1,2,2,1];
        let b = [1,2,2,2,1];
        let expected = [
            [{ offset: 0 }, { offset: 3 }],
            [{ offset: 0 }, { offset: 1 }],
            [{ offset: -1 }, { offset: 0 }],
            [{ offset: -2 }, { offset: -1 }],
            [{ offset: -4 }, { offset: -1 }],
        ]
        expect(compareArrayReferences(a,b)).toStrictEqual(expected);
    });

    test('Works the same with object refs', () => {
        let c = {
            id: 'c',
        }
        let d = {
            id: 'd',
        }
        let a = [c,d,d,c];
        let b = [c,d,d,d,c];
        let expected = [
            [{ offset: 0 }, { offset: 3 }],
            [{ offset: 0 }, { offset: 1 }],
            [{ offset: -1 }, { offset: 0 }],
            [{ offset: -2 }, { offset: -1 }],
            [{ offset: -4 }, { offset: -1 }],
        ]
        expect(compareArrayReferences(a,b)).toStrictEqual(expected);
    });
});

describe('Function compareArrays', () => {
    test('Detects an appended key', () => {
        let a = [1,2,3];
        let b = [1,2,3,4];
        let expected = {
            arrayUpdates: [{
                t: 'p',
                i: 3,
                r: 0,
                v: [4],
            }],
            appliedArray: [1,2,3,4],
        }
        expect(compareArrays(a, b, 100)).toStrictEqual(expected);
    });

    test('Detects a prepended key', () => {
        let a = [1,2,3];
        let b = [4,1,2,3];
        let expected = {
            arrayUpdates: [{
                t: 'p',
                i: 0,
                r: 0,
                v: [4],
            }],
            appliedArray: [4,1,2,3],
        }
        expect(compareArrays(a, b, 100)).toStrictEqual(expected);
    });

    test('Detects an inserted key', () => {
        let a = [1,2,3];
        let b = [1,2,4,3];
        let expected = {
            arrayUpdates: [{
                t: 'p',
                i: 2,
                r: 0,
                v: [4],
            }],
            appliedArray: [1,2,4,3],
        }
        expect(compareArrays(a, b, 100)).toStrictEqual(expected);
    });

    test('Detects a removal/insert splice as 1 atomic change', () => {
        let a = [1,2,3];
        let b = [1,4,5,3];
        let expected = {
            arrayUpdates: [{
                t: 'p',
                i: 1,
                r: 1,
                v: [4,5],
            }],
            appliedArray: [1,4,5,3],
        }
        expect(compareArrays(a, b, 100)).toStrictEqual(expected);
    });

    test('Ignores a slightly altered object', () => {
        let a = [{
            a: 1,
            b: 2,
            c: 3,
        },{
            a: 1,
            b: 2,
            c: 3,
        },true];

        let b = [{
            a: 1,
            b: 2,
            c: 3,
        },{
            a: 1,
            b: 2,
            c: 4,
        },true];

        let expected = {
            arrayUpdates: [],
            appliedArray: a,
        }
        expect(compareArrays(a, b, 50)).toStrictEqual(expected);
    });

    test('Doesnt ignore a slightly altered object if were being strict', () => {
        let a = [{
            a: 1,
            b: 2,
            c: 3,
        },{
            a: 1,
            b: 2,
            c: 3,
        },true];

        let b = [{
            a: 1,
            b: 2,
            c: 3,
        },{
            a: 1,
            b: 2,
            c: 4,
        },true];
        
        let expected = {
            arrayUpdates: [{
                t: 'p',
                i: 1,
                r: 1,
                v: [{
                    a: 1,
                    b: 2,
                    c: 4,
                }]
            }],
            appliedArray: b,
        }
        expect(compareArrays(a, b, 100)).toStrictEqual(expected);
    });

});

describe('Basic duplicates handling', () => {
    test('Detect simple case', () => {
        let a = ["A", "A", "B"];
        let b = ["A", "B", "A"];
        let expected = {
            arrayUpdates: [{
                // Remove the B, so the two As are next to each other
                t: 'p',
                i: 1,
                r: 1,
            },{
                // Then append the B afterwards
                t: 'p',
                i: 2,
                r: 0,
                v: ["A"],
            }],
            appliedArray: ["A", "B", "A"],
        }
        expect(compareArrays(a, b, 100)).toStrictEqual(expected);
    });

    
});