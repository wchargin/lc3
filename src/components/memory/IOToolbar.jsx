import React, {Component} from 'react';
import {Button, ButtonGroup, ButtonToolbar, Glyphicon} from 'react-bootstrap';

export default class IOToolbar extends Component {

    render() {
        // TODO(william): Add the rest of the input/export logic
        const disabled = this.props.batch;
        return <ButtonGroup justified>
            <ButtonGroup>
            <Button onClick={this.props.onShowRaw} disabled={disabled}>
                Raw
            </Button>
            </ButtonGroup>
            <ButtonGroup>
            <Button onClick={this.props.onShowAssemble} disabled={disabled}>
                Assemble
            </Button>
            </ButtonGroup>
        </ButtonGroup>;
    }

}
