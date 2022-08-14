import { patchObject as patcher, reduceState as reducer } from '../patcher';

const dc = (obj) => JSON.parse(JSON.stringify(obj));
describe('Object patcher', () => {

    test('Requires a starting object and an array of changes', () => {
        let patch = [{
            t: 's',
            p: ['path'],
            v: {
                "1422":{
                    "name":"Year 4",
                    "classes":{}
                }
            },
        }];
        expect(() => patcher("{}", patch)).toThrowError("First argument must be an object");
        expect(() => patcher(null, patch)).toThrowError("First argument cannot be null");
        expect(() => patcher({}, null)).toThrowError("Second argument must be an Array");
    });

    it('Set an object at a key on an empty array', () => {
        let orig = {}
        let patch = [{
            t: 's',
            p: ['path'],
            v: {
                "1422":{
                    "name":"Year 4",
                    "classes":{}
                }
            },
        }];
        let result = dc(orig);
        patcher(result, patch);
        expect(result).toStrictEqual({
            path: {
                1422: {
                    name: 'Year 4',
                    classes: {}
                },
            }
        });
    });

    test('Set a key', () => {
        let orig = {
            a: 1,
        }
        let patch = [{
            t: 's',
            p: ['a'],
            v: 2,
        }];
        let result = dc(orig);
        patcher(result, patch);
        expect(result).toStrictEqual({
            a: 2,
        });
    });

    test('Set a deep key', () => {
        let orig = {
            a: 1,
            b: {
                "c.1": {
                    deep: false,
                }
            }
        }
        let patch = [{
            t: 's',
            p: ['b', 'c.1', 'deep'],
            v: true,
        }];
        let result = dc(orig);
        patcher(result, patch);
        expect(result).toStrictEqual({
            a: 1,
            b: {
                "c.1": {
                    deep: true,
                }
            }
        });
    });

    test('Set another key', () => {
        let orig = {
            a: 1,
        }
        let patch = [{
            t: 's',
            p: ['b'],
            v: true,
        }];
        let result = dc(orig);
        patcher(result, patch);
        expect(result).toStrictEqual({
            a: 1,
            b: true,
        });
    });

    test('Unset a key', () => {
        let orig = {
            a: '1',
        }
        let patch = [{
            t: 'u',
            p: ['a'],
        }];
        let result = dc(orig);
        patcher(result, patch);
        expect(result).toStrictEqual({});
    });

    test('Unset a deep key', () => {
        let orig = {
            a: 1,
            b: {
                "c.1": {
                    deep: false,
                }
            }
        }
        let patch = [{
            t: 'u',
            p: ['b', 'c.1'],
        }];
        let result = dc(orig);
        patcher(result, patch);
        expect(result).toStrictEqual({
            a: 1,
            b: {}
        });
    });

    test('Manipulate array', () => {
        let orig = {
            list: ['one','two','three'],
        }
        let patch = [{
            t: 's',
            p: ['list', '0'],
            v: 'ONE',
        },{
            t: 'u',
            p: ['list', '2'],
        }];
        let result = dc(orig);
        patcher(result, patch);
        expect(result).toStrictEqual({
            list: ['ONE','two'],
        });
    });

    test('Manipulate array ordering', () => {
        let orig = {
            list: ['0','1','2','3','4','5'],
        }
        let patch = [{
            t: 's',
            p: ['list', '2'],
            v: '3',
        },{
            t: 's',
            p: ['list', '3'],
            v: '4',
        },{
            t: 's',
            p: ['list', '4'],
            v: '5',
        },{
            t: 'u',
            p: ['list', '5'],
        }];
        let result = dc(orig);
        patcher(result, patch);
        expect(result).toStrictEqual({
            list: ['0','1','3','4','5'],
        });
    });
});

