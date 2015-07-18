var BrowserWindow = require('browser-window');

module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'hierarchy:open': function () {
        Editor.Panel.open('hierarchy.panel');
    },

    'hierarchy:popup-create-menu': function (event, x, y) {
        var template;
        var menuTmpl = Editor.menus['create-node'];

        if ( !menuTmpl ) {
            menuTmpl = [
                { label: '(None)', enabled: false },
            ];
        }
        else {
            // NOTE: this will prevent menu item pollution
            menuTmpl = JSON.parse(JSON.stringify(menuTmpl));
        }

        var editorMenu = new Editor.Menu(menuTmpl, event.sender);
        x = Math.floor(x);
        y = Math.floor(y);
        editorMenu.nativeMenu.popup(BrowserWindow.fromWebContents(event.sender), x, y);
        editorMenu.dispose();
    },
};
