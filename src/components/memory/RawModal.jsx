import React, {Component, PropTypes} from 'react';
import {Alert, Button, ButtonToolbar, Collapse, Modal, Input} from 'react-bootstrap';

import {AlertButton, AlertButtonToolbar} from '../AlertButtons';

import parseRaw from '../../core/raw';

export default class RawModal extends Component {

    constructor() {
        super();
        this.state = {
            parseState: "none",
            parseError: null,
            parseResult: null,
            previousText: "",
        };
    }

    componentWillReceiveProps(newProps) {
        // When the component is hidden,
        // we want to clear the parse result state
        // so that the user doesn't see the old results
        // if they open the modal again.
        //
        // On the other hand, we do want the input text to persist,
        // but it doesn't seem to by default,
        // so we store that manually and will restore it if shown again.
        //
        // TODO(william): refactor this type of thing
        // into some sort of shared EditingModal component
        if (this.props.show && !newProps.show) {
            this.setState({
                parseState: "none",
                parseError: null,
                parseResult: null,
                previousText: this.refs.code ? this.refs.code.getValue() : "",
            });
        }
    }

    render() {
        return <Modal show={this.props.show} onHide={this.props.onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Write raw hex or binary</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    <strong>Paste</strong> your hex or binary code below.
                    Click the <strong>Process</strong> button
                    to process your instructions so that you can
                    download an OBJ file or
                    load them directly into the interpreter.
                </p>
                <Input
                    ref="code"
                    type="textarea"
                    defaultValue={this.state.previousText || ""}
                    rows={16}
                    style={{
                        fontFamily: "monospace",
                    }}
                />
                <Collapse in={this.state.parseState === "error"}>
                    <Alert bsStyle="danger">
                        <strong>Oh no!</strong>
                        {" "}
                        {this.state.parseError}
                    </Alert>
                </Collapse>
                <Collapse in={this.state.parseState === "success"}>
                    <Alert bsStyle="success">
                        <p>
                            <strong>Awesome!</strong>
                            {" "}
                            Your code was processed successfully.
                            You can load your program
                            directly into the simulator,
                            or download the output object file.
                        </p>
                        <AlertButtonToolbar>
                            <AlertButton
                                onClick={this.handleDownloadObject.bind(this)}>
                                Download Object File
                            </AlertButton>
                            <AlertButton
                                bsStyle="primary"
                                onClick={this.handleLoadIntoLC3.bind(this)}
                            >
                                Load into Simulator
                            </AlertButton>
                        </AlertButtonToolbar>
                    </Alert>
                </Collapse>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={() => this.props.onHide()}>
                    Cancel
                </Button>
                <Button onClick={() => this.process()}>
                    Process
                </Button>
            </Modal.Footer>
        </Modal>;
    }

    process() {
        const code = this.refs.code.getValue();
        const result = parseRaw(code);

        if (result.success) {
            this.setState({
                parseState: "success",
                parseError: null,
                parseResult: result.program,
            });
        } else {
            this.setState({
                parseState: "error",
                parseError: result.errorMessage,
                parseResult: null,
            });
        }

    }

    handleLoadIntoLC3() {
        this.props.onLoadIntoLC3(this.state.parseResult);
    }

    handleDownloadObject() {
        this.props.onDownloadObject(this.state.parseResult);
    }

}

RawModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    onLoadIntoLC3: PropTypes.func.isRequired,
    onDownloadObject: PropTypes.func.isRequired,
};
