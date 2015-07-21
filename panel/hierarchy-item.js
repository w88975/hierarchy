(function () {

Editor.registerWidget( 'hierarchy-item', {
    is: 'hierarchy-item',

    hostAttributes: {
        draggable: 'true',
    },

    properties: {
        // basic

        foldable: {
            type: Boolean,
            value: false,
            notify: true,
            reflectToAttribute: true,
        },

        folded: {
            type: Boolean,
            value: false,
            notify: true,
            reflectToAttribute: true,
        },

        selected: {
            type: Boolean,
            value: false,
            notify: true,
            reflectToAttribute: true,
        },

        name: {
            type: String,
            value: '',
        },

        // advance

        type: {
            type: String,
            value: '',
        },

        hovering: {
            type: Boolean,
            value: false,
            reflectToAttribute: true
        },

        highlighted: {
            type: Boolean,
            value: false,
            reflectToAttribute: true
        },

        invalid: {
            type: Boolean,
            value: false,
            reflectToAttribute: true
        },
    },

    listeners: {
        'mousedown': '_onMouseDown',
        'click': '_onClick',
        'dblclick': '_onDblClick',
    },

    ready: function () {
        this._renaming = false;
        this._userId = '';
    },

    //

    _nameClass: function ( name ) {
        if ( !name )
            return 'no-name';
        return 'name';
    },

    _nameText: function ( name ) {
        if ( !name )
            return 'No Name';
        return name;
    },

    _foldIconClass: function ( folded ) {
        if ( folded )
            return 'fa fa-caret-right';

        return 'fa fa-caret-down';
    },

    // events

    _onMouseDown: function ( event ) {
        if ( event.which !== 1 )
            return;

        event.stopPropagation();

        if ( this._renaming ) {
            return;
        }

        var shift = false;
        var toggle = false;

        if ( event.shiftKey ) {
            shift = true;
        } else if ( event.metaKey || event.ctrlKey ) {
            toggle = true;
        }

        this.fire('item-selecting', {
            toggle: toggle,
            shift: shift,
        });

    },

    _onClick: function ( event ) {
        if ( event.which !== 1 )
            return;

        event.stopPropagation();

        var shift = false;
        var toggle = false;

        if ( event.shiftKey ) {
            shift = true;
        } else if ( event.metaKey || event.ctrlKey ) {
            toggle = true;
        }

        this.fire('item-select', {
            toggle: toggle,
            shift: shift,
        });
    },

    _onDblClick: function ( event ) {
        if ( event.which !== 1 )
            return;

        if ( event.shiftKey || event.metaKey || event.ctrlKey ) {
            return;
        }

        event.stopPropagation();

        console.log('edit asset %s', this.name);
        // this.fire('open');
    },

    _onFoldMouseDown: function ( event ) {
        event.stopPropagation();
    },

    _onFoldClick: function ( event ) {
        event.stopPropagation();

        if ( event.which !== 1 )
            return;

        this.folded = !this.folded;
    },

    _onFoldDblClick: function ( event ) {
        event.stopPropagation();
    },

    _onMouseEnter: function ( event ) {
        event.stopPropagation();

        Editor.Selection.hover( 'node', this._userId );
    },

    _onMouseLeave: function ( event ) {
        event.stopPropagation();

        Editor.Selection.hover( 'node', null);
    },

    hint: function ( color, duration ) {
        color = color || 'white';
        duration = duration || 1000;

        var computedStyle = window.getComputedStyle(this.$.bar);
        this.$.bar.animate([
            { background: color, transform: 'scale(1.2)' },
            { background: computedStyle.backgroundColor, transform: 'scale(1)' }
        ], {
            duration: duration
        });
    },
});

})();
