import React, {Component} from 'react';
import {connect} from 'react-redux';

import * as actions from '../../actions';

import {
    Button,
    ButtonGroup,
    ButtonToolbar,
    Glyphicon,
    Panel,
    Table,
} from 'react-bootstrap';
import {MemoryRow, MemoryHeaderRow} from './MemoryRow';
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

        const activeRow = lc3.registers.pc;

        const memoryRows = memoryInView.map((value, index) => {
            const address = topRow + index;
            return <MemoryRow
                address={address}
                value={value}
                label={lc3.symbolTable.keyOf(address)}
                active={address === activeRow}
                instruction={lc3.formatInstructionAtAddress(address)}
                onSetPC={() => this.props.onSetPC(address)}
                onSetValue={(value) => this.props.setMemory(address, value)}
                key={index}
            />;
        });

        const header = "Search bar goes here";  // TODO(william)
        const footer = this.renderFooter();

        return <div className="memory-view">
            <h2>Memory</h2>
            <Panel header={header} footer={footer}>
                <Table hover fill>
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

    renderFooter() {
        // TODO(william): Add the rest of the input/export logic
        const scrollDelta = 1;
        return <ButtonToolbar>
            <ButtonGroup>
                <Button onClick={() => this.props.onScrollBy(-scrollDelta)}>
                    <Glyphicon glyph="chevron-up" alt="Scroll memory up" />
                </Button>
                <Button onClick={() => this.props.onScrollBy(scrollDelta)}>
                    <Glyphicon glyph="chevron-down" alt="Scroll memory down" />
                </Button>
                <Button onClick={() => this.props.onScrollToPC()}>
                    Jump to PC
                </Button>
            </ButtonGroup>
            <Button onClick={() => this.setState({ showRawModal: true })}>
                Raw
            </Button>
            <RawModal
                show={this.state.showRawModal}
                onHide={() => this.setState({ showRawModal: false })}
                onLoadIntoLC3={this.handleLoadIntoLC3.bind(this)}
                onDownloadObject={this.handleDownloadObject.bind(this)}
            />
        </ButtonToolbar>;
    }

    handleLoadIntoLC3(data) {
        this.props.onLoadProgram(data);
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
        onSetPC: (newPC) => dispatch(actions.setPC(newPC)),
        onLoadProgram: (program) => dispatch(actions.loadProgram(program)),
        onScrollBy: (delta) => dispatch(actions.scrollBy(delta)),
        onScrollToPC: () => dispatch(actions.scrollToPC()),
        onSetMemory: (addr, value) => dispatch(actions.setMemory(addr, value)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(MemoryView);
