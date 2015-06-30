(function () {

var treeDiff = Editor.require('app://builtin/hierarchy/utils/tree-diff');

Polymer({
    is: 'hierarchy-tree',

    behaviors: [EditorUI.focusable, EditorUI.idtree],

    listeners: {
        'focus': '_onFocus',
        'blur': '_onBlur',
        'selecting': '_onSelecting',
        'select': '_onSelect',
        'mousedown': '_onMouseDown',
        'scroll': '_onScroll',
        'dragstart': '_onDragStart',
        'dragend': '_onDragEnd',
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

        this.waitForSceneReady();
    },

    waitForSceneReady: function () {
        this._setConnectState('connecting');
        this.$.loader.hidden = false;
    },

    connectScene: function () {
        this.$.loader.hidden = true;
        this._setConnectState('connected');
        Editor.sendToPanel('scene.panel', 'scene:query-hierarchy' );
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
                        if ( prev.offsetTop <= this.scrollTop ) {
                            this.scrollTop = prev.offsetTop - 2; // 1 for padding, 1 for border
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
                        if ( next.offsetTop + headerHeight >= this.scrollTop + contentHeight ) {
                            this.scrollTop = next.offsetTop + headerHeight - contentHeight;
                        }
                    }.bind(this));
                }
            }
        }
    },

    // events

    _onSelecting: function ( event ) {
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

    _onSelect: function ( event ) {
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
        this.scrollLeft = 0;
    },

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
    },

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
        var el, node, newParent, newEL;

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
                    el.name = node.name;

                    delete id2el[cmd.id];
                    el._userId = node.id;
                    id2el[node.id] = el;
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
                    var beforeNode = Polymer.dom(newParent).childNodes[cmd.index];
                    Polymer.dom(newParent).insertBefore(el, beforeNode);
                    break;

                case 'insert':
                    node = cmd.node;
                    newEL = this._newEntryRecursively(node, id2el);
                    newParent = cmd.parentId !== null ? id2el[cmd.parentId] : this;
                    this.addItem( newParent, newEL, node.name, node.id );
                    var beforeNode = Polymer.dom(newParent).childNodes[cmd.index];
                    Polymer.dom(newParent).insertBefore(newEL, beforeNode);
                    break;

                default:
                    Editor.error('Unsupported operation', cmd.op);
                    break;
            }
        }
    },

    _updateSceneGraph: function ( nodes ) {
        var diffResult = treeDiff(this._lastSnapshot, nodes);
        if (! diffResult.equal) {
            if (diffResult.cmds.length > 100) {
                this._rebuild(nodes);
            }
            else {
                this._applyCmds(diffResult.cmds);
            }
            this._lastSnapshot = nodes;
        }

        if ( this._queryID ) {
            this.cancelAsync(this._queryID);
            this._queryID = null;
        }
        this._queryID = this.async( function () {
            this._queryID = null;
            Editor.sendToPanel('scene.panel', 'scene:query-hierarchy' );
        }, 100 );
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
});

})();
