import React, {Component} from 'react';

import {ButtonToolbar, ButtonGroup, Button} from 'react-bootstrap';

export default class ControlButtons extends Component {

    render() {
        return <ButtonToolbar>
            <ButtonGroup>
                <Button onClick={() => this.props.onStep()}>
                    Step
                </Button>
            </ButtonGroup>
        </ButtonToolbar>;
    }

}
