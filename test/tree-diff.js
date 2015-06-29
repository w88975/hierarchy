var treeDiff = require('../utils/tree-diff');

describe('smoke testing', function() {
    it('should pass if lastRoots is nil', function() {
        var diff = treeDiff(null, []);
        expect(diff).to.deep.equal({
            cmds: [],
            equal: true
        });
    });
    it('should pass if no element', function() {
        var newData = [];
        var oldData = [];
        var diff = treeDiff(oldData, newData);
        expect(diff).to.deep.equal({
            cmds: [],
            equal: true
        });
    });
});

describe('diff result', function() {
    it('should equal if the same', function() {
        function getRandomTree () {
            return [
                {
                    id: 0,
                    name: '',
                    children: [
                        {
                            id: 1,
                            name: 'Honey',
                            children: [
                                {
                                    id: 2,
                                    name: 'Darling',
                                    children: null
                                }
                            ]
                        },
                        {
                            id: 15,
                            name: 'Daddy',
                            children: null
                        }
                    ]
                },
                {
                    id: 5,
                    name: '',
                    children: null
                }
            ];
        }
        var diff = treeDiff(getRandomTree(), getRandomTree());
        expect(diff).to.deep.equal({
            cmds: [],
            equal: true
        });
    });

    describe('name changes', function() {
        it('should be detected', function() {
            var oldData = [
                {
                    id: 0,
                    name: '0',
                    children: null
                },
                {
                    id: 4,
                    name: '4',
                    children: null
                }
            ];
            var newData = [
                {
                    id: 0,
                    name: 'Zero',
                    children: null
                },
                {
                    id: 4,
                    name: 'Four',
                    children: null
                }
            ];
            var diff = treeDiff(oldData, newData);
            expect(diff).to.deep.equal({
                cmds: [
                    {
                        op: 'rename',
                        id: 0,
                        name: 'Zero'
                    },
                    {
                        op: 'rename',
                        id: 4,
                        name: 'Four'
                    }
                ],
                equal: false
            });
        });
    });

    describe('root changes', function() {
        it('should be detected if add elements', function() {
            var oldData = [];
            var newData = [
                {
                    id: 0,
                    name: '0',
                    children: null
                },
                {
                    id: 5,
                    name: '5',
                    children: null
                }
            ];
            var diff = treeDiff(oldData, newData);
            expect(diff).to.deep.equal({
                cmds: [
                    {
                        op: 'append',
                        parentId: null,
                        node: {
                            id: 0,
                            name: '0',
                            children: null
                        }
                    },
                    {
                        op: 'append',
                        parentId: null,
                        node: {
                            id: 5,
                            name: '5',
                            children: null
                        }
                    }
                ],
                equal: false
            });
        });

        it('should be detected if remove elements', function() {
            var oldData = [
                {
                    id: 0,
                    name: '0',
                    children: null
                },
                {
                    id: 5,
                    name: '5',
                    children: null
                },
                {
                    id: 15,
                    name: '15',
                    children: null
                }
            ];
            var newData = [
                {
                    id: 0,
                    name: '0',
                    children: null
                }
            ];
            var diff = treeDiff(oldData, newData);
            expect(diff).to.deep.equal({
                cmds: [
                    {
                        op: 'remove',
                        id: 5,
                    },
                    {
                        op: 'remove',
                        id: 15,
                    }
                ],
                equal: false
            });
        });
    });

    describe('child changes', function() {
        it('should be detected if remove child', function () {
            var oldData = [
                {
                    id: '0',
                    name: '',
                    children: [
                        {
                            id: '0-0',
                            name: '',
                            children: [
                                {
                                    id: '0-0-0',
                                    name: '',
                                    children: null
                                }
                            ]
                        },
                        {
                            id: '0-1',
                            name: '',
                            children: [
                                {
                                    id: '0-1-0',
                                    name: '',
                                    children: null
                                }
                            ]
                        }
                    ]
                }
            ];
            var newData = [
                {
                    id: '0',
                    name: '',
                    children: [
                        {
                            id: '0-0',
                            name: '',
                            children: null
                        }
                    ]
                }
            ];
            var diff = treeDiff(oldData, newData);
            Editor.log(diff);
            expect(diff).to.deep.equal({
                cmds: [
                    {
                        op: 'remove',
                        id: '0-0-0',
                    },
                    {
                        op: 'remove',
                        id: '0-1',
                    }
                ],
                equal: false
            });
        });
        it('should be detected if add children', function () {
            var oldData = [
                {
                    id: '0',
                    name: '',
                    children: [
                        {
                            id: '0-0',
                            name: '',
                            children: null
                        }
                    ]
                }
            ];
            var newData = [
                {
                    id: '0',
                    name: '',
                    children: [
                        {
                            id: '0-0',
                            name: '',
                            children: [
                                {
                                    id: '0-0-0',
                                    name: '',
                                    children: null
                                }
                            ]
                        },
                        {
                            id: '0-1',
                            name: '',
                            children:  [
                                {
                                    id: '0-1-0',
                                    name: '',
                                    children: null
                                }
                            ]
                        }
                    ]
                }
            ];
            var diff = treeDiff(oldData, newData);
            Editor.log(diff);
            expect(diff).to.deep.equal({
                cmds: [
                    {
                        op: 'append',
                        parentId: '0-0',
                        node: {
                            id: '0-0-0',
                            name: '',
                            children: null
                        }
                    },
                    {
                        op: 'append',
                        parentId: '0',
                        node: {
                            id: '0-1',
                            name: '',
                            children:  [
                                {
                                    id: '0-1-0',
                                    name: '',
                                    children: null
                                }
                            ]
                        }
                    }
                ],
                equal: false
            });
        });
    });

    describe('inserting one node', function() {
        it('should be detected', function() {
            var oldData = [
                {
                    id: 4,
                    name: '4',
                    children: null
                }
            ];
            var newData = [
                {
                    id: 0,
                    name: 'Zero',
                    children: null
                },
                {
                    id: 4,
                    name: 'Four',
                    children: null
                }
            ];
            var diff = treeDiff(oldData, newData);
            expect(diff).to.deep.equal({
                cmds: [
                    {
                        op: 'insert',
                        index: 0,
                        parentId: null,
                        node: {
                            id: 0,
                            name: 'Zero',
                            children: null
                        }
                    },
                    {
                        op: 'rename',
                        id: 4,
                        name: 'Four'
                    }
                ],
                equal: false
            });
        });
    });

    describe('removing one node', function() {
        it('should be detected', function() {
            var oldData = [
                {
                    id: 0,
                    name: 'Zero',
                    children: null
                },
                {
                    id: 4,
                    name: '4',
                    children: null
                }
            ];
            var newData = [
                {
                    id: 4,
                    name: 'Four',
                    children: null
                }
            ];
            var diff = treeDiff(oldData, newData);
            expect(diff).to.deep.equal({
                cmds: [
                    {
                        op: 'remove',
                        id: 0,
                    },
                    {
                        op: 'rename',
                        id: 4,
                        name: 'Four'
                    }
                ],
                equal: false
            });
        });
    });

    describe('swapping nodes', function() {
        it('should be detected', function() {
            var oldData = [
                {
                    id: 0,
                    name: '0',
                    children: null
                },
                {
                    id: 4,
                    name: '4',
                    children: null
                }
            ];
            var newData = [
                {
                    id: 4,
                    name: 'Four',
                    children: null
                },
                {
                    id: 0,
                    name: 'Zero',
                    children: null
                }
            ];
            var diff = treeDiff(oldData, newData);
            expect(diff).to.deep.equal({
                cmds: [
                    {
                        op: 'move',
                        id: 0,
                        index: 1,
                        parentId: null
                    },
                    {
                        op: 'rename',
                        id: 0,
                        name: 'Zero'
                    },
                    {
                        op: 'rename',
                        id: 4,
                        name: 'Four'
                    }
                ],
                equal: false
            });
        });
    });
});
