import React, { isValidElement } from "react";
import flattenChildren from "react-flatten-children";
import { compareOwnProps } from "tools/common";

/**
 * Compares the children of a React component.  This can be rather expensive, so use it only
 * when it is deemed necessary.
 *
 * @export
 * @param {*} leftChildren The contents of a `children` prop.
 * @param {*} rightChildren The contents of a `children` prop.
 * @param {boolean} [recurse=false] Whether to recurse into the children's children.
 * @returns {boolean} Whether the children have an equivalent structure.
 */
export const compareChildren = (leftChildren, rightChildren, recurse = false) => {
  // Existential difference check.
  const leftDefined = leftChildren != null;
  const rightDefined = rightChildren != null;
  if (!leftDefined && !rightDefined) return true;
  if (leftDefined !== rightDefined) return false;

  // That rare instance where the children actually are the same instance.
  if (Object.is(leftChildren, rightChildren)) return true;

  const left = React.Children.toArray(leftChildren);
  const right = React.Children.toArray(rightChildren);
  return doCompareChildren(left, right, recurse);
}

/**
 * Compares the children of a React component.  This can be rather expensive, so use it only
 * when it is deemed necessary.
 * 
 * This version will flatten any `Fragment` components in the given children before performing
 * the comparison.
 * 
 * Note: when `recurse` is `true`, the children's children will not be flattened, however any
 * `Fragment` components will still have their children traversed and compared.
 *
 * @export
 * @param {*} leftChildren The contents of a `children` prop.
 * @param {*} rightChildren The contents of a `children` prop.
 * @param {boolean} [recurse=false] Whether to recurse into the children's children.
 * @returns {boolean} Whether the children have an equivalent structure.
 */
export const compareFlatChildren = (leftChildren, rightChildren, recurse = false) => {
  // Existential difference check.
  const leftDefined = leftChildren != null;
  const rightDefined = rightChildren != null;
  if (!leftDefined && !rightDefined) return true;
  if (leftDefined !== rightDefined) return false;

  // That rare instance where the children actually are the same instance.
  if (Object.is(leftChildren, rightChildren)) return true;

  const left = flattenChildren(leftChildren);
  const right = flattenChildren(rightChildren);
  return doCompareChildren(left, right, recurse);
}

const doCompareChildren = (left, right, recurse) => {
  // Short-cut for differing lengths.
  if (left.length !== right.length)
    return false;

  for (let i = 0, len = left.length; i < len; i++) {
    const leftChild = left[i];
    const rightChild = right[i];

    // Equality check.
    if (Object.is(leftChild, rightChild))
      continue;
    
    // If either child is not a React element, and they failed the equality check,
    // they can't be the same.
    if (!isValidElement(leftChild) || !isValidElement(rightChild))
      return false;

    // Component type check.
    if (!Object.is(leftChild.type, rightChild.type))
      return false;
    
    // Component key check.
    if (leftChild.key !== rightChild.key)
      return false;
    
    // Component props check.
    if (recurse) {
      const { children: leftChildren, ...leftProps } = leftChild.props;
      const { children: rightChildren, ...rightProps } = rightChild.props;

      if (!compareOwnProps(leftProps, rightProps))
        return false;
      
      // No need to call `compareFlatChildren` when in recursive mode.
      // The children of `Fragment` components will be compared anyways.
      if (!compareChildren(leftChildren, rightChildren, true))
        return false;
    }
    else if (!compareOwnProps(leftChild.props, rightChild.props))
      return false;
  }

  return true;
};