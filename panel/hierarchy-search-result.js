Polymer({
    is: 'hierarchy-search-result',

    behaviors: [EditorUI.focusable, EditorUI.droppable, EditorUI.idtree],

    hostAttributes: {
        'droppable': 'asset,node',
    },

    listeners: {
        'item-selecting': '_onItemSelecting',
        'item-select': '_onItemSelect',
    },

    properties: {
        hierarchyTree: {
            type: Object,
            value: function() {
                return null;
            }
        }
    },

    ready: function() {
        this._shiftStartElement = null;

        this._initFocusable(this);
        this._initDroppable(this);
    },

    filter: function(filterText) {
        if (!filterText) {
            return;
        }
        var items = [];
        for (var item in this.hierarchyTree._id2el) {
            items.push(this.hierarchyTree._id2el[item]);
        }
        this.clear();
        items.forEach(function(info) {
            var text = filterText.toLowerCase();
            if (info.name.toLowerCase().indexOf(text) > -1) {
                var ctor = Editor.widgets['hierarchy-item'];
                var newEl = new ctor();

                this.addItem(this, newEl, {
                    id: info.id,
                    name: info.name,
                });
            }
        }.bind(this));
    },

    _onItemSelecting: function(event) {
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
            Editor.Selection.select('node', userIds, true, false);
        } else if (event.detail.toggle) {
            if (targetEL.selected) {
                Editor.Selection.unselect('node', targetEL._userId, false);
            } else {
                Editor.Selection.select('node', targetEL._userId, false, false);
            }
        } else {
            // if target already selected, do not unselect others
            if (!targetEL.selected) {
                Editor.Selection.select('node', targetEL._userId, true, false);
            }
        }
    },

    _onItemSelect: function(event) {
        event.stopPropagation();

        if (event.detail.shift) {
            Editor.Selection.confirm();
        } else if (event.detail.toggle) {
            Editor.Selection.confirm();
        } else {
            Editor.Selection.select('node', event.target._userId, true);
        }
    },
});
