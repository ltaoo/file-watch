// @ts-nocheck
import { TARGET_POSITION_TYPE } from "./constants";
import { SourceNode } from "./types";

export function noop() {}
/**
 * type NodeLevel = string; // like 0、0-0、0-1、0-0-0
 * interface SourceNode {
 *  key: string;
 *  title: string;
 *  children?: Array<SourceNode>;
 * }
 * interface FormattedSourceNode {
 *  key: string;
 *  title: string;
 *  pos: string;
 *  children?: Array<FormattedSourceNode>;
 *  [propsName: string]: any;
 * }
 */
/**
 * add some key to sourceNode
 * @param {Array<SourceNode>} data
 * @param {string} [level='0'] - level at tree
 * @return {Array<FormattedSourceNode>}
 */
export const formatSourceNodes = (sourceNodes: SourceNode[], level = 1, parentPos?: string) =>
  sourceNodes.map((sourceNode, i) => {
    const { key, title, ...restProps } = sourceNode;
    const formattedSourceNode = {
      ...restProps,
      key,
      title,
      pos: parentPos === undefined ? String(i) : `${parentPos}-${i}`,
    };
    if (sourceNode.children && sourceNode.children.length) {
      const nextLevel = level + 1;
      formattedSourceNode.children = formatSourceNodes(sourceNode.children, nextLevel, formattedSourceNode.pos);
    }
    return formattedSourceNode;
  });

/**
 * collect node key and its children keys
 * @param {Array<VueComponent>} treeNodes
 * @param {function} callback
 */
export function traverseTreeNodes(treeNodes = [], callback) {
  /**
   * @param {Array<VueComponent>} subTreeNodes
   * @param {number} level
   * @param {Array<>} parentsChildrenPos
   * @param {number} parentPos
   */
  function traverse(subTreeNodes, level, parentsChildrenPos, parentPos) {
    let newSubTreeNodes = subTreeNodes;
    if (subTreeNodes && subTreeNodes.length) {
      newSubTreeNodes = subTreeNodes.filter(Boolean);
    }

    newSubTreeNodes.forEach((treeNode, index) => {
      if (!treeNode.isTreeNode) {
        return;
      }
      const { pos } = treeNode;
      // Note: side effect
      parentsChildrenPos.push(pos);

      const childrenPos = [];
      if (treeNode.$children) {
        traverse(treeNode.$children, pos, childrenPos, pos);
      }
      callback(treeNode, index, pos, treeNode.rckey || pos, childrenPos, parentPos);
    });
  }
  traverse(treeNodes, 0, []);
}

/**
 *
 * @param {*} smallArray
 * @param {*} bigArray
 */
export function isInclude(smallArray, bigArray) {
  return smallArray.every((item, index) => item === bigArray[index]);
}

/**
 * get key and children's key of dragging node
 * @param {VueComponent} treeNode - dragging node
 * @return {Array<>}
 */
export function getDraggingNodesKey(treeNode) {
  const dragNodesKeys = [];
  // 拿到位置信息
  const treeNodePosArr = treeNode.pos.split("-");
  traverseTreeNodes(treeNode.$children, (item, index, pos, key) => {
    const childPosArr = pos.split("-");
    if (
      (treeNode.pos === pos || treeNodePosArr.length < childPosArr.length) &&
      isInclude(treeNodePosArr, childPosArr)
    ) {
      // 正在拖拽的节点的“子孙节点”
      dragNodesKeys.push(key);
    }
  });
  // 再将正在拖拽的节点 key 放进来
  dragNodesKeys.push(treeNode.rckey);
  return dragNodesKeys;
}

/**
 * get node position info
 * @param {Element} ele
 */
export function getOffset(ele) {
  if (!ele.getClientRects().length) {
    return { top: 0, left: 0 };
  }

  const rect = ele.getBoundingClientRect();
  if (rect.width || rect.height) {
    const doc = ele.ownerDocument;
    const win = doc.defaultView;
    const docElem = doc.documentElement;

    return {
      top: rect.top + win.pageYOffset - docElem.clientTop,
      left: rect.left + win.pageXOffset - docElem.clientLeft,
    };
  }

  return rect;
}

/**
 * type TargetPositionType = -1 | 0 | 1;
 */

/**
 * @param {Event} e
 * @param {VueComponent} treeNode - entered node
 * @return {TargetPostionType}
 * TARGET_POSITION_TYPE.BOTTOM
 * |TARGET_POSITION_TYPE.CONTENT
 * |TARGET_POSITION_TYPE.TOP
 */
export function calcDropPosition(e, treeNode) {
  const { selectHandle } = treeNode.$refs;
  const offsetTop = getOffset(selectHandle).top;
  const offsetHeight = selectHandle.offsetHeight;
  const pageY = e.pageY;
  // TODO: remove hard code
  const gapHeight = 2;
  // if move to node bottom
  if (pageY > offsetTop + offsetHeight - gapHeight) {
    return TARGET_POSITION_TYPE.BOTTOM;
  }
  // if move to node top
  if (pageY < offsetTop + gapHeight) {
    return TARGET_POSITION_TYPE.TOP;
  }
  // move to node content
  return TARGET_POSITION_TYPE.CONTENT;
}

interface FindSourceCallback {
  (sourceNode: SourceNode, index: number, arr: Array<SourceNode>): void;
}

/**
 *  interface FindSourceCallback {
 *      (sourceNode: SourceNode, index: number, arr: Array<SourceNode>): void;
 *  }
 */
