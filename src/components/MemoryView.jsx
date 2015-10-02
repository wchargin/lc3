import React, {Component} from 'react';

export default class MemoryView extends Component {

    render() {
        const rowsToShow = 16;
        const {lc3, startAtRow, activeRow} = this.props;

        const memory = lc3.get("memory");
        const firstVisibleRow = Math.min(startAtRow, memory.size - rowsToShow);
        const memoryInView = memory.skip(firstVisibleRow).take(rowsToShow);

        const memoryRows = memoryInView.map((value, index) => {
            const address = firstVisibleRow + index;
            const style = address !== activeRow ? {} :
                { background: "yellow" };
            return <tr key={index} style={style}>
                <td>{address}</td>
                <td>{value}</td>
            </tr>;
        });

        return <div className="memory-view">
            <h1>Memory</h1>
            <table>
                <thead>
                    <tr>
                        <td>Address</td>
                        <td>Hex</td>
                    </tr>
                </thead>
                <tbody>
                    {memoryRows}
                </tbody>
            </table>
        </div>;
        return <h1>MemoryView</h1>;
    }

}