describe('Object reducer', () => {
    test('Set a key', () => {
        let orig = {
            a: 1,
        }
        let patch = [{
            t: 's',
            p: ['a'],
            v: 2,
        }];
        let origCopy = dc(orig);
        let result = reducer(orig, patch);
        expect(result).toStrictEqual({
            a: 2,
        });
        expect(origCopy).toStrictEqual(orig);
    });

    test('Set a deep key', () => {
        let orig = {
            a: 1,
            b: {
                c: 3
            }
        }
        let patch = [{
            t: 's',
            p: ['b', 'c'],
            v: 4,
        }];
        let origCopy = dc(orig);
        let result = reducer(orig, patch);
        expect(result).toStrictEqual({
            a: 1,
            b: {
                c: 4
            }
        });
        expect(origCopy).toStrictEqual(orig);
    });

    test('Set a deep key array (while keeping other data intact)', () => {
        let orig = {
            a: {
                keep: "keep"
            },
            b: {
                c: 3
            },
            d: {
                keep: "keep"
            }
        }
        let patch = [{
            t: 's',
            p: ['b', 'c'],
            v: 4
        }];
        let origCopy = dc(orig);
        let result = reducer(orig, patch);
        expect(result).toStrictEqual({
            a: {
                keep: "keep"
            },
            b: {
                c: 4
            },
            d: {
                keep: "keep"
            }
        });
        expect(origCopy).toStrictEqual(orig);
    });

    test('Set another key', () => {
        let orig = {
            a: 1,
            c: 3,
            d: {
                test: true
            }
        }
        let patch = [{
            t: 's',
            p: ['b'],
            v: 2,
        }];
        let origCopy = dc(orig);
        let result = reducer(orig, patch);
        expect(result).toStrictEqual({
            a: 1,
            b: 2,
            c: 3,
            d: {
                test: true
            }
        });
        expect(origCopy).toStrictEqual(orig);
    });

    test('Unset a key', () => {
        let orig = {
            a: 1,
            b: 2
        }
        let patch = [{
            t: 'u',
            p: ['a'],
        }];
        let origCopy = dc(orig);
        let result = reducer(orig, patch);
        expect(result).toStrictEqual({
            b: 2
        });
        expect(origCopy).toStrictEqual(orig);
    });

    test('Unset a deep key', () => {
        let orig = {
            a: 1,
            b: {
                "c.1": {
                    deep: false,
                }
            }
        }
        let patch = [{
            t: 'u',
            p: ['b', 'c.1'],
        }];
        let origCopy = dc(orig);
        let result = reducer(orig, patch);
        expect(result).toStrictEqual({
            a: 1,
            b: {}
        });
        expect(origCopy).toStrictEqual(orig);
    });

    test('Manipulate array', () => {
        let orig = {
            list: ['one','two','three'],
        }
        let patch = [{
            t: 's',
            p: ['list', '0'],
            v: 'ONE',
        },{
            t: 'u',
            p: ['list', '2'],
        }];
        let origCopy = dc(orig);
        let result = reducer(orig, patch);
        expect(result).toStrictEqual({
            list: ['ONE', 'two'],
        });
        expect(origCopy).toStrictEqual(orig);
    });

    test('Manipulate array ordering', () => {
        let orig = {
            list: ['0','1','2','3','4','5'],
        }
        let patch = [{
            t: 's',
            p: ['list', '2'],
            v: '3',
        },{
            t: 's',
            p: ['list', '3'],
            v: '4',
        },{
            t: 's',
            p: ['list', '4'],
            v: '5',
        },{
            t: 'u',
            p: ['list', '5'],
        }];
        let origCopy = dc(orig);
        let result = reducer(orig, patch);
        expect(result).toStrictEqual({
            list: ['0','1','3','4','5']
        });
        expect(origCopy).toStrictEqual(orig);
    });

    test('Manipulate array (of the same object) ordering', () => {
        let a = {
            yeah: true,
        }
        let orig = {
            list: [a,a,a,a,a,a],
        }
        let patch = [{
            t: 's',
            p: ['list', '2'],
            v: '3',
        },{
            t: 's',
            p: ['list', '3'],
            v: '4',
        },{
            t: 's',
            p: ['list', '4'],
            v: '5',
        },{
            t: 'u',
            p: ['list', '5'],
        }];
        let origCopy = dc(orig);
        let result = reducer(orig, patch);
        expect(result).toStrictEqual({
            list: [{
                yeah: true,
            },{
                yeah: true,
            },'3','4','5']
        });
        expect(origCopy).toStrictEqual(orig);
    });

    test('Can insert an item in to an empty array', () => {
        let orig = {
            "a": [],
        }
        
        let patch = [{
            "t":"p", // Splice
            "i":0,
            "r":0,
            "v":["test"],
            "p":["a"]
        }];
        let origCopy = dc(orig);
        let result = reducer(orig, patch);
        expect(result).toStrictEqual({
            "a": ["test"],
        });
        expect(origCopy).toStrictEqual(orig);
    });

    test('Can splice and remove on an array', () => {
        let orig = {
            "a": ["yeah", "two"],
        }
        
        let patch = [{
            "t":"p", // Splice
            "i":1,
            "r":1,
            "v":["test", "123"],
            "p":["a"]
        }];
        let origCopy = dc(orig);
        let result = reducer(orig, patch);
        expect(result).toStrictEqual({
            "a": ["yeah", "test", "123"],
        });
        expect(origCopy).toStrictEqual(orig);
    });

    test('Can insert an item in to an empty array AND set another field', () => {
        let orig = {
            "a": [],
        }
        
        let patch = [{
            "t":"p", // Splice
            "i":0,
            "r":0,
            "v":["test"],
            "p":["a"]
        },{
            "t":"s",
            "p":["$refs"],
            "v":{
                "some":"object",
            }
        }];
        let origCopy = dc(orig);
        let result = reducer(orig, patch);
        expect(result).toStrictEqual({
            "a": ["test"],
            "$refs": {
                "some":"object",
            }
        });
        expect(origCopy).toStrictEqual(orig);
    });

    test('BROKEN', () => {
        let orig = {
            "slideshows": [],
            "guests": {
                "123": {
                    "id": "123",
                    "firstName": "Phil",
                    "lastName": "Nicholls",
                    "lastUpdated": "2020-11-21T19:54:36.380Z",
                    "email": "phil@code67.com"
                }
            }
        }
        
        let patch = [{"t":"p","i":0,"r":0,"v":[{"id":"456","creator":{"$ref":"guest/123"},"name":"My slideshow","createdAt":{"$isdate":true,"isoString":"2020-11-21T21:35:38.852Z"},"config":{},"configLastUpdated":null,"configLastEditor":null,"deleted":false}],"p":["slideshows"]},{"t":"s","p":["$refs"],"v":{"guest/123":{"id":"123","firstName":"Phil","lastName":"Nicholls","lastUpdated":{"$isdate":true,"isoString":"2020-11-21T19:54:36.380Z"},"email":"phil@code67.com"}}}];
        patcher(orig, patch);
        expect(orig).toStrictEqual({
            "slideshows": [{"id":"456","creator":{"$ref":"guest/123"},"name":"My slideshow","createdAt":{"$isdate":true,"isoString":"2020-11-21T21:35:38.852Z"},"config":{},"configLastUpdated":null,"configLastEditor":null,"deleted":false}],
            "guests": {
                "123": {
                    "id": "123",
                    "firstName": "Phil",
                    "lastName": "Nicholls",
                    "lastUpdated": "2020-11-21T19:54:36.380Z",
                    "email": "phil@code67.com"
                }
            },
            "$refs": {"guest/123":{"id":"123","firstName":"Phil","lastName":"Nicholls","lastUpdated":{"$isdate":true,"isoString":"2020-11-21T19:54:36.380Z"},"email":"phil@code67.com"}}
        });
       
    });

    test('Do 2 sets at once with patcher', () => {
        let orig = {
            current: {
                points: 5.5,
                played: 1,
            },
            rivals: {
                "123": {
                    name: "Phil",
                }
            },
            anything: {
                else: true,
            }
        }
        let patch = [{
            t: 's',
            p: ['current', 'points'],
            v: 8.4,
        },{
            t: 's',
            p: ['current', 'played'],
            v: 2,
        } ,{
            t: 's',
            p: ['rivals', '456'],
            v: {
                "name": "Pete"
            },
        }];
        let origCopy = dc(orig);
        let result = reducer(orig, patch);
        expect(result).toStrictEqual({
            current: {
                points: 8.4,
                played: 2,
            },
            rivals: {
                "123": {
                    "name": "Phil"
                },
                "456": {
                    "name": "Pete"
                }
            },
            anything: {
                else: true,
            }
        });
        expect(origCopy).toStrictEqual(orig);
    });


});
