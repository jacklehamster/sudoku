class SudokuCell extends React.Component {
    constructor(props) {
        super(props);
        this.onPress = this.onPress.bind(this);
    }

    onPress(e) {
        const cell = e.currentTarget;
        const x = this.props.x;
        const y = this.props.y;

        let digit = parseInt(this.props.fixedValue);
        if (this.constructor.isValid(digit)) {
            digit++;
            if (digit > 9) {
                digit = 0;
            }
        } else {
            digit = 1;
        }
        this.props.sudoku.setGrid(x, y, digit);
        this.props.sudoku.send();
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

    render() {
        const className = this.constructor.isValid(this.props.fixedValue) ? 'cell fixed-cell' : 'cell blank-cell';
        return React.createElement(
            'td',
            { className: className, onMouseDown: this.onPress },
            this.props.value || ''
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
    }

    onUpdate(grid, fixedGrid) {
        this.setState({ grid: grid, fixedGrid: fixedGrid });
    }

    componentDidMount() {
        this.props.sudoku.start();
    }

    componentWillUnmount() {
        this.props.sudoku.stop();
    }

    subGrid(xpos, ypos) {
        const array = [];
        for (let y = 0; y < 3; y++) {
            const line = [];
            for (let x = 0; x < 3; x++) {
                const x_attr = xpos * 3 + x + 1;
                const y_attr = ypos * 3 + y + 1;
                const id = `id_${x_attr}_${y_attr}`;
                const value = this.state.grid[y_attr][x_attr];
                const fixedValue = this.state.fixedGrid[y_attr][x_attr];
                line.push(React.createElement(SudokuCell, { key: x + y * 3, sudoku: this.props.sudoku, value: value,
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
                        { cellSpacing: 0, cellPadding: 0 },
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
            this.props.title ? React.createElement(
                'h2',
                null,
                this.props.title
            ) : null,
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