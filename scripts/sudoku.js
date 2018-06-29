const demoMode = window.innerWidth <= 100 || window.innerHeight <= 100;

class SudokuCell extends React.Component {
    constructor(props) {
        super(props);
        this.onPress = this.onPress.bind(this);
        this.startScroller = this.startScroller.bind(this);
        this.state = {
            scroll: 0
        };
        this.isTouch = false;
    }

    startScroller(x, y, digit, isTouch) {
        const scrollCellHeight = 62;
        let orgY = -digit * scrollCellHeight;
        this.setState({
            scroll: orgY,
            touching: true
        });

        function scroller(e) {
            const pageX = e.touches ? e.touches[0].pageX : e.pageX;
            const pageY = e.touches ? e.touches[0].pageY : e.pageY;
            let scroll = orgY + (-y + pageY - x + pageX) * 2;
            if (scroll > 0) {
                orgY -= scroll;
                scroll = 0;
            } else if (scroll < -9 * scrollCellHeight) {
                scroll = -9 * scrollCellHeight;
            }
            this.setState({
                scroll
            }, function () {
                const scrollDigit = Math.round(Math.min(9, Math.max(0, -this.state.scroll / scrollCellHeight)));
                const digit = parseInt(this.props.fixedValue);
                if (digit !== scrollDigit) {
                    this.props.sudoku.setGrid(this.props.x, this.props.y, scrollDigit);
                    this.props.sudoku.send();
                }
            });
            e.preventDefault();
            e.stopPropagation();
        }

        function mouseUp(e) {
            this.setState({
                touching: false
            });
            document.removeEventListener('mouseup', mouseUp);
            document.removeEventListener('mousemove', scroller);
            document.removeEventListener('touchend', mouseUp);
            document.removeEventListener('touchmove', scroller);
        }

        mouseUp = mouseUp.bind(this);
        scroller = scroller.bind(this);

        if (isTouch) {
            document.addEventListener('touchmove', scroller);
            document.addEventListener('touchend', mouseUp);
        } else {
            document.addEventListener('mousemove', scroller);
            document.addEventListener('mouseup', mouseUp);
        }
    }

    onPress(e) {
        if (demoMode) {
            return;
        }
        if (e.type === 'touchstart' && !this.isTouch) {
            this.isTouch = true;
        } else if (e.type === 'mousedown' && this.isTouch) {
            this.isTouch = false;
            return;
        }

        let digit = parseInt(this.props.fixedValue);
        if (this.constructor.isValid(digit)) {
            digit++;
            if (digit > 9) {
                digit = 0;
            }
        } else {
            digit = 1;
        }

        const pageX = e.touches ? e.touches[0].pageX : e.pageX;
        const pageY = e.touches ? e.touches[0].pageY : e.pageY;

        this.startScroller(pageX, pageY, digit, e.type === 'touchstart');

        this.props.sudoku.setGrid(this.props.x, this.props.y, digit);
        this.props.sudoku.send();
        e.stopPropagation();
    }

    static isValid(digit) {
        digit = parseFloat(digit);
        if (isNaN(digit)) {
            return false;
        }
        if (Math.floor(digit) !== digit) {
            return false;
        }
        return 1 <= digit && digit <= 9;
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.fixedValue !== nextProps.fixedValue || !this.props.fixedValue && this.props.value !== nextProps.value || this.state.scroll !== nextState.scroll || this.state.touching !== nextState.touching;
    }

    render() {
        let className = this.constructor.isValid(this.props.fixedValue) ? 'cell fixed-cell' : 'cell blank-cell';
        if (this.props.darker) {
            className += ' darker';
        }
        return React.createElement(
            'td',
            { className: className,
                onTouchStart: this.onPress,
                onMouseDown: this.onPress },
            React.createElement(
                'div',
                { style: {
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    } },
                this.props.fixedValue || this.props.value || ''
            ),
            React.createElement(
                'div',
                { className: 'tip ' + (this.state.touching ? 'active' : ''), style: {
                        marginTop: -90,
                        marginLeft: -8,
                        position: 'absolute',
                        width: 52,
                        height: 92
                    } },
                React.createElement(
                    'svg',
                    { style: {
                            position: 'relative',
                            bottom: -45
                        }, height: 45, width: 58 },
                    React.createElement('polygon', { points: '0,0 58,0 51,45 8,45', style: { fillOpacity: 0.2, fill: '#000' } })
                ),
                React.createElement(
                    'div',
                    { style: {
                            position: 'relative',
                            top: -62,
                            border: '2px black solid',
                            backgroundColor: 'lavender',
                            color: 'darkblue',
                            height: 54,
                            width: 54,
                            opacity: .95,
                            overflow: 'hidden'
                        } },
                    React.createElement(
                        'div',
                        { style: {
                                position: 'relative',
                                top: this.state.scroll
                            } },
                        React.createElement('div', { className: 'scroller' }),
                        React.createElement(
                            'div',
                            { className: 'scroller' },
                            '1'
                        ),
                        React.createElement(
                            'div',
                            { className: 'scroller' },
                            '2'
                        ),
                        React.createElement(
                            'div',
                            { className: 'scroller' },
                            '3'
                        ),
                        React.createElement(
                            'div',
                            { className: 'scroller' },
                            '4'
                        ),
                        React.createElement(
                            'div',
                            { className: 'scroller' },
                            '5'
                        ),
                        React.createElement(
                            'div',
                            { className: 'scroller' },
                            '6'
                        ),
                        React.createElement(
                            'div',
                            { className: 'scroller' },
                            '7'
                        ),
                        React.createElement(
                            'div',
                            { className: 'scroller' },
                            '8'
                        ),
                        React.createElement(
                            'div',
                            { className: 'scroller' },
                            '9'
                        )
                    )
                )
            )
        );
    }
}

