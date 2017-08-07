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
        this.props.sudoku.setGrid(x,y,digit);
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

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.fixedValue !== nextProps.fixedValue
            || !this.props.fixedValue && this.props.value !== nextProps.value;
    }

    render() {
        const className = this.constructor.isValid(this.props.fixedValue) ? 'cell fixed-cell' : 'cell blank-cell';
        return (
            <td className={className} onMouseDown={this.onPress}>
                {this.props.fixedValue||(this.props.value||'')}
            </td>
        );
    }
}

class SudokuGrid extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            grid: this.props.sudoku.grid,
            fixedGrid: this.props.sudoku.grid,
        };
        this.props.sudoku.addUpdateCallback(this.onUpdate.bind(this));
    }

    onUpdate(grid, fixedGrid) {
        if(this.updating) {
            return;
        }
        this.updating = true;
        this.setState({grid: grid, fixedGrid: fixedGrid});
    }

    componentDidUpdate() {
        this.updating = false;
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
                line.push(
                    <SudokuCell key={x+y*3} sudoku={this.props.sudoku} value={value}
                        x={x_attr} y={y_attr} fixedValue={fixedValue} />
                );
            }
            array.push(<tr key={y}>{line}</tr>);
        }
        return array;
    }

    cells() {
        const array = [];
        for (let y = 0; y < 3; y++) {
            const line = [];
            for (let x = 0; x < 3; x++) {
                line.push(<td key={x+y*3}>
                    <table cellSpacing={0} cellPadding={0}>
                        <tbody>
                            {this.subGrid(x,y)}
                        </tbody>
                    </table>
                </td>);
            }
            array.push(<tr key={y}>{line}</tr>);
        }
        return array;
    }

    render() {
        return (
            <div>
                {this.props.title?<h2>{this.props.title}</h2>:null}
                <div className='container'>
                    <table cellSpacing={0} cellPadding={0}>
                        <tbody>
                        {this.cells()}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

function showSudokuGrid(sudoku) {
    ReactDOM.render(
        <SudokuGrid title="Sudoku Solver" sudoku={sudoku} />,
        document.getElementById('root'),
    );
}
