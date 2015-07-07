(function () {

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
        this._initFocusable(this);
        this._initDroppable(this);

        this.waitForSceneReady();
    },

    rename: function ( element ) {
        var treeBCR = this.getBoundingClientRect();
        var elBCR = element.getBoundingClientRect();
        var offsetTop = elBCR.top - treeBCR.top - 1;
        this.$.nameInput.style.top = (this.$.content.scrollTop + offsetTop) + 'px';

        this.$.nameInput.hidden = false;
        this.$.nameInput._renamingEL = element;
        this.$.nameInput.value = element.name;
        this.$.nameInput.focus();
        window.requestAnimationFrame( function () {
            this.$.nameInput.select();
        }.bind(this));
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

            var targetEL = Polymer.dom(event).localTarget;
            var thisDOM = Polymer.dom(this);

            //
            if ( thisDOM.children.length > 0 ) {
                if ( targetEL !== this._curDragoverEL ) {
                    if ( targetEL === this ) {
                        if ( offsetY <= thisDOM.firstElementChild.offsetTop ) {
                            targetEL = thisDOM.firstElementChild;
                        }
                        else {
                            targetEL = thisDOM.lastElementChild;
                        }
                    }
                    this._curDragoverEL = targetEL;
                }

                // highlight insertion
                if ( offsetY <= (targetEL.offsetTop + targetEL.offsetHeight * 0.3) )
                    position = 'before';
                else if ( offsetY >= (targetEL.offsetTop + targetEL.offsetHeight * 0.7) )
                    position = 'after';
                else
                    position = 'inside';

                if ( position === 'inside' ) {
                    this._highlightBorder( targetEL );
                }
                else {
                    this._highlightBorder( Polymer.dom(targetEL).parentNode );
                }
                this._highlightInsert( targetEL, position );
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
    },

    _onDropAreaAccept: function ( event ) {
        event.stopPropagation();

        this._cancelHighligting();
        Editor.Selection.cancel();

        //
        if ( event.detail.dragItems.length > 0 ) {
            // get next sibliing id
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
                Editor.sendToPanel('scene.panel',
                                   'scene:move-nodes',
                                   event.detail.dragItems,
                                   targetEL ? targetEL._userId : null,
                                   nextSiblingId
                                  );
            }
            else if ( event.detail.dragType === 'asset' ) {
                Editor.sendToPanel('scene.panel',
                                   'scene:create-assets',
                                   event.detail.dragItems,
                                   targetEL ? targetEL._userId : null
                                  );
            }
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
                    this.addItem( newParent, newEL, node.name, node.id );
                    break;

                case 'remove':
                    this.removeItemById(cmd.id);
                    break;

                case 'replace':
                    el = id2el[cmd.id];
                    node = cmd.node;
                    var isLeaf = Polymer.dom(el).childNodes === 0 && !node.children;
                    if (isLeaf) {
                        el.name = node.name;

                        delete id2el[cmd.id];
                        el._userId = node.id;
                        id2el[node.id] = el;
                    }
                    else {
                        newParent = Polymer.dom(el).parentNode;
                        this.removeItem(el);
                        newEL = this._newEntryRecursively(node, id2el);
                        this.addItem( newParent, newEL, node.name, node.id );
                    }
                    break;

                case 'rename':
                    this.renameItemById(cmd.id, cmd.name);
                    break;

                case 'move':
                    el = id2el[cmd.id];
                    newParent = cmd.parentId !== null ? id2el[cmd.parentId] : this;
                    if (newParent !== Polymer.dom(el).parentNode) {
                        this.setItemParent(el, newParent);
                    }
                    beforeNode = Polymer.dom(newParent).childNodes[cmd.index];
                    Polymer.dom(newParent).insertBefore(el, beforeNode);
                    break;

                case 'insert':
                    node = cmd.node;
                    newEL = this._newEntryRecursively(node, id2el);
                    newParent = cmd.parentId !== null ? id2el[cmd.parentId] : this;
                    this.addItem( newParent, newEL, node.name, node.id );
                    beforeNode = Polymer.dom(newParent).childNodes[cmd.index];
                    Polymer.dom(newParent).insertBefore(newEL, beforeNode);
                    break;

                default:
                    Editor.error('Unsupported operation', cmd.op);
                    break;
            }
        }
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

    _updateSceneGraph: function ( queryID, nodes ) {
        if ( this._queryID !== queryID ) {
            return;
        }

        var diffResult = treeDiff(this._lastSnapshot, nodes);
        if (! diffResult.equal) {
            if (true || diffResult.cmds.length > 100) {
                this._rebuild(nodes);
            }
            else {
                this._applyCmds(diffResult.cmds);
            }
            this._lastSnapshot = nodes;
        }

        this._queryHierarchyAfter(100);
    },

    _build: function ( data, id2el ) {
        // console.time('hierarchy-tree._build()');
        data.forEach( function ( entry ) {
            var newEL = this._newEntryRecursively(entry, id2el);
            this.addItem( this, newEL, entry.name, entry.id );

            newEL.folded = false;
        }.bind(this));
        // console.timeEnd('hierarchy-tree._build()');

        // DISABLE: I should find a place restore it, not here.
        // // sync the selection
        // var selection = Editor.Selection.curSelection('node');
        // selection.forEach(function ( id ) {
        //     this.selectItemById(id);
        // }.bind(this));
        // this.activeItemById(Editor.Selection.curActivate('node'));
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
                this.addItem( el, childEL, childEntry.name, childEntry.id );
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
        }
        else {
            this.$.highlightBorder.style.display = 'none';
        }
    },

    _highlightInsert: function ( itemEL, position ) {
        if ( itemEL ) {
            var style = this.$.insertLine.style;

            if ( position === 'inside' ) {
                var itemDOM = Polymer.dom(itemEL);
                if ( !itemEL.folded && itemDOM.firstElementChild ) {
                    style.display = 'block';
                    style.top = (itemDOM.firstElementChild.offsetTop-1) + 'px';
                    style.left = (itemDOM.firstElementChild.offsetLeft-2) + 'px';
                    style.width = (itemDOM.firstElementChild.offsetWidth+4) + 'px';
                    style.height = '0px';
                }
                else {
                    style.display = 'none';
                }
            }
            else {
                style.display = 'block';

                style.left = (itemEL.offsetLeft-2) + 'px';
                style.width = (itemEL.offsetWidth+4) + 'px';

                if ( position === 'before' )
                    style.top = itemEL.offsetTop + 'px';
                else if ( position === 'after'  )
                    style.top = (itemEL.offsetTop + itemEL.offsetHeight) + 'px';
                style.height = '0px';
            }
        }
    },

    _cancelHighligting: function () {
        this._curDragoverEL = null;
        this.$.highlightBorder.style.display = 'none';
        this.$.insertLine.style.display = 'none';
    },
});

})();
