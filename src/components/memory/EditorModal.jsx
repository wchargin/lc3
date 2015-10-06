/*
 * A generic editing modal for users to create LC3 programs.
 * For example, this can accept hex/binary raw input,
 * or it could act as an assembler window.
 *
 * The propTypes are at the bottom of the file.
 * A typical instantiation might look like this:
 *
 * <EditorModal
 *     parser={parseRaw}
 *     show={this.state.showEditor}
 *     title="Write raw code"
 *     infoMessage={<p><strong>Do things</strong>, then...</p>}
 *     successMessage={<p><strong>Awesome!</strong> Now you can...</p>}
 *     parseButton="Process"
 *     onHide={() => { this.setState({ showEditor: false }); }}
 *     onLoadIntoLC3={program => dispatch(loadProgram(program))}
 *     onDownloadObject={program => triggerDownload(program, "obj")}
 *     onDownloadSymbolTable={program => triggerDownload(program, "sym")}
 * />
 *
 * You can probably wrap this in a more context-specific component, though,
 * like RawModal or AssemblerModal (hint hint).
 */
import React, {Component, PropTypes} from 'react';
import {Alert, Button, ButtonToolbar, Collapse, Modal, Input} from 'react-bootstrap';

import {AlertButton, AlertButtonToolbar} from '../AlertButtons';

export default class EditorModal extends Component {

    constructor() {
        super();
        this.state = {
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
        if (this.props.show && !newProps.show) {
            this.setState({
                parseResult: null,
                previousText: this.refs.code ? this.refs.code.getValue() : "",
            });
        }
    }

    render() {
        const result = this.state.parseResult;

        return <Modal show={this.props.show} onHide={this.props.onHide}>
            <Modal.Header closeButton>
                <Modal.Title>{this.props.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {this.props.infoMessage}
                <Input
                    ref="code"
                    type="textarea"
                    defaultValue={this.state.previousText || ""}
                    rows={16}
                    style={{
                        fontFamily: "monospace",
                    }}
                />
                <Collapse in={result && !result.success}>
                    <Alert bsStyle="danger">
                        <strong>Oh no!</strong>
                        {" "}
                        {result && result.errorMessage}
                    </Alert>
                </Collapse>
                <Collapse in={result && result.success}>
                    <Alert bsStyle="success">
                        {this.props.successMessage}
                        <AlertButtonToolbar>
                            {this.hasSymbolTable() &&
                                <AlertButton
                                    onClick={
                                        () => this.handleDownloadSymbolTable()
                                    }
                                >
                                    Download Symbol Table
                                </AlertButton>}
                            <AlertButton
                                onClick={() => this.handleDownloadObject()}
                            >
                                Download Object File
                            </AlertButton>
                            <AlertButton
                                bsStyle="primary"
                                onClick={() => this.handleLoadIntoLC3()}
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
        const parseResult = this.props.parser(code);
        this.setState({ parseResult });
    }

    hasSymbolTable() {
        const result = this.state.parseResult;
        return result && result.program && result.program.symbolTable.size > 0;
    }


    handleLoadIntoLC3() {
        this.props.onLoadIntoLC3(this.state.parseResult.program);
    }

    handleDownloadObject() {
        this.props.onDownloadObject(this.state.parseResult.program);
    }

    handleDownloadSymbolTable() {
        this.props.onDownloadSymbolTable(this.state.parseResult.program);
    }

}

EditorModal.propTypes = {
    /*
     * This function should take some freeform text
     * and return a ParseResult (see /src/core/parse_result).
     * For example, this might be 'parseRaw' or 'parseAsm'.
     */
    parser: PropTypes.func.isRequired,

    // Whether to show the modal right now.
    show: PropTypes.bool.isRequired,

    // The title for the modal.
    title: PropTypes.string.isRequired,

    // The instructional text to show at the top of the modal.
    infoMessage: PropTypes.node.isRequired,

    // The text to show when the parsing is complete
    // and the user can choose what to do next.
    successMessage: PropTypes.node.isRequired,

    // The name to display on the button that calls the parser.
    parseButton: PropTypes.string.isRequired,

    // Called when the user clicks the close button.
    onHide: PropTypes.func.isRequired,

    // LC3Program -> void
    onLoadIntoLC3: PropTypes.func.isRequired,

    // LC3Program -> void
    onDownloadObject: PropTypes.func.isRequired,

    // LC3Program -> void
    onDownloadSymbolTable: PropTypes.func.isRequired,
};
