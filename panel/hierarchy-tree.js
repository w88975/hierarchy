(function () {

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
    },

    created: function () {
    },

    ready: function () {
        this._shiftStartElement = null;
        this._initFocusable(this);

        this.waitForSceneReady();
    },

    waitForSceneReady: function () {
        this.$.loader.hidden = false;
    },

    connectScene: function () {
        this.$.loader.hidden = true;
        Editor.sendToPanel('scene.panel', 'scene:subscript-hierarchy-snapshot', 100 );
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

    _newEntryRecursively: function ( entry ) {
        var ctor = Editor.widgets['hierarchy-item'];
        var el = new ctor();

        if ( entry.children ) {
            entry.children.forEach( function ( childEntry ) {
                var childEL = this._newEntryRecursively(childEntry);
                this.addItem( el, childEL, childEntry.name, childEntry.id );
                // childEL.folded = false;
            }.bind(this) );
        }

        return el;
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

    _updateSceneGraph: function ( nodes ) {
        // TODO
    },
});

})();
