
import compare from '../comparer';

const TYPE = 't';

const SPLICE = 'p';
const SET = 's';
const UNSET = 'u';

const PATH = 'p';
const VALUE = 'v';
const INDEX = 'i';
const REMOVE = 'r';

describe('Object comparer', () => {

    test('Only works with 2 objects', () => {
        let a = {
            object: true,
        }
        expect(() => { throw new Error("Error t1hrownnnn") }).toThrowError('Error t1hrownnnn');
        
        expect(() => compare(a, null)).toThrowError("Can only compare two objects");
        expect(() => compare(a, undefined)).toThrowError("Can only compare two objects");
        expect(() => compare(a, "string")).toThrowError("Can only compare two objects");
        expect(() => compare(a, 1234)).toThrowError("Can only compare two objects");
        expect(() => compare(a, true)).toThrowError("Can only compare two objects");

        expect(() => compare(null, a)).toThrowError("Can only compare two objects");
        expect(() => compare(undefined, a)).toThrowError("Can only compare two objects");
        expect(() => compare("string", a)).toThrowError("Can only compare two objects");
        expect(() => compare(1234, a)).toThrowError("Can only compare two objects");
        expect(() => compare(true, a)).toThrowError("Can only compare two objects");
    });
    
    test('Detects a new key', () => {
        let a = { };
        let b = {
            key: "value"
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = SET;
        change[PATH] = ['key'];
        change[VALUE] = 'value';
        let expected = [change];
        expect(diffs).toStrictEqual(expected);
    });

    
    test('Detects removing an existing key', () => {
        let a = {
            key: 'exists',
        };
        let b = {};
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = UNSET;
        change[PATH] = ['key'];
        let expected = [change];
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects updating an existing key', () => {
        let a = {
            key: 'exists',
        };
        let b = {
            key: 4,
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = SET;
        change[PATH] = ['key'];
        change[VALUE] = 4;
        let expected = [change];
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects a deep change', () => {
        let a = {
            deep: {
                key: 'exists',
            }
        };
        let b = {
            deep: {
                key: false,
            }
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = SET;
        change[PATH] = ['deep', 'key'];
        change[VALUE] = false;
        let expected = [change];
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects no changes when ordering is different', () => {
        let a = {
            deep: {
                key: null,
                false: false,
            }
        };
        let b = {
            deep: {
                false: false,
                key: null,
            }
        };
        let diffs = compare(a,b);
        let expected = [];
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects null to empty object', () => {
        let a = {
            deep: {
                key: null,
            }
        };
        let b = {
            deep: {
                key: {},
            }
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = SET;
        change[PATH] = ['deep', 'key'];
        change[VALUE] = {};
        let expected = [change];
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects null to full object', () => {
        let a = {
            deep: {
                key: null,
            }
        };
        let b = {
            deep: {
                key: {
                    a:1,
                    b:2,
                    c: {
                        d:4,
                    }
                },
            }
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = SET;
        change[PATH] = ['deep', 'key'];
        change[VALUE] = {
            a:1,
            b:2,
            c: {
                d:4,
            }
        };
        let expected = [change];
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects null to string', () => {
        let a = {
            deep: {
                key: null,
            }
        };
        let b = {
            deep: {
                key: "string",
            }
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = SET;
        change[PATH] = ['deep', 'key'];
        change[VALUE] = "string";
        let expected = [change];
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects null to removed', () => {
        let a = {
            deep: {
                key: null,
            }
        };
        let b = {
            deep: {
                
            }
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = UNSET;
        change[PATH] = ['deep', 'key'];
        let expected = [change];
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects empty object to null', () => {
        let a = {
            deep: {
                key: {},
            }
        };
        let b = {
            deep: {
                key: null,
            }
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = SET;
        change[PATH] = ['deep', 'key'];
        change[VALUE] = null;
        let expected = [change];
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects empty object to full object with an update for each key', () => {
        let a = {
            deep: {
                key: {},
            }
        };
        let b = {
            deep: {
                key: {
                    full: true,
                    abc: 'def',
                    hij: {
                        a: 'b',
                    }
                },
            }
        };
        let diffs = compare(a,b);

        let change1 = {};
        change1[TYPE] = SET;
        change1[PATH] = ['deep', 'key', 'full'];
        change1[VALUE] = true;
        let change2 = {};
        change2[TYPE] = SET;
        change2[PATH] = ['deep', 'key', 'abc'];
        change2[VALUE] = 'def';
        let change3 = {};
        change3[TYPE] = SET;
        change3[PATH] = ['deep', 'key', 'hij'];
        change3[VALUE] = {
            a: 'b',
        };
        let expected = [change1, change2, change3];

        expect(diffs).toStrictEqual(expected);
    });

    test('Detects empty object to string', () => {
        let a = {
            deep: {
                key: {},
            }
        };
        let b = {
            deep: {
                key: 'string',
            }
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = SET;
        change[PATH] = ['deep', 'key'];
        change[VALUE] = 'string';
        let expected = [change];
        
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects empty object to removed', () => {
        let a = {
            deep: {
                key: {},
            }
        };
        let b = {
            deep: {}
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = UNSET;
        change[PATH] = ['deep', 'key'];
        let expected = [change];

        expect(diffs).toStrictEqual(expected);
    });

    test('Detects full object to null', () => {
        let a = {
            deep: {
                key: {
                    a: 1,
                },
            }
        };
        let b = {
            deep: {
                key: null,
            }
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = SET;
        change[PATH] = ['deep', 'key'];
        change[VALUE] = null;
        let expected = [change];
        
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects full object to empty object', () => {
        let a = {
            deep: {
                key: {
                    a: 1,
                    b: 2,
                    c: 3,
                },
            }
        };
        let b = {
            deep: {
                key: {},
            }
        };
        let diffs = compare(a,b);
        let change1 = {};
        change1[TYPE] = UNSET;
        change1[PATH] = ['deep', 'key', 'a'];
        let change2 = {};
        change2[TYPE] = UNSET;
        change2[PATH] = ['deep', 'key', 'b'];
        let change3 = {};
        change3[TYPE] = UNSET;
        change3[PATH] = ['deep', 'key', 'c'];
        let expected = [change1, change2, change3];

        expect(diffs).toStrictEqual(expected);
    });

    test('Detects full object to string', () => {
        let a = {
            deep: {
                key: {
                    a: 1,
                    b: 2,
                    c: 3,
                },
            }
        };
        let b = {
            deep: {
                key: 'something',
            }
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = SET;
        change[PATH] = ['deep', 'key'];
        change[VALUE] = 'something';
        let expected = [change];
        
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects full object to removed', () => {
        let a = {
            deep: {
                key: {
                    a: 1,
                    b: 2,
                    c: 3,
                },
            }
        };
        let b = {
            deep: {
            }
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = UNSET;
        change[PATH] = ['deep', 'key'];
        let expected = [change];
        
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects primative to null', () => {
        let a = {
            deep: {
                key: 1,
            }
        };
        let b = {
            deep: {
                key: null,
            }
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = SET;
        change[PATH] = ['deep', 'key'];
        change[VALUE] = null;
        let expected = [change];

        expect(diffs).toStrictEqual(expected);
    });

    test('Detects primative to empty object', () => {
        let a = {
            deep: {
                key: 1,
            }
        };
        let b = {
            deep: {
                key: {},
            }
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = SET;
        change[PATH] = ['deep', 'key'];
        change[VALUE] = {};
        let expected = [change];

        expect(diffs).toStrictEqual(expected);
    });

    test('Detects primative to full object', () => {
        let a = {
            deep: {
                key: 1,
            }
        };
        let b = {
            deep: {
                key: {
                    a: 1,
                    b: 2,
                },
            }
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = SET;
        change[PATH] = ['deep', 'key'];
        change[VALUE] = {
            a: 1,
            b: 2,
        };
        let expected = [change];

        expect(diffs).toStrictEqual(expected);
    });

    test('Detects primative to removed', () => {
        let a = {
            deep: {
                key: 1,
            }
        };
        let b = {
            deep: {
            }
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = UNSET;
        change[PATH] = ['deep', 'key'];
        let expected = [change];
        
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects multiple sets and unsets at once', () => {
        let a = {
            deep: {
                key: 1,
            },
            $cheese: true,
            object: {
                a: "1",
                'b.dot': true,
                'c.dot': false,
                d: 123,
                deep: {
                    item: null
                }
            }
        };
        let b = {
            $cheese: false,
            object: {
                a: "11",
                'b.dot': true,
                'c.dot': true,
                d: 123,
                deep: {
                    item: {
                        id: 1,
                    }
                }
            }
        };
        let diffs = compare(a,b);
        let change1 = {};
        change1[TYPE] = UNSET;
        change1[PATH] = ['deep'];
        let change2 = {};
        change2[TYPE] = SET;
        change2[PATH] = ['$cheese'];
        change2[VALUE] = false;
        let change3 = {};
        change3[TYPE] = SET;
        change3[PATH] = ['object', 'a'];
        change3[VALUE] = '11';
        let change4 = {};
        change4[TYPE] = SET;
        change4[PATH] = ['object', 'c.dot'];
        change4[VALUE] = true;
        let change5 = {};
        change5[TYPE] = SET;
        change5[PATH] = ['object', 'deep', 'item'];
        change5[VALUE] = {
            id: 1,
        };
        let expected = [change1, change2, change3, change4, change5];
        
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects adding elements to an array', () => {
        let a = {
            arr: [],
        };
        let b = {
            arr: ['str','str2'],
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = SPLICE;
        change[PATH] = ['arr'];
        change[INDEX] = 0;
        change[VALUE] = ['str', 'str2'];
        change[REMOVE] = 0;
        let expected = [change];
        
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects removing an element from an array', () => {
        let a = {
            arr: ['a','b','c'],
        };
        let b = {
            arr: ['a','c'],
        };
        let diffs = compare(a,b);
        let change = {};
        change[TYPE] = SPLICE;
        change[PATH] = ['arr'];
        change[INDEX] = 1;
        change[REMOVE] = 1;
        let expected = [change];
        
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects moving an array by renaming the key', () => {
        let a = {
            arr1: ['a','b','c'],
        };
        let b = {
            arr2: ['a','b','c'],
        };
        let diffs = compare(a,b);
        let change1 = {};
        change1[TYPE] = UNSET;
        change1[PATH] = ['arr1'];
        let change2 = {};
        change2[TYPE] = SET;
        change2[PATH] = ['arr2'];
        change2[VALUE] = ['a','b','c'];
        let expected = [change1, change2];
        
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects complicated combinations of changes (Football tables)', () => {
        let arsenal = {
            id: '1',
            name: 'Arsenal',
            position: 1,
        };
        let astonVilla = {
            id: '2',
            name: "Aston Villa",
            position: 2,
        }
        let a = {
            tables: {
                premierLeague: {
                    '2020': [arsenal, astonVilla],
                    '2021': [astonVilla, arsenal],
                }
            },
            teams: [arsenal],
        };
        let aJson = JSON.stringify(a);
        // Aston Villa go top, Arsenal go 2nd
        arsenal.position = 2;
        astonVilla.position = 1;
        a.teams.push(astonVilla);
        let bJson = JSON.stringify(a);
        a = JSON.parse(aJson);
        let b = JSON.parse(bJson);
        let diffs = compare(a,b);
        let change1 = {};
        change1[TYPE] = SET;
        change1[PATH] = ['tables','premierLeague','2020','0','position'];
        change1[VALUE] = 2;
        let change2 = {};
        change2[TYPE] = SET;
        change2[PATH] = ['tables','premierLeague','2020','1','position'];
        change2[VALUE] = 1;
        let change3 = {};
        change3[TYPE] = SET;
        change3[PATH] = ['tables','premierLeague','2021','0','position'];
        change3[VALUE] = 1;
        let change4 = {};
        change4[TYPE] = SET;
        change4[PATH] = ['tables','premierLeague','2021','1','position'];
        change4[VALUE] = 2;
        let change5 = {};
        change5[TYPE] = SPLICE;
        change5[INDEX] = 1;
        change5[PATH] = ['teams'];
        change5[REMOVE] = 0;
        change5[VALUE] = [{
            id: "2",
            name: "Aston Villa",
            position: 1,
        }];
        let change6 = {};
        change6[TYPE] = SET;
        change6[PATH] = ['teams','0','position'];
        change6[VALUE] = 2;
        let expected = [change5, change6, change1, change2, change3, change4];
        
        expect(diffs).toStrictEqual(expected);
    });
    
    test('Detects addition of deep key 1', () => {
        let a = {
            deep: {
                
            }
        };
        let b = {
            deep: {
                first: {
                    second: {
                        third: "three"
                    }
                }
            }
        };
        let diffs = compare(a,b);
        
        let change1 = {};
        change1[TYPE] = SET;
        change1[PATH] = ['deep','first'];
        change1[VALUE] = {
            second: {
                third: "three"
            }
        }
        let expected = [change1];
        expect(diffs).toStrictEqual(expected);
    });

    test('Detects addition of deep key 2', () => {
        let a = {

        };
        let b = {
            deep: {
                first: {
                    second: {
                        third: "three"
                    }
                }
            }
        };
        let diffs = compare(a,b);
        
        let change1 = {};
        change1[TYPE] = SET;
        change1[PATH] = ['deep'];
        change1[VALUE] = {
            first: {
                second: {
                    third: "three"
                }
            }
        }
        let expected = [change1];
        expect(diffs).toStrictEqual(expected);
    });
});