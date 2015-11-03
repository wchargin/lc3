import React, {Component} from 'react';

import {ButtonToolbar, ButtonGroup, Button} from 'react-bootstrap';

export default class ControlButtons extends Component {

    render() {
        return <ButtonToolbar>
            <ButtonGroup>
                <Button onClick={() => this.props.onStep()}>
                    Step
                </Button>
                <Button onClick={() => this.props.onEnterBatchMode("NEXT")}>
                    Next
                </Button>
                <Button onClick={() => this.props.onEnterBatchMode("FINISH")}>
                    Finish
                </Button>
                <Button onClick={() => this.props.onEnterBatchMode("RUN")}>
                    Run
                </Button>
            </ButtonGroup>
            <ButtonGroup>
                <Button onClick={() => this.props.onExitBatchMode()}>
                    Pause
                </Button>
                <Button onClick={() => this.props.onEnterBatchMode("CONTINUE")}>
                    Continue
                </Button>
            </ButtonGroup>
        </ButtonToolbar>;
    }

}
