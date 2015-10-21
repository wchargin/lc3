import React, {Component} from 'react';
import {connect} from 'react-redux';

import * as actions from '../../actions';

import {
    Button,
    ButtonGroup,
    ButtonToolbar,
    Glyphicon,
    Panel,
} from 'react-bootstrap';
import RawModal from './RawModal';
import AssembleModal from './AssembleModal';
import MemoryTable from './MemoryTable';

class MemoryView extends Component {

    constructor() {
        super();
        this.state = {
            showRawModal: false,
            showAssembleModal: false,
        };
    }

    render() {
        const {lc3, viewOptions} = this.props;

        const header = "Search bar goes here";  // TODO(william)
        const footer = this.renderFooter();

        return <div className="memory-view">
            <h2>Memory</h2>
            <Panel header={header} footer={footer}>
                <MemoryTable
                    lc3={this.props.lc3}
                    topRow={viewOptions.get("topAddressShown")}
                    onSetPC={this.props.onSetPC}
                    onSetMemory={this.props.onSetMemory}
                    fill
                />
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
            <Button onClick={() => this.setState({ showAssembleModal: true })}>
                Assemble
            </Button>
            <AssembleModal
                show={this.state.showAssembleModal}
                onHide={() => this.setState({ showAssembleModal: false })}
                onLoadIntoLC3={this.handleLoadIntoLC3.bind(this)}
                onDownloadObject={this.handleDownloadObject.bind(this)}
            />
        </ButtonToolbar>;
    }

    handleLoadIntoLC3(data) {
        this.props.onLoadProgram(data);
        this.setState({
            showRawModal: false,
            showAssembleModal: false,
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
