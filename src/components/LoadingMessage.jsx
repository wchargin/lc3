/*
 * A replica of the "Initializing, please wait..." div
 * that appears in the static HTML.
 * We re-create this in React so that we can animate it out.
 */
import React, {Component} from 'react';
import {Alert, Col, Collapse} from 'react-bootstrap';

export default class LoadingMessage extends Component {

    constructor() {
        super();
        this.state = { visible: true };
    }

    componentDidMount() {
        // Fade out immediately.
        this.setState({ visible: false });
    }

    render() {
        return <Collapse in={this.state.visible}>
            <Col md={12}>
                <Alert bsStyle="info">
                    <strong>Initializing</strong> the LC-3.
                    Please wait&hellip;
                </Alert>
            </Col>
        </Collapse>;
    }

}
