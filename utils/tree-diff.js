// Algorithms:
// - http://www.cs.haifa.ac.il/~oren/Publications/TEDinTALG.pdf
// - http://www.sciencedirect.com/science/article/pii/S0304397505000174
// - http://www.sciencedirect.com/science/article/pii/S0304397510005463
// - http://stackoverflow.com/a/29999368
// - https://en.wikipedia.org/wiki/Graph_isomorphism_problem
// - https://static.aminer.org/pdf/PDF/000/301/327/x_diff_an_effective_change_detection_algorithm_for_xml_documents.pdf


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

            // compare name
            if (lastItem.name !== newItem.name) {
                cmds.push({
                    op: 'rename',
                    id: lastItem.id,
                    name: newItem.name
                });
            }

            // compare children
            var lastItemChildren = lastItem.children;
            var newItemChildren = newItem.children;
            if (lastItemChildren) {
                if (newItemChildren) {
                    compareChildren(cmds, lastItemChildren, newItemChildren, lastItem.id);
                }
                else {
                    // remove all children
                    for (i = 0, len = lastItemChildren.length; i < len; i++) {
                        cmds.push({
                            op: 'remove',
                            id: lastItemChildren[i].id,
                        });
                    }
                }
            }
            else {
                if (newItemChildren) {
                    // add all children
                    for (i = 0, len = newItemChildren.length; i < len; i++) {
                        cmds.push({
                            op: 'append',
                            parentId: lastItem.id,
                            node: newItemChildren[i],
                        });
                    }
                }
            }
            newIndex++;
            lastIndex++;
        }
        else {
            // TODO - compares if just moved ?
            cmds.push({
                op: 'remove',
                id: lastItem.id
            });
            lastIndex++;
            cmds.push({
                op: 'append',
                parentId: parentId,
                node: newChildren[newIndex]
            });
            newIndex++;
        }
    }
}

// assert: newRoots non-nil
function treeDiff ( lastRoots, newRoots ) {
    lastRoots = lastRoots || [];

    var cmds = [];
    compareChildren(cmds, lastRoots, newRoots, null);

    return {
        cmds: cmds,
        get equal () {
            return cmds.length === 0;
        }
    };
}

module.exports = treeDiff;
