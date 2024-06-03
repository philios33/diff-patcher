
import compare from "../comparer";
import { patchObject, reduceState } from "../patcher";

describe('Integration tests', () => {
    const createTest = (name: string, sourceObject: any, targetObject: any) => {
        test('Created test - ' + name, () => {
            const patch = compare(sourceObject, targetObject);
            
            // We don't care what the patch is, only that if applied, it will reach the target anyway
            const result = reduceState(sourceObject, patch);
            expect(result).toStrictEqual(targetObject);

            // Also test normal patching
            patchObject(sourceObject, patch);
            expect(sourceObject).toStrictEqual(targetObject);
        })
    }
    createTest('Basic 1', {a:["A", "A", "B"]}, {a:["A", "B", "A"]});
    createTest('Basic 2', {a:["A", "A", "A", "B"]}, {a:["A", "B", "A", "A"]});
    createTest('Basic 3', {a:["A", "A", "A", "B"]}, {a:["A", "A", "A", "A"]});
    createTest('Basic 4', {a:["A", "A", "A", "B"]}, {a:["A", "A", "A", "B"]});
    createTest('Basic 5', {a:["A", "B", "A", "A"]}, {a:["A", "A", "A"]});
    createTest('Basic 6', {a:[{b:"A"}, {b:"A"}, {b:"B"}]}, {a:[{b:"A"}, {b:"B"}, {b:"A"}]});
    createTest('Basic 7', {a:[{b:"B"}, {b:"A"}, {b:"B"}]}, {a:[{b:"A"}, {b:"B"}, {b:"A"}]});
    createTest('Basic 8', {a:[{b:"A"}, {b:"A"}, {b:"B"}, {b:"A"}]}, {a:[{b:"A"}, {b:"B"}, {b:"A"}, {b:"A"}]});
    createTest('Basic 9', {a:[{b:"A"}, {b:"B"}, {b:"A"}]}, {a:[{b:"A"}, {b:"A"}, {b:"B"}]});
});