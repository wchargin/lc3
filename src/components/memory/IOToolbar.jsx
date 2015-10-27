import React, {Component} from 'react';
import {Button, ButtonGroup, ButtonToolbar, Glyphicon} from 'react-bootstrap';

export default class IOToolbar extends Component {

    render() {
        // TODO(william): Add the rest of the input/export logic
        return <ButtonGroup justified>
            <ButtonGroup>
            <Button onClick={this.props.onShowRaw}>
                Raw
            </Button>
            </ButtonGroup>
            <ButtonGroup>
            <Button onClick={this.props.onShowAssemble}>
                Assemble
            </Button>
            </ButtonGroup>
        </ButtonGroup>;
    }

}