class SudokuGrid extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            grid: this.props.sudoku.grid,
            fixedGrid: this.props.sudoku.grid
        };
        this.props.sudoku.addUpdateCallback(this.onUpdate.bind(this));
        if (demoMode) {
            this.time = performance.now();
            this.solving = true;
            this.cellList = [];
            for (let i = 0; i < 81; i++) {
                this.cellList[i] = [i % 9 + 1, Math.floor(i / 9) + 1];
            }
            this.shuffleCellList();
            this.cellIndex = 0;
        }
    }

    shuffleCellList() {
        for (let i = 0; i < this.cellList.length; i++) {
            const temp = this.cellList[i];
            const index = Math.floor(Math.random() * this.cellList.length);
            this.cellList[i] = this.cellList[index];
            this.cellList[index] = temp;
        }
    }

    onUpdate(grid, fixedGrid) {
        if (this.updating) {
            return;
        }
        this.updating = true;
        this.setState({ grid: grid, fixedGrid: fixedGrid });
    }

    componentDidUpdate() {
        this.updating = false;

        if (demoMode) {
            this.demo();
        }
    }

    demo() {
        if (performance.now() - this.time > 100) {
            if (this.solving) {
                const pos = this.cellList[this.cellIndex];
                const x = pos[0];
                const y = pos[1];
                this.props.sudoku.setGrid(x, y, this.state.grid[y][x]);
                this.cellIndex++;
                if (this.cellIndex >= this.cellList.length) {
                    this.solving = false;
                }
            } else {
                this.cellIndex--;
                const pos = this.cellList[this.cellIndex];
                const x = pos[0];
                const y = pos[1];
                this.props.sudoku.setGrid(x, y, 0);
                if (this.cellIndex === 0) {
                    this.solving = true;
                    this.shuffleCellList();
                }
            }
            this.time = performance.now();
        }
    }

    componentDidMount() {
        this.props.sudoku.start();
    }

    componentWillUnmount() {
        this.props.sudoku.stop();
    }

    subGrid(xpos, ypos) {
        const odd = (xpos + ypos) % 2 === 1;
        const array = [];
        for (let y = 0; y < 3; y++) {
            const line = [];
            for (let x = 0; x < 3; x++) {
                const x_attr = xpos * 3 + x + 1;
                const y_attr = ypos * 3 + y + 1;
                const id = `id_${x_attr}_${y_attr}`;
                const value = this.state.grid[y_attr][x_attr];
                const fixedValue = this.state.fixedGrid[y_attr][x_attr];
                line.push(React.createElement(SudokuCell, { darker: odd && demoMode,
                    key: x + y * 3, sudoku: this.props.sudoku, value: value,
                    x: x_attr, y: y_attr, fixedValue: fixedValue }));
            }
            array.push(React.createElement(
                'tr',
                { key: y },
                line
            ));
        }
        return array;
    }

    cells() {
        const array = [];
        for (let y = 0; y < 3; y++) {
            const line = [];
            for (let x = 0; x < 3; x++) {
                line.push(React.createElement(
                    'td',
                    { key: x + y * 3 },
                    React.createElement(
                        'table',
                        { className: 'subtable', cellSpacing: 0, cellPadding: 0 },
                        React.createElement(
                            'tbody',
                            null,
                            this.subGrid(x, y)
                        )
                    )
                ));
            }
            array.push(React.createElement(
                'tr',
                { key: y },
                line
            ));
        }
        return array;
    }

    render() {
        return React.createElement(
            'div',
            null,
            React.createElement(
                'div',
                { className: 'title' },
                this.props.title ? React.createElement(
                    'h2',
                    null,
                    this.props.title
                ) : null
            ),
            React.createElement(
                'div',
                { className: 'container' },
                React.createElement(
                    'table',
                    { cellSpacing: 0, cellPadding: 0 },
                    React.createElement(
                        'tbody',
                        null,
                        this.cells()
                    )
                )
            )
        );
    }
}

function showSudokuGrid(sudoku) {
    ReactDOM.render(React.createElement(SudokuGrid, { title: 'Sudoku Solver', sudoku: sudoku }), document.getElementById('root'));
}
//# sourceMappingURL=sudoku.js.map