
/**
 * To support internal structures such as dates, we serialize things here so they can be represented as POJO (plain old javascript objects).
 * E.g. Dates are converted in to special objects that contain the internal represented time as an ISO timestmap string.
 * TODO We could also serialize the undefined type as a special object too so that we support undefined as a key value.
 * Currently an undefined value in an object key is equivalent to the key not being set in that object.
 * TODO Also BigInt
 * 
 * During the serialization process, we don't want to mutate the original object, or it would mean that we corrupt objects when comparing them.
 * We purposefully return another object.
 * 
 * But we need the mutate option when patching.
 * 
 * @param a The object to serialize
 */
export function serializeObject(a: any, mutate: boolean): any {

    const queue = [];
    queue.push({
        object: a,
        path: []
    });
    const outObj = {};

    while (queue.length > 0) {
        let item = queue.shift();

        const aKeys = Object.keys(item.object);
        const newObj = {};
        for (const key of aKeys) {
            const aValue = item.object[key];
            if (typeof aValue === "object") {
                if (aValue === null) {
                    if (!mutate) {
                        newObj[key] = null;
                    }
                } else {
                    if (aValue instanceof Date) {
                        // Found a date
                        const dateRepresentation = {
                            __special: "date",
                            isoString: aValue.toISOString(),
                        }
                        if (!mutate) {
                            newObj[key] = dateRepresentation;
                        } else {
                            item.object[key] = dateRepresentation;
                        }
                    } else if (aValue instanceof Array) {
                        // Found an array of items
                        newObj[key] = [];
                        for (let [index, arrItem] of aValue.entries()) {
                            if (typeof arrItem === "object") {
                                if (arrItem === null) {
                                    if (!mutate) {
                                        newObj[key][index] = null;
                                    }
                                } else {
                                    if (!mutate) {
                                        newObj[key][index] = {};
                                    }
                                    queue.push({
                                        object: arrItem,
                                        path: [...item.path, key, index]
                                    });
                                }
                            } else if (["boolean", "number", "string"].indexOf(typeof arrItem) !== -1) {
                                if (!mutate) {
                                    // Just copy the primative
                                    newObj[key][index] = arrItem;
                                }
                            } else {
                                throw new Error("Unsupported data type in array: " + typeof arrItem + " at path " + item.path.join(".") + index);
                            }
                        }

                    } else {
                        if (!mutate) {
                            newObj[key] = {};
                        }
                        // console.log("Found another object at key path: ", [...item.path, key]);
                        queue.push({
                            object: aValue,
                            path: [...item.path, key]
                        });
                    }
                }
            } else if (["boolean", "number", "string"].indexOf(typeof aValue) !== -1) {
                // Just copy the primative
                if (!mutate) {
                    newObj[key] = aValue;
                }
            } else {
                throw new Error("Unsupported data type value: " + typeof aValue + " at path " + item.path.join("."));
            }
        }
        
        if (!mutate) {
            // Update the correct point in the outObj that we return
            let target = outObj;
            for (let i=0; i<item.path.length - 1; i++) {
                if (!(item.path[i] in target)) {
                    target[item.path[i]] = {};
                }
                target = target[item.path[i]];
            }
            if (item.path.length === 0) {
                for (const key of Object.keys(newObj)) {
                    outObj[key] = newObj[key];
                }
            } else {
                target[item.path[item.path.length - 1]] = newObj;
            }
        }
    }

    if (!mutate) {
        return outObj;
    }
}


/**
 * The unserialize process will occur after a patch or reduceState takes place, 
 * so again we need to avoid mutating the original object here
 * 
 * But we need the mutate option when patching
 * 
 * @param a 
 */
export function unserializeObject(a: any, mutate: boolean): any {
    
    const queue = [];
    queue.push({
        object: a,
        path: []
    });
    const outObj = {};

    while (queue.length > 0) {
        let item = queue.shift();

        const aKeys = Object.keys(item.object);
        const newObj = {};
        for (const key of aKeys) {
            const aValue = item.object[key];
            if (typeof aValue === "object") {
                if (aValue === null) {
                    // Just copy the primative
                    if (!mutate) {
                        newObj[key] = null;
                    }
                } else if (aValue instanceof Array) {
                    // Found an array of items
                    if (!mutate) {
                        newObj[key] = [];
                    }
                    for (let [index, arrItem] of aValue.entries()) {
                        if (typeof arrItem === "object") {
                            if (arrItem === null) {
                                if (!mutate) {
                                    newObj[key][index] = null;
                                }
                            } else {
                                if (!mutate) {
                                    newObj[key][index] = {};
                                }
                                queue.push({
                                    object: arrItem,
                                    path: [...item.path, key, index]
                                });
                            }
                        } else if (["boolean", "number", "string"].indexOf(typeof arrItem) !== -1) {
                            // Just copy the primative
                            if (!mutate) {
                                newObj[key][index] = arrItem;
                            }
                        } else {
                            throw new Error("Unsupported data type in array: " + typeof arrItem + " at path " + item.path.join(".") + index);
                        }
                    }
                } else {
                    if ("__special" in aValue) {
                        if (aValue.__special === "date") {
                            const realDate = new Date(aValue.isoString);
                            if (mutate) {
                                item.object[key] = realDate;
                            } else {
                                newObj[key] = realDate;
                            }
                        } else {
                            throw new Error("Cannot unserialize unknown __special value: " + aValue.__special);
                        }
                    } else {
                        // Just a normal object
                        queue.push({
                            object: aValue,
                            path: [...item.path, key]
                        });
                    }
                }
            } else if (["boolean", "number", "string"].indexOf(typeof aValue) !== -1) {
                // Just copy the primative
                if (!mutate) {
                    newObj[key] = aValue;
                }
            } else {
                throw new Error("Unsupported data type value: " + typeof aValue + " at path " + item.path.join("."));
            }
        }

        if (!mutate) {
            // Update the correct point in the outObj that we return
            let target = outObj;
            for (let i=0; i<item.path.length - 1; i++) {
                if (!(item.path[i] in target)) {
                    target[item.path[i]] = {};
                }
                target = target[item.path[i]];
            }
            if (item.path.length === 0) {
                for (const key of Object.keys(newObj)) {
                    outObj[key] = newObj[key];
                }
            } else {
                target[item.path[item.path.length - 1]] = newObj;
            }
        }
    }

    if (!mutate) {
        return outObj;
    }
}