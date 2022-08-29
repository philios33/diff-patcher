// Never use recursion

import { serializeObject, unserializeObject } from "./serializer";

// Note: A patch represents the changes in data between serialized data structures
// This means we need to always serialize the incoming object first to a clean incase it contains dates.
// But this means we would need a serializer and unserializer that mutates the object rather than reduces.


// Execute all the patch updates on this object by mutating it.
export function patchObject (obj, patch: Array<any>) {

    if ((typeof obj) !== "object") {
        throw new Error("First argument must be an object");
    }
    if (obj === null) {
        throw new Error("First argument cannot be null");
    }
    if (!(patch instanceof Array)) {
        throw new Error("Second argument must be an Array");
    }

    // First serialize the starting object by mutating it
    serializeObject(obj, true);

    patch.forEach(update => {
        if (!(update.p instanceof Array)) {
            throw new Error("Path ('p') must always be an array of strings");
        }
        if (update.p.length === 0) {
            throw new Error("Path ('p') must be an array with something in it");
        }
        let paths = update.p.slice();
        // Set the key value
        let keyName = paths.pop();
        // Find the object by path
        let current = obj;
        while(paths.length > 0) {
            let next = paths.shift();
            if (next in current) {
                if (typeof current[next] === 'object') {
                    current = current[next];
                } else {
                    throw new Error("Key " + next + " is not an object at: " + update.p.join(".") + " found " + typeof current[next]);
                }
            } else {
                throw new Error("Not found key " + next + " when searching for: " + update.p.join("."));
            }
        }
        if (update.t === 's') {
            // Set it
            current[keyName] = update.v;
        } else if (update.t === 'u') {
            // Unset (Delete) it
            // If we are removing an array index here, we should probably splice it out
            const keyNum = parseInt(keyName, 10);
            if (Array.isArray(current) && keyNum.toString() === keyName) {
                current.splice(keyNum, 1);
            } else {
                delete current[keyName];
            }
        } else if (update.t === 'p') {
            // Splice
            let theValues = [];
            if (update.v) {
                theValues = update.v;
            }
            current[keyName].splice(update.i, update.r, ...theValues);
        }
    });

    // Finally unserialize it back now that we are done patching
    unserializeObject(obj, true);
}

// Returns a new state object which is patched.  Does not mutate the original state.
export function reduceState (unserializedState, patch) {

    // We must serialize before performing the patch
    const state = serializeObject(unserializedState, false);

    let oldState = state;
    patch.forEach(update => {

        if (!(update.p instanceof Array)) {
            throw new Error("Path ('p') must always be an array of strings");
        }
        if (update.p.length === 0) {
            throw new Error("Path ('p') must be an array with something in it");
        }
        let newState = {};
        let paths = update.p.slice();

        // The idea is to dig deep until we are at the level that needs to be edited
        let currentOld = oldState;
        let currentNew = newState;
        let finalKeyName = paths[paths.length - 1];
        while(paths.length > 0) {
            let next = paths.shift();
            let found = false;
            Object.keys(currentOld).forEach(keyName => {
                if (keyName !== next) {
                    // Do a pointer copy
                    currentNew[keyName] = currentOld[keyName];
                } else {
                    // We're on the right track
                    if (paths.length > 0) {
                        if (typeof currentOld[keyName] === "object") {
                            currentNew[keyName] = {};
                            if (currentOld[keyName] instanceof Array) {
                                currentNew[keyName] = [];
                            }
                        } else {
                            if (paths.length > 0) {
                                throw new Error("Not an object found: " + keyName + " : " + update.p.join("."));
                            }
                        }
                        
                        // We cannot manipulate currentOld while we are still looping through its members
                        found = true;
                        
                    } else {
                        // This is the final item
                        // Previously unset and set were the only operations, but now we can splice arrays
                        // So we need to make a shallow copy of the original array in this situation
                        if (currentOld[keyName] instanceof Array) {
                            currentNew[keyName] = [...currentOld[keyName]];
                        }
                    }
                }
            });

            if (paths.length > 0) {
                if (found) {
                    currentOld = currentOld[next];
                    currentNew = currentNew[next];
                } else {
                    /*
                    console.warn("**** PATCHER FAIL START");
                    console.warn("UPDATE:", update);
                    console.warn("OLD STATE:", oldState);
                    console.warn("**** PATCHER FAIL END");
                    */

                    throw new Error("Not found key in current state: " + next + " : " + update.p.join("."));
                }
            }
        }
        if (update.t === 's') {
            // Set it
            // console.log("FInal key name", finalKeyName, update.v, JSON.stringify(currentNew));
            currentNew[finalKeyName] = update.v;
            // console.log(JSON.stringify(currentNew), JSON.stringify(newState));
        } else if (update.t === 'u') {
            // Unset (Delete) it
            delete currentNew[finalKeyName];
        } else if (update.t === 'p') {
            // Splice the array items
            // console.log("Splicing the array items...", update);
            let values = [];
            if (update.v) {
                values = update.v;
            }
            // console.log("CurrentNew", currentNew, "finalKeyName", finalKeyName);
            currentNew[finalKeyName].splice(update.i, update.r, ...values);
        }
        oldState = newState;
    });

    return unserializeObject(oldState, false);
}

