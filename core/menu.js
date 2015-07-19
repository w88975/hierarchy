var Shell = require('shell');

function getContextTemplate () {
    return [
        {
            label: 'Create',
            submenu: getCreateTemplate(true)
        },

        {
            // ---------------------------------------------
            type: 'separator'
        },

        {
            label: 'Rename',
            click: function() {
                var contexts = Editor.Selection.contexts('node');
                if ( contexts.length > 0 ) {
                    Editor.sendToPanel('hierarchy.panel', 'hierarchy:rename', contexts[0]);
                }
            },
        },

        {
            label: 'Delete',
            click: function() {
                var contexts = Editor.Selection.contexts('node');
                if ( contexts.length > 0 ) {
                    Editor.sendToPanel('hierarchy.panel', 'hierarchy:delete', contexts);
                }
            },
        },

        {
            // ---------------------------------------------
            type: 'separator'
        },

        {
            label: 'Show Path',
            visible: Editor.isDev,
            click: function() {
                var contexts = Editor.Selection.contexts('node');
                if ( contexts.length > 0 ) {
                    Editor.sendToPanel('hierarchy.panel', 'hierarchy:show-path', contexts[0]);
                }
            }
        },
    ];
}

function getCreateTemplate ( isContextMenu ) {
    var menuTmpl = Editor.menus['create-node'];
    if ( !menuTmpl ) {
        return [
            { label: '(None)', enabled: false },
        ];
    }

    var position = isContextMenu ? 'child' : 'sibling';
    var referenceID;
    if ( isContextMenu ) {
        var contexts = Editor.Selection.contexts('node');
        if ( contexts.length > 0 ) {
            referenceID = contexts[0];
        }
    } else {
        referenceID = Editor.Selection.curActivate('node');
    }

    // NOTE: this will prevent menu item pollution
    menuTmpl = JSON.parse(JSON.stringify(menuTmpl));
    menuTmpl = menuTmpl.map ( function ( item ) {
        if ( item.params ) {
            item.params.push(referenceID);
            item.params.push(position);
        }
        return item;
    });

    return menuTmpl;
}

module.exports = {
    getContextTemplate: getContextTemplate,
    getCreateTemplate: getCreateTemplate,
};
