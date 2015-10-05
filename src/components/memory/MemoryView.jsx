import React, {Component} from 'react';
import {connect} from 'react-redux';

import {setPC, setMemoryBlock} from '../../actions';

import {Button, Panel, Table} from 'react-bootstrap';
import {MemoryRow, MemoryHeaderRow} from './MemoryRow';
import FullBleedPanel from '../FullBleedPanel';

import RawModal from './RawModal';

class MemoryView extends Component {

    constructor() {
        super();
        this.state = {
            showRawModal: false,
        };
    }

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

        const header = "Search bar goes here";  // TODO(william)
        const footer = this.renderFooter();

        return <div className="memory-view">
            <h2>Memory</h2>
            <FullBleedPanel header={header} footer={footer}>
                <Table hover>
                    <thead>
                        <MemoryHeaderRow />
                    </thead>
                    <tbody>
                        {memoryRows}
                    </tbody>
                </Table>
            </FullBleedPanel>
        </div>;
    }

    renderFooter() {
        // TODO(william): Add the rest of the input/expor tlogic
        return <div>
            <Button onClick={() => this.setState({ showRawModal: true })}>
                Raw
            </Button>
            <RawModal
                show={this.state.showRawModal}
                onHide={() => this.setState({ showRawModal: false })}
                onLoadIntoLC3={this.handleLoadIntoLC3.bind(this)}
                onDownloadObject={this.handleDownloadObject.bind(this)}
            />
        </div>;
    }

    handleLoadIntoLC3(data) {
        this.props.onSetMemoryBlock(data.orig, data.machineCode, data.symbolTable);
        this.setState({
            showRawModal: false,
        });
    }

    handleDownloadObject(data) {
        console.log("Downloading not yet implemented");  // TODO(william)
        this.setState({
            showRawModal: false,
        });
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
        onSetMemoryBlock:
            (orig, mc, st) => dispatch(setMemoryBlock(orig, mc, st)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(MemoryView);
