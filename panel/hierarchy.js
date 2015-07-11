(function () {

var BuildMenu = Editor.require('packages://hierarchy/utils/build-menu');

Editor.registerPanel( 'hierarchy.panel', {
    is: 'editor-hierarchy',

    properties: {
    },

    ready: function () {
        this.connectState = 'connecting';
        this.createMenu = null;
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
        Editor.Selection.clear('node');
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

    'scene:ready': function (menuPaths) {
        this.$.tree.connectScene();
        this.createMenu = BuildMenu(menuPaths);
    },

    'scene:reloading': function () {
        this.$.tree.waitForSceneReady();
    },

    'scene:reply-query-hierarchy': function ( queryID, nodes ) {
        this.$.tree._updateSceneGraph(queryID, nodes);
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
        var rect = this.$.create.getBoundingClientRect();
        Editor.Menu.popup( rect.left + 5, rect.bottom + 5, this.createMenu || [
            { label: '(None)', enabled: false },
        ]);
    }
});

})();
