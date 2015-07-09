describe('<editor-hierarchy>', function() {

    var panel;
    var tree;

    before(function ( done ) {
        sinon.stub(Editor, 'sendToPanel').withArgs('scene.panel', 'scene:query-hierarchy');

        fixture('panel', function (el) {
            panel = el;
            tree = panel.$.tree;
            done();
        });
    });

    after(function () {
        Editor.sendToPanel.restore();
    });

    beforeEach(function () {
        tree.clear();
    });

    function setTree (snapshot) {
        tree._lastSnapshot = null;
        var ipcListener = panel['scene:reply-query-hierarchy'];
        ipcListener.call(panel, tree._queryID, snapshot);
    }

    it('should create elements when ready', function () {
        setTree([
            {
                id: 0,
                name: '0',
                children: [
                    {
                        id: 1,
                        name: '1',
                        children: null
                    }
                ]
            }
        ]);
        var roots = Polymer.dom(tree).children;
        expect(roots.length).to.be.equal(1);
        var root = roots[0];

        expect(Polymer.dom(root).parentNode).to.be.equal(tree);
        expect(root.name).to.be.equal('0');
        expect(root._userId).to.be.equal(0);
        var children = Polymer.dom(root).children;
        expect(children.length).to.be.equal(1);
        expect(children[0].name).to.be.equal('1');
        expect(children[0]._userId).to.be.equal(1);
        expect(Polymer.dom(children[0]).children.length).to.be.equal(0);
    });

    it('could move tree item downwards', function () {
        setTree([
            {
                id: 0,
                name: '0',
                children: null
            },
            {
                id: 1,
                name: '1',
                children: null
            }
        ]);
        tree._applyCmds([
            {
                op: 'move',
                id: 0,
                index: 1,
                parentId: null
            }
        ]);

        var roots = Polymer.dom(tree).children;
        expect(roots.length).to.be.equal(2);
        var n0 = roots[0];
        var n1 = roots[1];

        expect(n0.name).to.be.equal('1');
        expect(n1.name).to.be.equal('0');
    });

    it('could move tree item upwards', function () {
        setTree([
            {
                id: 0,
                name: '0',
                children: null
            },
            {
                id: 1,
                name: '1',
                children: null
            }
        ]);
        tree._applyCmds([
            {
                op: 'move',
                id: 1,
                index: 0,
                parentId: null
            }
        ]);

        var roots = Polymer.dom(tree).children;
        expect(roots.length).to.be.equal(2);
        var n0 = roots[0];
        var n1 = roots[1];

        expect(n0.name).to.be.equal('1');
        expect(n1.name).to.be.equal('0');
    });

    it.skip('should replace recursively', function () {
        setTree([
            {
                id: 0,
                name: '0',
                children: [
                    {
                        id: 1,
                        name: '1',
                        children: null
                    }
                ]
            }
        ]);
        tree._applyCmds([
            {
                op: 'replace',
                id: 0,
                node: {
                    id: 1,
                    name: '1',
                    children: [
                        {
                            id: 0,
                            name: '0',
                            children: null
                        }
                    ]
                }
            }
        ]);

        var roots = Polymer.dom(tree).children;
        expect(roots.length).to.be.equal(1);
        var root = roots[0];

        expect(root.name).to.be.equal('1');
        expect(root._userId).to.be.equal(1);

        var children = Polymer.dom(root).children;
        expect(children.length).to.be.equal(1);

        expect(children[0].name).to.be.equal('0');
        expect(children[0]._userId).to.be.equal(0);
        expect(Polymer.dom(children[0]).children.length).to.be.equal(0);
    });
});
