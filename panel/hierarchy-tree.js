(function () {
var Path = require('fire-path');
var treeDiff = Editor.require('packages://hierarchy/utils/tree-diff');

Polymer({
    is: 'hierarchy-tree',

    behaviors: [EditorUI.focusable, EditorUI.droppable, EditorUI.idtree],

    hostAttributes: {
        'droppable': 'asset,node',
    },

    listeners: {
        'focus': '_onFocus',
        'blur': '_onBlur',
        'mousedown': '_onMouseDown',
        'contextmenu': '_onContextMenu',
        'dragstart': '_onDragStart',
        'dragend': '_onDragEnd',
        'dragover': '_onDragOver',
        'drop-area-enter': '_onDropAreaEnter',
        'drop-area-leave': '_onDropAreaLeave',
        'drop-area-accept': '_onDropAreaAccept',
        'item-selecting': '_onItemSelecting',
        'item-select': '_onItemSelect',
    },

    properties: {
        connectState: {
            type: String,
            value: 'disconnected',
            notify: true,
            readOnly: true,
        },
    },

    created: function () {
    },

    ready: function () {
        this._shiftStartElement = null;
        this._lastSnapshot = null;
        this._states = {};
        this._sceneID = '';

        this._initFocusable(this);
        this._initDroppable(this);

        this.waitForSceneReady();
    },

    rename: function ( element ) {
        var treeBCR = this.getBoundingClientRect();
        var elBCR = element.getBoundingClientRect();
        var offsetTop = elBCR.top - treeBCR.top - 1;
        var offsetLeft = elBCR.left - treeBCR.left + 10 - 4;
        this.$.nameInput.style.top = (this.$.content.scrollTop + offsetTop) + 'px';
        this.$.nameInput.style.left = offsetLeft + 'px';
        this.$.nameInput.style.width = 'calc(100% - ' + offsetLeft + 'px)';

        this.$.nameInput.hidden = false;
        this.$.nameInput.value = element.name;
        this.$.nameInput.focus();
        this.$.nameInput._renamingEL = element;
        window.requestAnimationFrame( function () {
            this.$.nameInput.select();
        }.bind(this));
    },

    hoverinItemById: function ( id ) {
        var itemEL = this._id2el[id];
        if ( itemEL )
            itemEL.hovering = true;
    },

    hoveroutItemById: function ( id ) {
        var itemEL = this._id2el[id];
        if ( itemEL )
            itemEL.hovering = false;
    },

    waitForSceneReady: function () {
        this._setConnectState('connecting');
        this.$.loader.hidden = false;
    },

    connectScene: function () {
        if ( this._connectState === 'connected' || this._connectState === 'connecting' )
            return;

        this.$.loader.hidden = true;
        this._setConnectState('connected');
        this._queryHierarchyAfter(0);
    },

    disconnectScene: function () {
        if ( this._queryID ) {
            this.cancelAsync(this._queryID);
            this._queryID = null;
        }
        this._setConnectState('disconnected');
    },

    select: function ( itemEL ) {
        Editor.Selection.select( 'node', itemEL._userId, true, true );
    },

    clearSelection: function () {
        Editor.Selection.clear('node');
        this._activeElement = null;
        this._shiftStartElement = null;
    },

    selectPrev: function ( unselectOthers ) {
        if ( this._activeElement ) {
            var prev = this.prevItem(this._activeElement);
            if ( prev ) {
                if (prev !== this._activeElement) {
                    Editor.Selection.select( 'node', prev._userId, unselectOthers, true );
                    this.activeItem(prev);

                    window.requestAnimationFrame( function() {
                        if ( prev.offsetTop <= this.$.content.scrollTop ) {
                            this.$.content.scrollTop = prev.offsetTop - 2; // 1 for padding, 1 for border
                        }
                    }.bind(this));
                }
            }
        }
    },

    selectNext: function ( unselectOthers ) {
        if ( this._activeElement ) {
            var next = this.nextItem(this._activeElement, false);
            if ( next ) {
                if ( next !== this._activeElement ) {
                    Editor.Selection.select( 'node', next._userId, unselectOthers, true );
                    this.activeItem(next);

                    window.requestAnimationFrame( function() {
                        var headerHeight = next.$.header.offsetHeight;
                        var contentHeight = this.offsetHeight - 3; // 2 for border, 1 for padding
                        if ( next.offsetTop + headerHeight >= this.$.content.scrollTop + contentHeight ) {
                            this.$.content.scrollTop = next.offsetTop + headerHeight - contentHeight;
                        }
                    }.bind(this));
                }
            }
        }
    },

    getPath: function(element) {
        if ( !element )
            return '';

        if ( !element instanceof Editor.widgets['hierarchy-item'] ) {
            return '';
        }

        var path = element.name;
        var parentEL = Polymer.dom(element).parentNode;
        while (parentEL instanceof Editor.widgets['hierarchy-item']) {
            path = Path.join(parentEL.name, path);
            parentEL = Polymer.dom(parentEL).parentNode;
        }
        return path;
    },

    getPathByID: function(id) {
        var el = this._id2el[id];
        return this.getPath(el);
    },

    // events

    _onItemSelecting: function ( event ) {
        event.stopPropagation();

        var targetEL = event.target;
        var shiftStartEL = this._shiftStartElement;
        this._shiftStartElement = null;

        if (event.detail.shift) {
            if (shiftStartEL === null) {
                shiftStartEL = this._activeElement;
            }

            this._shiftStartElement = shiftStartEL;

            var el = this._shiftStartElement;
            var userIds = [];

            if (shiftStartEL !== targetEL) {
                if (this._shiftStartElement.offsetTop < targetEL.offsetTop) {
                    while (el !== targetEL) {
                        userIds.push(el._userId);
                        el = this.nextItem(el);
                    }
                } else {
                    while (el !== targetEL) {
                        userIds.push(el._userId);
                        el = this.prevItem(el);
                    }
                }
            }
            userIds.push(targetEL._userId);
            Editor.Selection.select( 'node', userIds, true, false );
        } else if ( event.detail.toggle ) {
            if ( targetEL.selected ) {
                Editor.Selection.unselect('node', targetEL._userId, false);
            } else {
                Editor.Selection.select('node', targetEL._userId, false, false);
            }
        } else {
            // if target already selected, do not unselect others
            if ( !targetEL.selected ) {
                Editor.Selection.select('node', targetEL._userId, true, false);
            }
        }
    },

    _onItemSelect: function ( event ) {
        event.stopPropagation();

        if ( event.detail.shift ) {
            Editor.Selection.confirm();
        } else if ( event.detail.toggle ) {
            Editor.Selection.confirm();
        } else {
            Editor.Selection.select( 'node', event.target._userId, true );
        }
    },

    _onMouseDown: function ( event ) {
        if ( event.which !== 1 )
            return;

        event.stopPropagation();
        this.clearSelection();
    },

    _onContextMenu: function ( event ) {
        event.preventDefault();
        event.stopPropagation();

        var contextEL = Polymer.dom(event).localTarget;
        Editor.Selection.setContext('node',contextEL._userId);

        Editor.sendToCore(
            'hierarchy:popup-context-menu',
            event.clientX,
            event.clientY,
            Editor.requireIpcEvent
        );
    },

    _onScroll: function ( event ) {
        this.$.content.scrollLeft = 0;
    },

    // drag & drop

    _onDragStart: function ( event ) {
        event.stopPropagation();

        var selection = Editor.Selection.curSelection('node');
        EditorUI.DragDrop.start(event.dataTransfer, 'copyMove', 'node', selection.map(function(uuid) {
            var itemEL = this._id2el[uuid];
            return {
                id: uuid,
                name: itemEL.name,
                icon: itemEL.$.icon,
            };
        }.bind(this)));
    },

    _onDragEnd: function ( event ) {
        EditorUI.DragDrop.end();

        Editor.Selection.cancel();
        this._cancelHighligting();
        this._curInsertParentEL = null;
    },

    _onDragOver: function ( event ) {
        var dragType = EditorUI.DragDrop.type(event.dataTransfer);
        if ( dragType !== 'node' && dragType !== 'asset' ) {
            EditorUI.DragDrop.allowDrop( event.dataTransfer, false );
            return;
        }

        //
        event.preventDefault();
        event.stopPropagation();

        //
        if ( event.target ) {
            var position;
            var bcr = this.getBoundingClientRect();
            var offsetY = event.clientY - bcr.top + this.$.content.scrollTop;

            var dragoverEL = Polymer.dom(event).localTarget;
            var insertParentEL = dragoverEL;
            var thisDOM = Polymer.dom(this);

            //
            if ( thisDOM.children.length === 0 ) {
                this._highlightInsert();
            }
            else {
                if ( dragoverEL === this ) {
                    if ( offsetY <= thisDOM.firstElementChild.offsetTop ) {
                        dragoverEL = thisDOM.firstElementChild;
                    }
                    else {
                        dragoverEL = thisDOM.lastElementChild;
                    }
                }

                // highlight insertion
                if ( offsetY <= (dragoverEL.offsetTop + dragoverEL.offsetHeight * 0.3) )
                    position = 'before';
                else if ( offsetY >= (dragoverEL.offsetTop + dragoverEL.offsetHeight * 0.7) )
                    position = 'after';
                else
                    position = 'inside';

                if ( position === 'inside' ) {
                    insertParentEL = dragoverEL;
                } else {
                    insertParentEL = Polymer.dom(dragoverEL).parentNode;
                }

                //
                if ( insertParentEL !== this._curInsertParentEL ) {
                    this._cancelHighligting();
                    this._curInsertParentEL = insertParentEL;

                    this._highlightBorder( insertParentEL );
                }
                this._highlightInsert( dragoverEL, insertParentEL, position );
            }

            //
            EditorUI.DragDrop.allowDrop(event.dataTransfer, true);
        }

        //
        var dropEffect = 'none';
        if ( dragType === 'asset' ) {
            dropEffect = 'copy';
        } else if ( dragType === 'node' ) {
            dropEffect = 'move';
        }
        EditorUI.DragDrop.updateDropEffect(event.dataTransfer, dropEffect);
    },

    _onDropAreaEnter: function ( event ) {
        event.stopPropagation();
    },

    _onDropAreaLeave: function ( event ) {
        event.stopPropagation();

        this._cancelHighligting();
        this._curInsertParentEL = null;
    },

    _onDropAreaAccept: function ( event ) {
        event.stopPropagation();

        Editor.Selection.cancel();
        this._cancelHighligting();
        this._curInsertParentEL = null;

        //
        if ( event.detail.dragItems.length === 0 ) {
            return;
        }

        // get next sibling id
        var hoverEL = event.detail.dropTarget;
        var targetEL = null;
        var nextSiblingId = null;
        var bcr = this.getBoundingClientRect();
        var offsetY = event.detail.clientY - bcr.top + this.$.content.scrollTop;

        var thisDOM = Polymer.dom(this);
        var hoverDOM = Polymer.dom(hoverEL);

        if ( hoverEL === this ) {
            targetEL = null;
            if ( thisDOM.firstElementChild ) {
                if ( offsetY <= thisDOM.firstElementChild.offsetTop ) {
                    nextSiblingId = thisDOM.firstElementChild._userId;
                }
            }
        }
        else {
            if ( offsetY <= (hoverEL.offsetTop + hoverEL.offsetHeight * 0.3) ) {
                nextSiblingId = hoverEL._userId;
                targetEL = hoverDOM.parentNode;
            }
            else if ( offsetY >= (hoverEL.offsetTop + hoverEL.offsetHeight * 0.7) ) {
                if ( hoverDOM.nextElementSibling ) {
                    nextSiblingId = hoverDOM.nextElementSibling._userId;
                }
                else {
                    nextSiblingId = null;
                }
                targetEL = hoverDOM.parentNode;
            }
            else {
                nextSiblingId = null;
                targetEL = hoverEL;
                if ( hoverDOM.firstElementChild ) {
                    nextSiblingId = hoverDOM.firstElementChild._userId;
                }
            }
        }

        // if target is root, set it to null
        if ( targetEL === this ) {
            targetEL = null;
        }

        // expand the parent
        if ( targetEL ) {
            targetEL.folded = false;
        }

        // process drop
        if ( event.detail.dragType === 'node' ) {
            this._sortDraggingItems(event.detail.dragItems);
            Editor.sendToPanel('scene.panel',
                               'scene:move-nodes',
                               event.detail.dragItems,
                               targetEL ? targetEL._userId : null,
                               nextSiblingId
                              );
        }
        else if ( event.detail.dragType === 'asset' ) {
            Editor.sendToPanel('scene.panel',
                               'scene:create-nodes-by-uuids',
                               event.detail.dragItems,
                               targetEL ? targetEL._userId : null
                              );
        }
    },

    // rename events

    _onRenameMouseDown: function ( event ) {
        event.stopPropagation();
    },

    _onRenameKeyDown: function ( event ) {
        event.stopPropagation();
    },

    _onRenameValueChanged: function ( event ) {
        var targetEL = this.$.nameInput._renamingEL;
        if ( targetEL ) {
            Editor.sendToPanel('scene.panel', 'scene:node-set-property', {
                id: targetEL._userId,
                path: 'name',
                type: 'String',
                value: this.$.nameInput.value,
                isMixin: false,
            });

            this.$.nameInput._renamingEL = null;
            this.$.nameInput.hidden = true;
        }
    },

    _onRenameFocusChanged: function ( event ) {
        if ( !this.$.nameInput._renamingEL ) {
            return;
        }

        if ( !event.detail.value ) {
            this.$.nameInput._renamingEL = null;
            this.$.nameInput.hidden = true;
        }
    },

    // private methods

    _rebuild: function (nodes) {
        // clear all parents
        for ( var id in this._id2el ) {
            var itemEL = this._id2el[id];
            var parentEL = Polymer.dom(itemEL).parentNode;
            Polymer.dom(parentEL).removeChild(itemEL);
        }
        var id2el = this._id2el;
        this._id2el = {};

        // start building it
        try {
            this._build( nodes, id2el );
            id2el = null;
        }
        catch (err) {
            Editor.error( 'Failed to build hierarchy tree: %s', err.stack);
            this.disconnectScene();
        }
    },

    _hintNew: function ( el ) {
        requestAnimationFrame( function () {
            el.hint( 'green', 500 );
        });
    },

    _hintRename: function ( el ) {
        requestAnimationFrame( function () {
            el.hint( 'orange', 500 );
        });
    },

    _applyCmds: function (cmds) {
        var id2el = this._id2el;
        var el, node, beforeNode, newParent, newEL;

        for (var i = 0; i < cmds.length; i++) {
            var cmd = cmds[i];
            switch (cmd.op) {

                case 'append':
                    node = cmd.node;
                    newEL = this._newEntryRecursively(node, id2el);
                    newParent = cmd.parentId !== null ? id2el[cmd.parentId] : this;
                    newParent.folded = false;
                    this.addItem( newParent, newEL, {
                        id: node.id,
                        name: node.name,
                        canHaveChildren: node.canHaveChildren !== false,
                    } );
                    this._hintNew( newEL );
                    break;

                case 'remove':
                    this.removeItemById(cmd.id);
                    break;

                //case 'replace':
                //    el = id2el[cmd.id];
                //    node = cmd.node;
                //    var isLeaf = Polymer.dom(el).childNodes === 0 && !node.children;
                //    if (isLeaf) {
                //        el.name = node.name;
                //
                //        delete id2el[cmd.id];
                //        el._userId = node.id;
                //        id2el[node.id] = el;
                //    }
                //    else {
                //        newParent = Polymer.dom(el).parentNode;
                //        this.removeItem(el);
                //        newEL = this._newEntryRecursively(node, id2el);
                //        this.addItem( newParent, newEL, {
                //            id: node.id,
                //            name: node.name
                //            canHaveChildren: node.canHaveChildren !== false,
                //        });
                //    }
                //    break;

                case 'rename':
                    this.renameItemById(cmd.id, cmd.name);
                    this._hintRename( this._id2el[cmd.id] );
                    break;

                case 'move':
                    el = id2el[cmd.id];
                    newParent = cmd.parentId !== null ? id2el[cmd.parentId] : this;
                    var siblings;
                    if (newParent !== Polymer.dom(el).parentNode) {
                        this.setItemParent(el, newParent);
                        siblings = Polymer.dom(newParent).childNodes;
                    }
                    else {
                        siblings = Polymer.dom(newParent).childNodes;
                        if (siblings.indexOf(el) < cmd.index) {
                            cmd.index += 1;     // before next one
                        }
                        if (cmd.index > siblings.length - 1) {
                            Polymer.dom(newParent).appendChild(el);
                            break;
                        }
                    }
                    beforeNode = siblings[cmd.index];
                    if (beforeNode && beforeNode !== el) {
                        Polymer.dom(newParent).insertBefore(el, beforeNode);
                    }
                    break;

                case 'insert':
                    node = cmd.node;
                    newEL = this._newEntryRecursively(node, id2el);
                    newParent = cmd.parentId !== null ? id2el[cmd.parentId] : this;
                    newParent.folded = false;
                    this.addItem( newParent, newEL, {
                        id: node.id,
                        name: node.name,
                        canHaveChildren: node.canHaveChildren !== false,
                    } );
                    this._hintNew( newEL );
                    beforeNode = Polymer.dom(newParent).childNodes[cmd.index];
                    if (beforeNode && beforeNode !== newEL) {
                        Polymer.dom(newParent).insertBefore(newEL, beforeNode);
                    }
                    break;

                default:
                    Editor.error('Unsupported operation', cmd.op);
                    break;
            }
        }
    },

    _storeItemStatesRecursively ( results, idPath, el ) {
    },

    _storeItemStates: function ( sceneID ) {
        this._states[sceneID] = this.dumpItemStates();
    },

    _restoreItemStates: function ( sceneID ) {
        // restore items states
        this.restoreItemStates(this._states[sceneID]);

        // restore selection
        this._syncSelection();
    },

    _queryHierarchyAfter: function ( timeout ) {
        if ( this._queryID ) {
            this.cancelAsync(this._queryID);
            this._queryID = null;
        }

        var id = this.async( function () {
            Editor.sendToPanel('scene.panel', 'scene:query-hierarchy', id );
        }, timeout );
        this._queryID = id;
    },

    _updateSceneGraph: function ( queryID, sceneID, nodes ) {
        if ( this._queryID !== queryID ) {
            return;
        }

        if ( !sceneID )
            sceneID = 'empty';

        var diffResult = treeDiff(this._lastSnapshot, nodes);
        if ( !diffResult.equal ) {
            // store item states
            if ( this._sceneID ) {
                this._storeItemStates(this._sceneID);
            }

            // apply changes
            if (diffResult.cmds.length > 100) {
                this._rebuild(nodes);
                console.log('rebuild');
            }
            else {
                this._applyCmds( diffResult.cmds );
            }
            this._lastSnapshot = nodes;

            // restore item states
            this._restoreItemStates(sceneID);
        }

        this._sceneID = sceneID;
        this._queryHierarchyAfter(100);
    },

    _build: function ( data, id2el ) {
        // console.time('hierarchy-tree._build()');
        data.forEach( function ( entry ) {
            var newEL = this._newEntryRecursively(entry, id2el);
            this.addItem( this, newEL, {
                id: entry.id,
                name: entry.name,
                canHaveChildren: entry.canHaveChildren !== false,
            } );

            newEL.folded = false;
        }.bind(this));
        // console.timeEnd('hierarchy-tree._build()');

        // sync the selection
        this._syncSelection();
    },

    _newEntryRecursively: function ( entry, id2el ) {
        var el = id2el[entry.id];
        if ( !el ) {
            var ctor = Editor.widgets['hierarchy-item'];
            el = new ctor();
        }

        if ( entry.children ) {
            entry.children.forEach( function ( childEntry ) {
                var childEL = this._newEntryRecursively(childEntry, id2el);
                this.addItem( el, childEL, {
                    id: childEntry.id,
                    name: childEntry.name,
                    canHaveChildren: childEntry.canHaveChildren !== false,
                } );
                // childEL.folded = false;
            }.bind(this) );
        }

        return el;
    },

    // highlighting

    _highlightBorder: function ( itemEL ) {
        if ( itemEL && itemEL instanceof Editor.widgets['hierarchy-item'] ) {
            var style = this.$.highlightBorder.style;
            style.display = 'block';
            style.left = (itemEL.offsetLeft-2) + 'px';
            style.top = (itemEL.offsetTop-1) + 'px';
            style.width = (itemEL.offsetWidth+4) + 'px';
            style.height = (itemEL.offsetHeight+3) + 'px';

            if ( !itemEL.canHaveChildren ) {
                itemEL.invalid = true;
                this.$.highlightBorder.setAttribute('invalid', '');
            }

            itemEL.highlighted = true;
        }
        else {
            this.$.highlightBorder.style.display = 'none';
        }
    },

    _highlightInsert: function ( itemEL, parentEL, position ) {
        var style = this.$.insertLine.style;

        // insert at root
        if ( !itemEL ) {
            style.display = 'block';
            style.left = (this.offsetLeft-2) + 'px';
            style.width = (this.offsetWidth+4) + 'px';
            style.top = '0px';
            style.height = '0px';

            return;
        }

        //
        if ( position === 'inside' ) {
            var itemDOM = Polymer.dom(itemEL);
            if ( !itemEL.folded && itemDOM.firstElementChild ) {
                style.display = 'block';
                style.top = itemDOM.firstElementChild.offsetTop + 'px';
                style.left = itemDOM.firstElementChild.offsetLeft + 'px';
                style.width = itemDOM.firstElementChild.offsetWidth + 'px';
                style.height = '0px';
            }
            else {
                style.display = 'none';
            }
        }
        else {
            style.display = 'block';

            style.left = itemEL.offsetLeft + 'px';
            if ( position === 'before' )
                style.top = itemEL.offsetTop + 'px';
            else if ( position === 'after'  )
                style.top = (itemEL.offsetTop + itemEL.offsetHeight) + 'px';

            style.width = itemEL.offsetWidth + 'px';
            style.height = '0px';
        }
    },

    _cancelHighligting: function () {
        this.$.highlightBorder.style.display = 'none';
        this.$.highlightBorder.removeAttribute('invalid');

        this.$.insertLine.style.display = 'none';

        if (this._curInsertParentEL) {
            this._curInsertParentEL.invalid = false;
            this._curInsertParentEL.highlighted = false;
        }
    },

    //

    _sortDraggingItems: function (ids) {
        //console.log('before', ids);
        var id2el = this._id2el;
        ids.sort(function (lhs, rhs) {
            var itemA = id2el[lhs];
            var itemB = id2el[rhs];
            var itemADOM = Polymer.dom(itemA);
            var itemBDOM = Polymer.dom(itemB);
            var itemAParentDOM = Polymer.dom(itemADOM.parentNode);
            var itemBParentDOM = Polymer.dom(itemBDOM.parentNode);
            var indexA, indexB;
            if (itemAParentDOM === itemBParentDOM) {
                var siblings = itemAParentDOM.childNodes;
                indexA = Array.prototype.indexOf.call(siblings, itemA);
                indexB = Array.prototype.indexOf.call(siblings, itemB);
                return indexB - indexA;
            }
            else {

            }
        });
        //console.log('after', ids);
    },

    _syncSelection: function () {
        var ids = Editor.Selection.curSelection('node');
        ids.forEach( function ( id ) {
            this.selectItemById(id);
        }.bind(this));
        this.activeItemById(Editor.Selection.curActivate('node'));
    },
});

})();
