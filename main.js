var BrowserWindow = require('browser-window');
var Menu = require('./core/menu');

module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'hierarchy:open': function () {
        Editor.Panel.open('hierarchy.panel');
    },

    'hierarchy:popup-create-menu': function (event, x, y) {
        var template = Menu.getCreateTemplate();
        var editorMenu = new Editor.Menu(template, event.sender);
        // TODO: editorMenu.add( '', Editor.menus['create-asset'] );

        x = Math.floor(x);
        y = Math.floor(y);
        editorMenu.nativeMenu.popup(BrowserWindow.fromWebContents(event.sender), x, y);
        editorMenu.dispose();
    },

    'hierarchy:popup-context-menu': function (event, x, y) {
        var template = Menu.getContextTemplate();
        var editorMenu = new Editor.Menu(template, event.sender);

        x = Math.floor(x);
        y = Math.floor(y);
        editorMenu.nativeMenu.popup(BrowserWindow.fromWebContents(event.sender), x, y);
        editorMenu.dispose();
    },
};
