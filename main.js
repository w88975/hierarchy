var BrowserWindow = require('browser-window');
var BuildMenu = require('./utils/build-menu');

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
        if (Editor.nodeCreateMenu) {
            template = BuildMenu(Editor.nodeCreateMenu);
        }
        else {
            template = [
                { label: '(None)', enabled: false },
            ];
        }
        var editorMenu = new Editor.Menu(template, event.sender);
        x = Math.floor(x);
        y = Math.floor(y);
        editorMenu.nativeMenu.popup(BrowserWindow.fromWebContents(event.sender), x, y);
        editorMenu.dispose();
    },
};
