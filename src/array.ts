/*
Comparing arrays for changes is quite complicated to find the most efficient path
There are two methods, one will be more efficient depending on the size of the array and how much it has changed.

A. Use object comparer (just set and unset appropriate keys)
B. Use array comparer (below)

Editing a few deep keys in array objects, we should find option A more efficient.
Altering the ordering, shifting, pushing, poping, splicing etc, we should find option B more efficient.

We can run both and work out which one gives the lowest number of change objects using JSON.stringify(changes).length
Well no, we can't really run both because the non recursive nature of the object comparer means it doesnt do everything at once.

If we add fuzzy match (75%) for object checking. 
Then we can run the array comparer first, make detected updates to a new array and then continue doing an object compare on the new array ref.
This gives us the best of both worlds since array comparer will definately get the array to the right length.

The array compare function needs to:
1. Do all the stuff below, considering similar objects to be in the correct place.
2. Return all the array changes (which get added to updates)
3. Also return a reference to a new array which has had these changes applied so the object comparer can continue as normal at this point.
Then we hook the arrayCompare function in the object comparer!

---

The array comparer works by comparing every key of the new array with the old array.
Once we find a key which is incorrect, we look at it's comparative references.
We take the one which will get us the furthest.
If it's new items, we insert those.
Then we apply this op to the old array to form our next old array to compare with.
We repeat until the old array is logically equal to our new array

(See bottom of comparer.js for more thoughts)

Note: If comparing arrays of objects, it is important not to consider the new object different if it has a few deep keys different.
We could calculate how much of an object is different by looking at how many object keys are equal vs how many keys exist.
Or a better way would be to use the object comparer (A) and work out if the data size of the changes is larger than the size of the new object.
But this would require recursion since B is called by A.

As a simpler way, we loop through all paths of the old object and count how many paths match with the new object
Then we loop through all paths of the new object and count how many paths match with the old object.
We can use these metrics (additions, deletions, udpates) to work out how different the objects really are.
Total number of changes can be a maximum of (num of paths in old + num of paths in new), so then we can work out a rough percentage of how much the objects match.
If the match percentage > 80% then we should consider it the same object in the correct place.

*/

const TYPE = "t";
const SPLICE = "p";
const INDEX = "i";
const REMOVE = "r";
const VALUES = "v";

interface IndexOffset {
    offset: number
}

// Returns an array of array of possible references for each key in the new array
export function compareArrayReferences (oldArray: Array<any>, newArray: Array<any>, threshold: number = 60): Array<Array<IndexOffset>> {
    let refs = [];
    for(var i=0; i<newArray.length; i++) {
        refs[i] = [];
        let newValue = newArray[i];
        // We have to compare each key of the old array with the new one.
        for(var j=0; j<oldArray.length; j++) {
            let oldValue = oldArray[j];
            let indexDiff = j-i;
            if (isRoughlyEqualTo(oldValue, newValue, threshold)) {
                refs[i].push({
                    offset: indexDiff,
                })
            } else {
                // console.log("These are not equal enough", oldValue, newValue);
            }
        }
    }
    return refs;
}

// Returns an array of path arrays which point to primative values we can compare
// Avoids recursion by keeping a queue of objects to process

export function getObjectLeafPaths (obj: any): Array<Array<string>> {
    let list = [];

    let queue = [];
    queue.push({
        object: obj,
        paths: [],
    });

    while (queue.length > 0) {
        let next = queue.shift();

        let object = next.object;
        
        Object.keys(object).forEach(keyName => {
            let thisPaths = next.paths.slice();
            thisPaths.push(keyName);

            if (typeof object[keyName] === 'object') {
                if (object[keyName] !== null) {
                    queue.push({
                        object: object[keyName],
                        paths: thisPaths,
                    })
                }
            }

            list.push(thisPaths);
        });
    }

    return list;
}

/*
const isEqualTo = (a, b) => {
    return a === b;
}
*/
// This is a copied function used in dojo, but should also be shared in some shared lib and have proper testing and be non recursive!
export function isEqualTo(x: any, y: any): boolean {
    const ok = Object.keys, tx = typeof x, ty = typeof y;
    return x && y && tx === 'object' && tx === ty ? (
        ok(x).length === ok(y).length &&
        ok(x).every(key => isEqualTo(x[key], y[key]))
    ) : (x === y);
}

function isRoughlyEqualTo (x: any, y: any, threshold: number): boolean {
    if (isEqualTo(x,y)) {
        return true;
    }

    if (typeof x === "object" && x !== null) {
        if (typeof y === "object" && y !== null) {
            let matchingPercentage = getObjectSimilarity(x,y);
            // console.log("Matching percentage", matchingPercentage, threshold);
            return matchingPercentage >= threshold;
        }
    }
    
    return false;
}

