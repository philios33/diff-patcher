import { compareArrays, getValueAtPath } from "./array";
import { serializeObject } from "./serializer";

// Get all paths in A and specifically remember whether they are primatives or point to another object.  Order them by size in to a single array to check.
// For each path in A, find it in B, check its type matches, if its a primative check its value matches (otherwise its a change)
// Missing paths in B mean they got deleted.  All other paths below the removed key can be removed from the checking list.
// Do the same for B, get all paths in B and look through As again to find ones that have been added.  If a path was added, all paths below in the B list can be disregarded.

// So we need a way of getting all paths of an array. We cannot use dot notation here and "." splitting because object keys may contain the dot character, so we have to make arrays of keys.

// Hint: The idea is, instead of process a child object immediately via a recursive call, we place it in a queue and keep looping until either the queue is empty or we find what we're looking for.

// Update: The keys of an update were previously type, path, value.  I am shortening them to t, p & v.
// Update: The only types of update currently is set and unset.  I am shortening them to s & u.

const TYPE = 't';
const PATH = 'p';
const VALUE = 'v';

const SET = 's';
const UNSET = 'u';

/* // OLD
const TYPE = 'type';
const PATH = 'path';
const VALUE = 'value';

const SET = 'set';
const UNSET = 'unset';
*/

// Get all paths in an object which exist
export default function compare(aObj, bObj) {
    if (typeof aObj !== 'object' || typeof bObj !== 'object' || aObj === null || bObj === null) {
        throw new Error("Can only compare two objects");
    }

    let changes = [];

    let queue = [];

    // When comparing, we never mutate the original, but we must compare the serialized objects.
    const a = serializeObject(aObj, false);
    const b = serializeObject(bObj, false);

    // Add the root object "a" with an empty path array
    queue.push({
        object: a,
        path: []
    });

    while (queue.length > 0) {
        let item = queue.shift();
        let thisObj = item.object;
        Object.keys(thisObj).forEach(keyName => {
            let thisPath = item.path.slice();
            thisPath.push(keyName);
            
            let bValue = getValueAtPath(b, thisPath);
            
            let typeOf = typeof thisObj[keyName];
            if (typeOf === "undefined") {
                throw new Error("Cannot compare undefined key at: " + thisPath.join("."));
            } else if (typeOf === "object") {
                if (thisObj[keyName] === null) {
                    // Null was found, we cant go any deeper
                    if (typeof bValue === "undefined") {
                        // Doesn't exist in b (it was removed)
                        let change = {};
                        change[TYPE] = UNSET;
                        change[PATH] = thisPath;
                        changes.push(change);
                    } else if (bValue === null) {
                        // Still equal to null, no change
                    } else {
                        // Value was replaced with something
                        let change = {};
                        change[TYPE] = SET;
                        change[PATH] = thisPath;
                        change[VALUE] = bValue;
                        changes.push(change);
                    }
                } else {
                    // It's an iterable non-null object
                    if (typeof bValue === "undefined") {
                        // Doesn't exist in b (it was removed)
                        let change = {};
                        change[TYPE] = UNSET;
                        change[PATH] = thisPath;
                        changes.push(change);
                    } else if (typeof bValue === 'object' && bValue !== null) {
                        // Still is an object in b, no change yet
                        // We can go deeper though

                        // Hook for comparing 2 arrays
                        if (bValue instanceof Array && thisObj[keyName] instanceof Array) {
                            let arrayComparisonResult = compareArrays(thisObj[keyName], bValue, 60);
                            arrayComparisonResult.arrayUpdates.forEach(update => {
                                update[PATH] = thisPath;
                                changes.push(update);
                            });
                            // Completely replace the original array pointer with the new applied one
                            thisObj[keyName] = arrayComparisonResult.appliedArray;
                        }

                        queue.push({
                            object: thisObj[keyName],
                            path: thisPath,
                        });
                    } else {
                        // Object value was replaced with a primative or null
                        let change = {};
                        change[TYPE] = SET;
                        change[PATH] = thisPath;
                        change[VALUE] = bValue;
                        changes.push(change);
                    }
                }
            } else {
                // The key is a primative
                if (typeof bValue === "undefined") {
                    // Doesn't exist in b (it was removed)
                    let change = {};
                    change[TYPE] = UNSET;
                    change[PATH] = thisPath;
                    changes.push(change);
                } else if (typeof bValue === 'object') {
                    // Primative variable was replaced with a whole object in b
                    let change = {};
                    change[TYPE] = SET;
                    change[PATH] = thisPath;
                    change[VALUE] = bValue;
                    changes.push(change);
                } else {
                    // Primative is still a primative, compare
                    if (thisObj[keyName] !== bValue) {
                        let change = {};
                        change[TYPE] = SET;
                        change[PATH] = thisPath;
                        change[VALUE] = bValue;
                        changes.push(change);
                    }
                }
            }
        });
    }

    // Now traverse B and check for things that don't exist at all in a
    queue.push({
        object: b,
        path: []
    });

    while (queue.length > 0) {
        let item = queue.shift();
        let thisObj = item.object;
        Object.keys(thisObj).forEach(keyName => {
            let thisPath = item.path.slice();
            thisPath.push(keyName);
            
            let aValue = getValueAtPath(a, thisPath);

            let typeOf = typeof thisObj[keyName];
            if (typeOf === "undefined") {
                throw new Error("Cannot compare undefined key (in b) at: " + thisPath.join("."));
            } else if (typeOf === "object") {
                if (thisObj[keyName] === null) {
                    // Null was found, we cant go any deeper
                    if (typeof aValue === "undefined") {
                        // Didn't exist before (null was added)
                        let change = {};
                        change[TYPE] = SET;
                        change[PATH] = thisPath;
                        change[VALUE] = null;
                        changes.push(change);
                    } else if (aValue === null) {
                        // Still equal to null, no change
                    } else {
                        // Value was something else
                        // So should have been detected above
                        /*
                        changes.push({
                            type: 'set',
                            path: thisPath,
                            value: null,
                        });
                        */
                    }
                } else {
                    // Non null object found in b
                    if (typeof aValue === "undefined") {
                        // Didn't exist before (object was added)
                        let change = {};
                        change[TYPE] = SET;
                        change[PATH] = thisPath;
                        change[VALUE] = thisObj[keyName];
                        changes.push(change);
                        // No need to go deeper
                    } else if (typeof aValue === 'object' && aValue !== null) {
                        // Still is an object in b, no change yet
                        // We can go deeper though
                        // BUT we shouldn't go deeper if the aValue is null since that would get detected before
                        queue.push({
                            object: thisObj[keyName],
                            path: thisPath,
                        });
                    } else {
                        // Object was a primative, now replaced with an object
                        // TODO might need to remove this one
                        /*
                        changes.push({
                            type: 'set',
                            path: thisPath,
                            value: thisObj[keyName],
                        });
                        */
                    }
                }
            } else {
                // Value is now a primative
                // Only add to changes list if it was undefined before
                if (typeof aValue === "undefined") {
                    let change = {};
                    change[TYPE] = SET;
                    change[PATH] = thisPath;
                    change[VALUE] = thisObj[keyName];
                    changes.push(change);
                }
            }
        });
    }

    return changes;
}
