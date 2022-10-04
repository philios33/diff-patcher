// The javascript internal data type "Date" is a special object type which has some helper 
// functions and an internal representation of the date.
// The Date object will seem like a normal object since it is typeof "object" 
// However it will not have any keys or ownPropertyNames so the library will consider all Date objects as equivalent to {}
// The only way to fix this transparently is to preprocess the input object (serialize any dates in to special date objects containing ISO string values) and postprocess the output object

import { serializeObject, unserializeObject } from "../serializer";


describe('Test serializer', () => {
    
    test('Leaves alone primative object', () => {
        const a = {
            my: "primative",
            obj: true,
            please: 6,
        }
        const sa = serializeObject(a, false);
        expect(sa).toStrictEqual(a);
    });

    test('Supports null values', () => {
        const a = {
            my: "primative",
            obj: null,
            please: 6,
        }
        const sa = serializeObject(a, false);
        expect(sa).toStrictEqual(a);
    });

    test('Leaves alone multi level primative object', () => {
        const a = {
            my: "primative",
            level: {
                down: {
                    yeah: 1234,
                }
            },
            obj: true,
            please: 6,
        }
        const sa = serializeObject(a, false);
        expect(sa).toStrictEqual(a);
    });

    test('Serializes dates properly', () => {
        const a = { 
            now: new Date("2022-08-25T21:51:52.238Z"),
        };
        const sa = serializeObject(a, false);
        expect(sa).toStrictEqual({
            now: {
                __special: "date",
                isoString: "2022-08-25T21:51:52.238Z"
            }
        });
    });

    test('Serializes a deep date properly', () => {
        const a = { 
            deep: {
                deep: {
                    fake: false,
                    myDate: new Date("2022-08-25T21:51:52.238Z"),
                }
            },
            now: 1234,
        };
        const sa = serializeObject(a, false);
        expect(sa).toStrictEqual({
            deep: {
                deep: {
                    fake: false,
                    myDate: {
                        __special: "date",
                        isoString: "2022-08-25T21:51:52.238Z"
                    },
                }
            },
            now: 1234,
        });
    });
    test('Does not mutate original', () => {
        const a = {
            my: "primative",
            level: {
                down: {
                    yeah: new Date(),
                }
            },
            obj: true,
            please: 6,
        }
        const astr = JSON.stringify(a);
        const sa = serializeObject(a, false);
        const afterAstr = JSON.stringify(a);
        expect(astr).toStrictEqual(afterAstr);
    });

});

describe('Test serializer with unserializer', () => {
    
    test('Leaves alone primative object', () => {
        const a = {
            my: "primative",
            obj: true,
            please: 6,
        }
        const sa = serializeObject(a, false);
        const result = unserializeObject(sa, false);
        expect(result).toStrictEqual(a);
    });

    test('Supports null values', () => {
        const a = {
            my: "primative",
            obj: null,
            please: 6,
        }
        const sa = serializeObject(a, false);
        const result = unserializeObject(sa, false);
        expect(result).toStrictEqual(a);
    });

    test('Leaves alone multi level primative object', () => {
        const a = {
            my: "primative",
            level: {
                down: {
                    yeah: 1234,
                }
            },
            obj: true,
            please: 6,
        }
        const sa = serializeObject(a, false);
        const result = unserializeObject(sa, false);
        expect(result).toStrictEqual(a);
    });

    test('Serializes dates properly', () => {
        const a = { 
            now: new Date("2022-08-25T21:51:52.238Z"),
        };
        const sa = serializeObject(a, false);
        const result = unserializeObject(sa, false);
        expect(result).toStrictEqual(a);
    });

    test('Serializes a deep date properly', () => {
        const a = { 
            deep: {
                deep: {
                    fake: false,
                    myDate: new Date("2022-08-25T21:51:52.238Z"),
                }
            },
            now: 1234,
        };
        const sa = serializeObject(a, false);
        const result = unserializeObject(sa, false);
        expect(result).toStrictEqual(a);
    });

    test('Serializing and unserializing by mutating the original', () => {
        const a = { 
            deep: {
                deep: {
                    fake: false,
                    myDate: new Date("2022-08-25T21:51:52.238Z"),
                }
            },
            now: 1234,
        };
        const beforeStr = JSON.stringify(a);
        serializeObject(a, true);
        unserializeObject(a, true);
        const afterStr = JSON.stringify(a);
        expect(afterStr).toStrictEqual(beforeStr);
    });

    test('Handles arrays properly', () => {
        const a = {
            arr: ['a',true,342]
        };
        const sa = serializeObject(a, false);
        expect(sa).toStrictEqual(a);
        const result = unserializeObject(sa, false);
        expect(result).toStrictEqual(a);
    });

    test('Handles arrays of objects properly', () => {
        const a = {
            test: {
                arr: [{
                    phil: 1
                },{
                    phil: 2,
                    help: {
                        me: "boom",
                    }
                },{
                    phil: {
                        woo: true
                    }
                }]
            }
        };
        const sa = serializeObject(a, false);
        expect(sa).toStrictEqual(a);
        const result = unserializeObject(sa, false);
        expect(result).toStrictEqual(a);
    });

    test('Serializing and unserializing arrays by mutating the original', () => {
        const a = { 
            deep: {
                deep: {
                    fake: [{
                        myDate: new Date("2022-08-25T21:51:52.238Z"),
                        object: true
                    },{
                        myDate: new Date("2022-08-25T21:51:52.238Z"),
                        object: true
                    }]
                }
            },
            now: 1234,
        };
        const beforeStr = JSON.stringify(a);
        serializeObject(a, true);

        const serialized = { 
            deep: {
                deep: {
                    fake: [{
                        myDate: {
                            __special: "date",
                            isoString: "2022-08-25T21:51:52.238Z"
                        },
                        object: true
                    },{
                        myDate: {
                            __special: "date",
                            isoString: "2022-08-25T21:51:52.238Z"
                        },
                        object: true
                    }]
                }
            },
            now: 1234,
        };
        expect(a).toStrictEqual(serialized);

        unserializeObject(a, true);
        const afterStr = JSON.stringify(a);
        expect(afterStr).toStrictEqual(beforeStr);
    });

    test('Serialize without mutating, and unserialize with mutating provides a seperate deep clone', () => {
        const a = {
            my: "primative",
            obj: {
                test: 1,
            },
            please: 6,
        }
        const sa = serializeObject(a, false);
        unserializeObject(sa, true);
        expect(sa).toStrictEqual(a);
        sa.please = 5;
        sa.obj.test = 2;
        expect(sa.please).toStrictEqual(5);
        expect(sa.obj.test).toStrictEqual(2);
        expect(a.please).toStrictEqual(6);
        expect(a.obj.test).toStrictEqual(1);
    });
})