// Note, copied from comparer, should probably unit test all these functions!
export function getValueAtPath (obj: any, paths: Array<string>): any {
    paths = paths.slice(); // Need to clone this first before we start manipulating it

    while (paths.length > 0) {
        let nextKey = paths.shift();
        if (nextKey in obj) {
            if (typeof obj[nextKey] === "object") {
                if (obj[nextKey] === null) {
                    if (paths.length === 0) {
                        // Null, we cant go deeper, but queue is empty
                        return null;
                    }
                } else {
                    obj = obj[nextKey];
                }
            } else {
                if (paths.length === 0) {
                    // Primative, we cant go deeper, but queue is empty
                    return obj[nextKey];
                }
                return;
            }
        } else {
            return;
        }
    }
    return obj;
}

function getByteSize(value: any, paths: Array<string>): any {
    return JSON.stringify({
        t: ((typeof value) !== 'undefined') ? 's' : 'u',
        p: paths,
        v: value,
    }).length;
}

// Returns a percentage out of 100.
// We should use the number of json bytes of (paths + value) to determine the size of the change
export function getObjectSimilarity(oldObject: any, newObject: any): number {
    let oldPaths = getObjectLeafPaths(oldObject);
    let newPaths = getObjectLeafPaths(newObject);
    let matchedBytes = 0;
    let totalBytes = 0;
    oldPaths.forEach(paths => {
        let oldValue = getValueAtPath(oldObject, paths);
        let newValue = getValueAtPath(newObject, paths);
        let newSize = getByteSize(newValue, paths);
        // console.log("NEW SIZE", newSize, "newValue", newValue, "paths", paths);
        totalBytes += newSize;
        if (isEqualTo(oldValue, newValue)) {
            // console.log("Equal", paths, newSize);
            matchedBytes += newSize;
        } else {
            // console.log("Not equal", paths, newSize);
        }
    });
    newPaths.forEach(paths => {
        let newValue = getValueAtPath(newObject, paths);
        let oldValue = getValueAtPath(oldObject, paths);
        let newSize = getByteSize(newValue, paths);
        totalBytes += newSize;
        if (isEqualTo(newValue, oldValue)) {
            matchedBytes += newSize;
            // console.log("Equal", paths, newSize);
        } else {
            // console.log("Not equal", paths, newSize);
        }
    });
    return Math.round((matchedBytes / totalBytes) * 100);
}

interface ArrayUpdate {
    t: string,
    i: number,
    r: number,
    v: Array<any>,
}
interface ComparisonResult {
    arrayUpdates: Array<ArrayUpdate>,
    appliedArray: Array<any>,
}

