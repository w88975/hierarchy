(function () {
Editor.registerPanel( 'hierarchy.panel', {
    is: 'editor-hierarchy',

    properties: {
    },

    ready: function () {
        this.connectState = 'connecting';
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

    'scene:ready': function () {
        this.$.tree.connectScene();
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
});

})();