/**
 * @param {Array<SourceNode>} data
 * @param {string} key
 * @param {FindSourceCallback} callback
 */
export const findSourceNodeByKey = (sourceNodes: SourceNode[], key: string, callback: FindSourceCallback) => {
  sourceNodes.forEach((sourceNode, index, arr) => {
    if (sourceNode.key === key) {
      return callback(sourceNode, index, arr);
    }
    if (sourceNode.children) {
      return findSourceNodeByKey(sourceNode.children, key, callback);
    }
    return false;
  });
};

/**
 * get last sourceNodes and move type
 * @param {Array<SourceNode>} sourceNodes
 * @param {any} draggingNodeKey
 * @param {any} targetNodeKey
 * @param {TargetPostionType} targetPosition
 * @return {SourceNode | undefined} targetNode
 * @return {number | undefined} targetNodeIndex
 * @return {Array<SourceNode> | undefined} targetNodes
 * @return {SourceNode} originSourceNode
 * @return {number} originSourceNodeIndex
 * @return {Array<SourceNode>} originSourceNodes
 */
export function computeMoveNeededParams(
  sourceNodes: SourceNode[],
  draggingNodeKey: string,
  targetNodeKey: string,
  targetPosition: TARGET_POSITION_TYPE
) {
  const isDropToGap = targetPosition !== TARGET_POSITION_TYPE.CONTENT;
  let draggingSourceNode;
  let hasSameLevelNodesAsDraggingNode;
  let draggingNodeIndexAtSameLevelNodes;
  // first we find the dragging sourceNode
  findSourceNodeByKey(sourceNodes, draggingNodeKey, (sourceNode, index, arr) => {
    hasSameLevelNodesAsDraggingNode = arr;
    draggingNodeIndexAtSameLevelNodes = index;
    draggingSourceNode = sourceNode;
  });
  let hasSameLevelNodesAsTargetNode = null;
  let targetNodeIndexAtSameLevelNodes;
  if (!isDropToGap) {
    let targetSourceNode = null;
    // place to target content, mean become child of target node
    const findSourceNodeCallback = (sourceNode: SourceNode) => {
      targetSourceNode = sourceNode;
    };
    findSourceNodeByKey(sourceNodes, targetNodeKey, findSourceNodeCallback);
    return {
      targetSourceNode,
      originSourceNode: draggingSourceNode,
      originSourceNodeIndex: draggingNodeIndexAtSameLevelNodes,
      originSourceNodes: hasSameLevelNodesAsDraggingNode,
    };
  }
  // remove source node from same level nodes
  const findSourceNodeCallback = (_: unknown, index: number, nodes) => {
    hasSameLevelNodesAsTargetNode = nodes;
    targetNodeIndexAtSameLevelNodes = index;
  };
  findSourceNodeByKey(sourceNodes, targetNodeKey, findSourceNodeCallback);

  return {
    targetSourceNodes: hasSameLevelNodesAsTargetNode,
    targetSourceNodeIndex: targetNodeIndexAtSameLevelNodes,
    originSourceNode: draggingSourceNode,
    originSourceNodeIndex: draggingNodeIndexAtSameLevelNodes,
    originSourceNodes: hasSameLevelNodesAsDraggingNode,
  };
}

/**
 * param reassign, no return
 * @param {number} targetSourceNodeIndex
 * @param {Array<SourceNode>} targetSourceNodes
 * @param {SourceNode} originSourceNode
 * @param {number} originSourceNodeIndex
 * @param {Array<SourceNode>} originSourceNodes
 */
export function insertToTop(
  targetSourceNodeIndex: number,
  targetSourceNodes: SourceNode[],
  originSourceNode: SourceNode,
  originSourceNodeIndex: number,
  originSourceNodes: SourceNode[]
) {
  if (originSourceNodes !== targetSourceNodes || originSourceNodeIndex > targetSourceNodeIndex) {
    originSourceNodes.splice(originSourceNodeIndex, 1);
    targetSourceNodes.splice(targetSourceNodeIndex, 0, originSourceNode);
    return {
      targetSourceNodes,
      originSourceNodes,
    };
  }
  targetSourceNodes.splice(targetSourceNodeIndex, 0, originSourceNode);
  originSourceNodes.splice(originSourceNodeIndex, 1);
  return {
    targetSourceNodes,
    originSourceNodes,
  };
}

/**
 * param reassign, no return
 * @param {number} targetSourceNodeIndex
 * @param {Array<SourceNode>} targetSourceNodes
 * @param {SourceNode} originSourceNode
 * @param {number} originSourceNodeIndex
 * @param {Array<SourceNode>} originSourceNodes
 */
export function insertToBottom(
  targetSourceNodeIndex: number,
  targetSourceNodes: SourceNode[],
  originSourceNode: SourceNode,
  originSourceNodeIndex: number,
  originSourceNodes: SourceNode[]
) {
  let newTargetSourceNodeIndex = targetSourceNodeIndex + 1;
  if (originSourceNodes === targetSourceNodes) {
    if (targetSourceNodeIndex > originSourceNodeIndex) {
      newTargetSourceNodeIndex = targetSourceNodeIndex;
    }
  }
  originSourceNodes.splice(originSourceNodeIndex, 1);
  targetSourceNodes.splice(newTargetSourceNodeIndex, 0, originSourceNode);
  return {
    targetSourceNodes,
    originSourceNodes,
  };
}