export function compareArrays (oldArray: Array<any>, newArray: Array<any>, threshold: number = 60): ComparisonResult {
    let arrayUpdates = [];

    // Do the magic here with the huristics we decided from before.
    let isSimilarEnough = false;
    if (typeof oldArray !== "object") {
        throw new Error("Expecting oldArray to be an object but found: " + typeof oldArray);
    }
    if (typeof newArray !== "object") {
        throw new Error("Expecting newArray to be an object but found: " + typeof newArray);
    }
    if (oldArray === null) {
        throw new Error("oldArray is null");
    }
    if (newArray === null) {
        throw new Error("newArray is null");
    }
    if (!(oldArray instanceof Array)) {
        throw new Error("Expecting oldArray to be an array, but it wasnt");
    }
    if (!(newArray instanceof Array)) {
        throw new Error("Expecting newArray to be an array, but it wasnt");
    }
    let appliedArray = oldArray.slice();
    
    while(!isSimilarEnough) {

        // console.log("Comparing 2 arrays", appliedArray, newArray);
        let refsList = compareArrayReferences(appliedArray, newArray, threshold);

        // Continue until offset != 0 for an index
        let incorrectIndex = null;
        for(let i=0; i<refsList.length; i++) {
            let refs = refsList[i];
            if (refs.filter(r => r.offset === 0).length > 0) {
                // This index is already correct
            } else {
                // This is the first index which is NOT correct
                incorrectIndex = i;
                break;
            }
        }

        if (incorrectIndex !== null) {
            if (refsList[incorrectIndex].length > 0) {
                let tryThese = refsList[incorrectIndex];
                // console.log("Trying these", tryThese);
                // Find the one that goes the furthest to the right
                let mostCommonOffset = null;
                let mostCommonFrequency = null;
                tryThese.sort((a,b) => a.offset - b.offset);
                for(let j=0; j<tryThese.length; j++) {
                    let tryThis = tryThese[j];
                    let count = 1;
                    
                    for(let i=incorrectIndex+1; i<refsList.length; i++) {
                        let nextRefs = refsList[i];
                        if (nextRefs.filter(r => r.offset === tryThis.offset).length > 0) {
                            count++;
                        } else {
                            break;
                        }
                    }
                    
                    if (mostCommonOffset === null || mostCommonFrequency < count) {
                        mostCommonOffset = tryThis.offset;
                        mostCommonFrequency = count;
                    }
                }
                // console.log("Most common offset is: ", mostCommonOffset, " with a frequency of ", mostCommonFrequency);

                if (mostCommonOffset > 0) {
                    // console.log("At index", incorrectIndex, "removing", mostCommonOffset, "items");
                    appliedArray.splice(incorrectIndex, mostCommonOffset);
                    let update = {};
                    update[TYPE] = SPLICE;
                    update[INDEX] = incorrectIndex;
                    update[REMOVE] = mostCommonOffset;
                    arrayUpdates.push(update);
                } else {
                    // let items = newArray.slice(incorrectIndex, -mostCommonOffset);
                    // console.log("Cant think how this can ever happen??? At index", incorrectIndex, "inserting", -mostCommonOffset, "items", items);
                    // This happens quite often when duplicate items exist in an array
                    // I am just copying the below code, because it should work in the same way
                    // New item, count how many new items there are beyond this one
                    let toAdd = 1;
                    for(let i=incorrectIndex+1; i<refsList.length; i++) {
                        let nextRefs = refsList[i];
                        if (nextRefs.length === 0) {
                            toAdd++;
                        } else {
                            break;
                        }
                    }
                    let items = newArray.slice(incorrectIndex, incorrectIndex + toAdd);
                    // console.log("At index", incorrectIndex, "inserting", toAdd, "items", items);
                    appliedArray.splice(incorrectIndex, 0, ...items);
                    let update = {};
                    update[TYPE] = SPLICE;
                    update[INDEX] = incorrectIndex;
                    update[REMOVE] = 0;
                    update[VALUES] = items;
                    arrayUpdates.push(update);

                }
            } else {
                // New item, count how many new items there are beyond this one
                let toAdd = 1;
                for(let i=incorrectIndex+1; i<refsList.length; i++) {
                    let nextRefs = refsList[i];
                    if (nextRefs.length === 0) {
                        toAdd++;
                    } else {
                        break;
                    }
                }
                let items = newArray.slice(incorrectIndex, incorrectIndex + toAdd);
                // console.log("At index", incorrectIndex, "inserting", toAdd, "items", items);
                appliedArray.splice(incorrectIndex, 0, ...items);
                let update = {};
                update[TYPE] = SPLICE;
                update[INDEX] = incorrectIndex;
                update[REMOVE] = 0;
                update[VALUES] = items;
                arrayUpdates.push(update);
            }
        } else {
            // All items are similar enough
            isSimilarEnough = true;
        }
    }

    // BUT the applied array might be too long here because we only check up to the newArray indexes.
    if (appliedArray.length > newArray.length) {
        // Remove the difference
        let remove = appliedArray.length - newArray.length;
        let atIndex = newArray.length;

        appliedArray.splice(atIndex, remove);
        let update = {};
        update[TYPE] = SPLICE;
        update[INDEX] = atIndex;
        update[REMOVE] = remove;
        arrayUpdates.push(update);
    }

    // TODO Merge splices that are inserts with deletions at the same index
    // Merge a deletion splice + consecutive insert splice at the same index
    // Merge an insert splice + consecutive deletion splice at index + (inserted items count)
    let prevUpdate = null;
    for (let i=0; i<arrayUpdates.length; i++) {
        if (prevUpdate !== null && !('deleted' in prevUpdate)) {
            let currentUpdate = arrayUpdates[i];
            if (currentUpdate[TYPE] === SPLICE && prevUpdate[TYPE] === SPLICE) {
                // Detected two splices in a row
                if ((!(VALUES in prevUpdate)) && prevUpdate[REMOVE] > 0 && currentUpdate[REMOVE] === 0 && VALUES in currentUpdate && currentUpdate[VALUES].length > 0 && prevUpdate[INDEX] === currentUpdate[INDEX]) {
                    // Removal with no inserts found before an insertion, move the values to the previous deletion, and mark the current as deleted.
                    prevUpdate[VALUES] = currentUpdate[VALUES];
                    currentUpdate.deleted = true;
                } else if ((!(VALUES in currentUpdate)) && currentUpdate[REMOVE] > 0 && prevUpdate[REMOVE] === 0 && VALUES in prevUpdate && prevUpdate[VALUES].length > 0 && currentUpdate[INDEX] === (prevUpdate[INDEX] + prevUpdate[VALUES].length)) {
                    // Insertion was first with removal happening at the index after the inserts, just copy the number of removals to the prev splice and mark current as deleted
                    prevUpdate[REMOVE] = currentUpdate[REMOVE];
                    currentUpdate.deleted = true;
                }
            }
        }
        prevUpdate = arrayUpdates[i];
    }
    // Remove the deleted splices from the list
    arrayUpdates = arrayUpdates.filter(e => !('deleted' in e));

    return {
        arrayUpdates,
        appliedArray,
    }
}


/*
let a = [
    "111",
    "2",
    {
        a: 'a',
        b: 'b',
        c: 'c',
    }
]
let b = [
    "111",
    "3",
    {
        a: 'a',
        b: 'b',
        c: 'd',
    }
]
console.log("Compare result", compareArrays(a, b, 60));
*/

/*
let c = [
    'a',
    'b',
    'c',
];

let d = [
    'a',
    'b',
    'd',
];

console.log("Compare result", compareArrays(c, d, 60));
*/
