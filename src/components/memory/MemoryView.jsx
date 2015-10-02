import React, {Component} from 'react';
import {connect} from 'react-redux';

import {setPC} from '../../actions';

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
            return <MemoryRow
                address={address}
                value={value}
                active={address === activeRow}
                onSetPC={() => this.props.onSetPC(address)}
                key={index}
            />;
        });

        return <div className="memory-view">
            <h2>Memory</h2>
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

function mapDispatchToProps(dispatch) {
    return {
        onSetPC: (newPC) => dispatch(setPC(newPC)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(MemoryView);
