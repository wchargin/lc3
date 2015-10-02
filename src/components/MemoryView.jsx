import React, {Component} from 'react';
import {connect} from 'react-redux';

import {Panel, Table} from 'react-bootstrap';

class MemoryView extends Component {

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
            <Panel header="<SearchBar> goes here">
                <Table hover>
                    <thead>
                        <tr>
                            <th>Address</th>
                            <th>Hex</th>
                        </tr>
                    </thead>
                    <tbody>
                        {memoryRows}
                    </tbody>
                </Table>
            </Panel>
        </div>;
    }

}

function mapStateToProps(state) {
    return {
        lc3: state.get("lc3"),

        // TODO(william): use real values here
        startAtRow: 0x10000 - 10,
        activeRow: 0x10000 - 10,
    };
}

export default connect(mapStateToProps)(MemoryView);
