(function () {

Editor.registerPanel( 'hierarchy.panel', {
    is: 'editor-hierarchy',

    properties: {
        filterText: {
            type: String,
            value: '',
            observer: '_onFilterTextChanged'
        }
    },

    ready: function () {
        this.connectState = 'connecting';
        Editor.sendToWindows( 'scene:is-ready', 'hierarchy.panel' );
        this.$.searchResult.hierarchyTree = this.$.tree;
    },

    focusOnSearch: function ( event ) {
        if ( event ) {
            event.stopPropagation();
        }

        this.$.search.setFocus();
    },

    selectPrev: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        this.$.tree.selectPrev(true);
    },

    selectNext: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        this.$.tree.selectNext(true);
    },

    renameCurrentSelected: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        if ( this.$.tree._activeElement ) {
            this.$.tree.rename(this.$.tree._activeElement);
        }
    },

    deleteCurrentSelected: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        var ids = Editor.Selection.curSelection('node');
        Editor.sendToPanel( 'scene.panel', 'scene:delete-nodes', ids);
    },

    // TODO: make it better
    shiftSelectPrev: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        this.$.tree.selectPrev(false);
    },

    // TODO: make it better
    shiftSelectNext: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        this.$.tree.selectNext(false);
    },

    foldCurrent: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        var activeEL = this.$.tree._activeElement;
        if ( activeEL ) {
            if ( activeEL.foldable && !activeEL.folded ) {
                activeEL.folded = true;
            }
        }
    },

    foldupCurrent: function ( event ) {
        if ( event ) {
            event.stopPropagation();
            event.preventDefault();
        }

        var activeEL = this.$.tree._activeElement;
        if ( activeEL ) {
            if ( activeEL.foldable && activeEL.folded ) {
                activeEL.folded = false;
            }
        }
    },

    'selection:selected': function ( type, ids ) {
        if ( type !== 'node' )
            return;

        ids.forEach( function ( id ) {
            this.$.tree.selectItemById(id);
            this.$.tree.expand(id, true);
        }.bind(this));
    },

    'selection:unselected': function ( type, ids ) {
        if ( type !== 'node' )
            return;

        ids.forEach( function ( id ) {
            this.$.tree.unselectItemById(id);
        }.bind(this));
    },

    'selection:activated': function ( type, id ) {
        if ( type !== 'node' )
            return;

        this.$.tree.activeItemById(id);
    },

    'selection:deactivated': function ( type, id ) {
        if ( type !== 'node' )
            return;

        this.$.tree.deactiveItemById(id);
    },

    'selection:hoverin': function ( type, id ) {
        if ( type !== 'node' )
            return;

        this.$.tree.hoverinItemById(id);
    },

    'selection:hoverout': function ( type, id ) {
        if ( type !== 'node' )
            return;

        this.$.tree.hoveroutItemById(id);
    },

    'scene:ready': function () {
        this.$.tree.connectScene();
    },

    'scene:reloading': function () {
        this.$.tree.waitForSceneReady();
    },

    'scene:reply-query-hierarchy': function ( queryID, sceneID, nodes ) {
        this.$.tree._updateSceneGraph(queryID, sceneID, nodes);
    },

    'hierarchy:rename': function ( id ) {
        var el = this.$.tree._id2el[id];
        if ( el ) {
            this.$.tree.rename(el);
        }
    },

    'hierarchy:delete': function ( ids ) {
        Editor.Selection.unselect('node', ids, true);
        Editor.sendToPanel( 'scene.panel', 'scene:delete-nodes', ids);
    },

    'hierarchy:show-path': function ( id ) {
        Editor.info( 'Path: %s, ID: %s', id, this.$.tree.getPathByID(id) );
    },

    _connectState: function ( connectState ) {
        switch (connectState) {
            case 'connecting': return 'fa fa-link connecting';
            case 'connected': return 'fa fa-link';
            case 'disconnected': return 'fa fa-unlink';
        }
        return 'fa fa-unlink';
    },

    _onStateClick: function ( event ) {
        event.stopPropagation();
        this.$.tree.connectScene();
    },

    _onCreateClick: function ( event ) {
        var rect = this.$.createBtn.getBoundingClientRect();
        Editor.sendToCore('hierarchy:popup-create-menu', rect.left, rect.bottom + 5, Editor.requireIpcEvent);
    },

    _onFilterTextChanged: function () {
        this.$.searchResult.filter(this.filterText);
        if (this.filterText) {
            this.$.searchResult.hidden = false;
            this.$.tree.hidden = true;
            return;
        }

        this.$.searchResult.hidden = true;
        this.$.searchResult.clear();
        this.$.tree.hidden = false;
    },
});

})();
