import compareAlias  from "./comparer";
import { patchObject as patchObjectAlias, reduceState as reduceStateAlias} from "./patcher";

export const compare = compareAlias;
export const patchObject = patchObjectAlias;
export const reduceState = reduceStateAlias;

export default {
    compare,
    patchObject,
    reduceState,
}