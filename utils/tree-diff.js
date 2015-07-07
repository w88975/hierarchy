// Algorithms:
// - http://www.cs.haifa.ac.il/~oren/Publications/TEDinTALG.pdf
// - http://www.sciencedirect.com/science/article/pii/S0304397505000174
// - http://www.sciencedirect.com/science/article/pii/S0304397510005463
// - http://stackoverflow.com/a/29999368
// - https://en.wikipedia.org/wiki/Graph_isomorphism_problem
// - https://static.aminer.org/pdf/PDF/000/301/327/x_diff_an_effective_change_detection_algorithm_for_xml_documents.pdf
// - https://github.com/Matt-Esch/virtual-dom

// assert: lastItem.id === newItem.id
function compareItemProps (context, lastItem, newItem) {
    var cmds = context.cmds;

    // compare name
    if (lastItem.name !== newItem.name) {
        cmds.push({
            op: 'rename',
            id: lastItem.id,
            name: newItem.name
        });
    }
    // compare children
    var i, len;
    var lastChildren = lastItem.children;
    var newChildren = newItem.children;
    if (lastChildren) {
        if (newChildren) {
            compareChildren(context, lastChildren, newChildren, lastItem.id);
        }
        else {
            //var removedNodes = context.removedNodes;
            // remove all children
            for (i = 0, len = lastChildren.length; i < len; i++) {
                var c = lastChildren[i];
                cmds.push({
                    op: 'remove',
                    id: c.id,
                });
                //removedNodes[c.id] = c;
            }
        }
    }
    else if (newChildren) {
        // add all children
        for (i = 0, len = newChildren.length; i < len; i++) {
            cmds.push({
                op: 'append',
                parentId: lastItem.id,
                node: newChildren[i],
            });
        }
    }
}

// assert: lastChildren, newChildren non-nil
function compareChildren ( context, lastChildren, newChildren, parentId ) {
    var cmds = context.cmds;
    //var removedNodes = context.removedNodes;
    var endLast = lastChildren.length;
    var endNew = newChildren.length;

    var lastIndex = 0, newIndex = 0;
    var i, len;
    while (lastIndex < endLast || newIndex < endNew) {
        // append new node
        if (lastIndex >= endLast) {
            cmds.push({
                op: 'append',
                parentId: parentId,
                node: newChildren[newIndex]
            });
            newIndex++;
            continue;
        }
        // remove current node
        var lastItem = lastChildren[lastIndex];
        if (newIndex >= endNew) {
            cmds.push({
                op: 'remove',
                id: lastItem.id
            });
            //removedNodes[lastItem.id] = lastItem;
            lastIndex++;
            continue;
        }
        // compare nodes
        var newItem = newChildren[newIndex];

        if (lastItem.id === newItem.id) {

            var sameItem = lastItem.name === newItem.name;

            var lastItemChildren = lastItem.children;
            var newItemChildren = newItem.children;
            if (sameItem && !lastItemChildren === !newItemChildren) {
                if (lastItemChildren) {
                    // has children
                    compareChildren(context, lastItemChildren, newItemChildren, lastItem.id);
                }
            }
            else {
                compareItemProps(context, lastItem, newItem);
            }
            newIndex++;
            lastIndex++;
        }
        else {
            var isShift = newIndex + 1 < endNew && lastItem.id === newChildren[newIndex + 1].id;
            var isUnShift = lastIndex + 1 < endLast && newItem.id === lastChildren[lastIndex + 1].id;
            if (isShift) {
                if (isUnShift) {
                    // swap nodes
                    cmds.push({
                        op: 'move',
                        id: lastItem.id,
                        index: newIndex + 1,
                        parentId: parentId,
                    });
                    compareItemProps(context, lastItem, newChildren[newIndex + 1]);
                    compareItemProps(context, lastChildren[lastIndex + 1], newItem);
                    newIndex += 2;
                    lastIndex += 2;
                }
                else {
                    // insert node
                    cmds.push({
                        op: 'insert',
                        index: newIndex,
                        parentId: parentId,
                        node: newItem
                    });
                    newIndex++;
                }
                continue;
            }
            if (isUnShift) {
                // remove node
                cmds.push({
                    op: 'remove',
                    id: lastItem.id,
                });
                //removedNodes[lastItem.id] = lastItem;
                lastIndex++;
                continue;
            }

            // else just replace node
            //cmds.push({
            //    op: 'replace',
            //    id: lastItem.id,
            //    index: newIndex,
            //    parentId: parentId,
            //    node: newChildren[newIndex]
            //});
            cmds.push({
                op: 'remove',
                id: lastItem.id,
            });
            //if (newIndex + 1 === endNew) {
            //    cmds.push({
            //        op: 'append',
            //        parentId: parentId,
            //        node: newChildren[newIndex]
            //    });
            //}
            //else {
                cmds.push({
                    op: 'insert',
                    index: newIndex,
                    parentId: parentId,
                    node: newChildren[newIndex]
                });
            //}
            //removedNodes[lastItem.id] = lastItem;

            lastIndex++;
            newIndex++;
        }
    }
}

