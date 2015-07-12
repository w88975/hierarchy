function findMenu (menuArray, label) {
    for (var i = 0; i < menuArray.length; i++) {
        if (menuArray[i].label === label) {
            return menuArray[i];
        }
    }
    return null;
}

function buildMenu (menuData) {
    var template = [];
    var items = Object.keys(menuData);
    // enumerate components
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var subPaths = item.split('/');

        var prio = 0;
        // enumerate menu path
        var newMenu = null;
        for (var p = 0, parent = template; p < subPaths.length; p++) {
            var label = subPaths[p];
            if (!label) {
                continue;
            }
            var parentMenuArray = parent === template ? template : parent.submenu;
            var menu;
            if (parentMenuArray) {
                if (parentMenuArray.length > 0) {
                    menu = findMenu(parentMenuArray, label);
                }
                if (menu) {
                    if (menu.submenu) {
                        parent = menu;
                        continue;
                    }
                    else {
                        Editor.error('Registered menu path conflict:', item);
                        break;
                    }
                }
            }
            // create
            newMenu = {
                label: label,
                priority: prio
            };
            if ( !parentMenuArray ) {
                parent.submenu = [newMenu];
            }
            else {
                var length = parentMenuArray.length;
                if (length > 0) {
                    // find from back to front to get the one less than supplied priority,
                    // then return the last one.
                    for (var j = length - 1; j >= 0; j--) {
                        if (parentMenuArray[j].priority > newMenu.priority) {
                            // end loop
                            if (j === 0) {
                                parentMenuArray.unshift(newMenu);
                            }
                        }
                        else {
                            parentMenuArray.splice(j + 1, 0, newMenu);
                            break;
                        }
                    }
                }
                else {
                    parentMenuArray.push(newMenu);
                }
            }
            parent = newMenu;
        }
        if (newMenu && !newMenu.submenu) {
            newMenu.message = 'scene:create-new-node';
            newMenu.params = [
                {
                    menuPath: item,
                    id: menuData[item]
                }
            ];
            newMenu.panel = 'scene.panel';
        }
        else {
            Editor.error('Invalid registered menu path: ' + item);
        }
    }
    return template;
}

module.exports = buildMenu;
