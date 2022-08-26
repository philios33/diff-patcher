// The javascript internal data type "Date" is a special object type which has some helper 
// functions and an internal representation of the date.
// The Date object will seem like a normal object since it is typeof "object" 
// However it will not have any keys or ownPropertyNames so the library will consider all Date objects as equivalent to {}
// The only way to fix this transparently is to preprocess the input object (serialize any dates in to special date objects containing ISO string values) and postprocess the output object

import compare from '../comparer';
import { patchObject } from '../patcher';

describe('Compare dates', () => {
    
    test('Detects equivalent dates as equal', () => {
        let a = { 
            now: new Date("2022-08-25T21:51:52.238Z"),
        };
        let b = {
            now: new Date("2022-08-25T21:51:52.238Z"),
        };
        let diffs = compare(a,b);
        expect(diffs).toStrictEqual([]);
    });

    test('Detects different dates as NOT equal', () => {
        let a = { 
            now: new Date("2022-08-25T21:51:52.238Z"),
        };
        let b = {
            now: new Date("2022-08-25T21:51:52.239Z"),
        };
        let diffs = compare(a,b);
        expect(diffs).not.toStrictEqual([]);

        // Not sure yet what diffs will look like, but when it is applied it should force an identical json object
        patchObject(a, diffs);
        expect(a).toStrictEqual(b);
    });
})