// 将所有移除操作提前，防止 ID 重复
function sortOperationsById (context) {
    var cmds = context.cmds;

    var removingCmds = [];

    for (var i = 0, len = cmds.length; i < len; i++) {
        var cmd = cmds[i];
        switch (cmd.op) {
            case 'remove':
                removingCmds.push(cmd);
                cmds[i] = null;     // mark as erase
                break;
            //case 'replace':
            //    removingCmds.push({
            //        op: 'remove',
            //        id: cmd.id
            //    });
            //    cmds[i] = {
            //        op: 'insert',
            //        index: cmd.index,
            //        parentId: cmd.parentId,
            //        node: cmd.node
            //    };
            //    break;
        }
    }

    var addCmds = cmds.filter(function (cmd) {
        return cmd;
    });
    context.cmds = removingCmds.concat(addCmds);
}

//// 如果同个ID的节点有 先添加再移除 的操作，则将移除操作提前，防止应用补丁时发生ID重复的问题
//function sortOperationsById (context) {
//    var cmds = context.cmds;
//    var removedNodes = context.removedNodes;
//
//    var addingCmds = [];
//    var removingCmds = {};
//
//    for (var i = 0, len = cmds.length; i < len; i++) {
//        var cmd = cmds[i];
//        switch (cmd.op) {
//            case 'append':
//            case 'insert':
//                addingCmds.push(cmd);
//                break;
//            case 'remove':
//                removingCmds[cmd.id] = cmd;
//                break;
//            case 'replace':
//                removingCmds[cmd.id] = cmd;
//                addingCmds.push(cmd);
//                break;
//        }
//    }
//
//    // 递归所有增加的节点，判断是否是移除的，如果是的话需要重新排序
//    function checkChildren (node, removedNodes) {
//        // assert node.children.length > 0
//        var children = node.children;
//        for (var i = 0; i < children.length; i++) {
//            var child = children[i];
//            var rmCmd = removedNodes
//            if (child.id in removedNodes) {
//
//            }
//            nodes[] = child;
//            flattening(child, nodes);
//        }
//    }
//
//    for (var r = 0; r < addingCmds.length; r++) {
//        var addCmd = addingCmds[r];
//        if (addCmd.node.children) {
//            checkChildren(addCmd.node, removedNodes);
//        }
//        var rmCmd = removingCmds[addCmd.node.id];
//        if (rmCmd) {
//            // TODO - 优化成 move
//            var addCmdIndex = cmds.indexOf(addCmd);
//            var rmCmdIndex = cmds.indexOf(rmCmd);
//            if (addCmdIndex < rmCmdIndex) {
//                cmds.splice(rmCmdIndex, 1);
//                cmds.splice(addCmdIndex, 0, rmCmd);
//            }
//        }
//    }
//}

//// get all removed nodes recursively
//function flatteningRemovedNodes (context) {
//    function flattening (node, nodes) {
//        // assert node.children.length > 0
//        var children = node.children;
//        for (var i = 0; i < children.length; i++) {
//            var child = children[i];
//            nodes[child.id] = child;
//            flattening(child, nodes);
//        }
//    }
//    var removedNodes = context.removedNodes;
//    var rootIds = Object.keys(removedNodes);
//    for (var i = 0; i < rootIds.length; i++) {
//        var rootId = rootIds[i];
//        var root = removedNodes[root];
//        if (root.children) {
//            flattening(root, removedNodes);
//        }
//    }
//}

// assert: newRoots non-nil and lastRoots writable
function treeDiff ( lastRoots, newRoots ) {
    lastRoots = lastRoots || [];

    var context = {
        cmds: [],
        //removedNodes: {},   // 用来访问被父节点移除的子节点
    };

    compareChildren(context, lastRoots, newRoots, null);
    //flatteningRemovedNodes(context);
    sortOperationsById(context);

    //console.dir(context.cmds);

    return {
        cmds: context.cmds,
        get equal () {
            return this.cmds.length === 0;
        }
    };
}

module.exports = treeDiff;
