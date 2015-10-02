import React, {Component} from 'react';
import {connect} from 'react-redux';

import {Panel, Table} from 'react-bootstrap';

import {MemoryRow, MemoryHeaderRow} from './MemoryRow';

class MemoryView extends Component {

    render() {
        const {lc3, viewOptions} = this.props;

        const memory = lc3.get("memory");
        const rowsToShow = 16;
        const nominalTopRow = viewOptions.get("topAddressShown");
        const topRow = Math.min(nominalTopRow, memory.size - rowsToShow);
        const memoryInView = memory.skip(topRow).take(rowsToShow);

        const activeRow = lc3.getIn(["registers", "PC"]);

        const memoryRows = memoryInView.map((value, index) => {
            const address = topRow + index;
            const props = {
                address,
                value,
                active: address === activeRow,
                key: index,
            };
            return <MemoryRow {...props} />;
        });

        return <div className="memory-view">
            <h1>Memory</h1>
            <Panel header="<SearchBar> goes here">
                <Table hover>
                    <thead>
                        <MemoryHeaderRow />
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
        viewOptions: state.get("viewOptions"),
    };
}

export default connect(mapStateToProps)(MemoryView);
