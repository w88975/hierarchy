// Algorithms:
// - http://www.cs.haifa.ac.il/~oren/Publications/TEDinTALG.pdf
// - http://www.sciencedirect.com/science/article/pii/S0304397505000174
// - http://www.sciencedirect.com/science/article/pii/S0304397510005463
// - http://stackoverflow.com/a/29999368
// - https://en.wikipedia.org/wiki/Graph_isomorphism_problem
// - https://static.aminer.org/pdf/PDF/000/301/327/x_diff_an_effective_change_detection_algorithm_for_xml_documents.pdf
// - https://github.com/Matt-Esch/virtual-dom

// assert: lastItem.id === newItem.id
function compareItemProps (cmds, lastItem, newItem) {
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
            compareChildren(cmds, lastChildren, newChildren, lastItem.id);
        }
        else {
            // remove all children
            for (i = 0, len = lastChildren.length; i < len; i++) {
                cmds.push({
                    op: 'remove',
                    id: lastChildren[i].id,
                });
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
function compareChildren ( cmds, lastChildren, newChildren, parentId ) {
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
                    compareChildren(cmds, lastItemChildren, newItemChildren, lastItem.id);
                }
            }
            else {
                compareItemProps(cmds, lastItem, newItem);
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
                    compareItemProps(cmds, lastItem, newChildren[newIndex + 1]);
                    compareItemProps(cmds, lastChildren[lastIndex + 1], newItem);
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
                lastIndex++;
                continue;
            }

            // else just replace node
            cmds.push({
                op: 'replace',
                id: lastItem.id,
                node: newChildren[newIndex]
            });
            lastIndex++;
            newIndex++;
        }
    }
}

// 如果同个ID的节点有 先添加再移除 的操作，则将移除操作提前，防止应用补丁时发生ID重复的问题
function sortOperationsById (cmds) {
    var removingCmds = [];
    var addingCmds = {};
    for (var i = 0, len = cmds.length; i < len; i++) {
        var cmd = cmds[i];
        switch (cmd.op) {
            case 'append':
            case 'insert':
                addingCmds[cmd.node.id] = cmd;
                break;
            case 'remove':
                removingCmds.push(cmd);
                break;

            case 'replace':
                removingCmds.push(cmd);
                addingCmds[cmd.node.id] = cmd;
                break;
        }
    }
    for (var r = 0; r < removingCmds.length; r++) {
        var rmCmd = removingCmds[r];
        var addCmd = addingCmds[rmCmd.id];
        if (addCmd) {
            // TODO - 优化成 move
            var addCmdIndex = cmds.indexOf(addCmd);
            var rmCmdIndex = cmds.indexOf(rmCmd);
            if (addCmdIndex < rmCmdIndex) {
                cmds.splice(rmCmdIndex, 1);
                cmds.splice(addCmdIndex, 0, rmCmd);
            }
        }
    }
}

// assert: newRoots non-nil and lastRoots writable
function treeDiff ( lastRoots, newRoots ) {
    lastRoots = lastRoots || [];

    var cmds = [];
    compareChildren(cmds, lastRoots, newRoots, null);
    sortOperationsById(cmds);

    return {
        cmds: cmds,
        get equal () {
            return this.cmds.length === 0;
        }
    };
}

module.exports = treeDiff;
