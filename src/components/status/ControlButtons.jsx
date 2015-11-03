import React, {Component} from 'react';

import {ButtonToolbar, ButtonGroup, Button} from 'react-bootstrap';

export default class ControlButtons extends Component {

    render() {
        const {batch} = this.props;
        return <ButtonToolbar>
            <ButtonGroup>
                <Button
                    onClick={() => this.props.onStep()}
                    disabled={batch}
                >
                    Step
                </Button>
                <Button
                    onClick={() => this.props.onEnterBatchMode("NEXT")}
                    disabled={batch}
                >
                    Next
                </Button>
                <Button
                    onClick={() => this.props.onEnterBatchMode("FINISH")}
                    disabled={batch}
                >
                    Finish
                </Button>
                <Button
                    onClick={() => this.props.onEnterBatchMode("RUN")}
                    disabled={batch}
                >
                    Run
                </Button>
            </ButtonGroup>
            <ButtonGroup>
                <Button
                    onClick={() => this.props.onExitBatchMode()}
                    disabled={!batch}
                    bsStyle={batch ? "primary" : "default"}
                >
                    Pause
                </Button>
                <Button
                    onClick={() => this.props.onEnterBatchMode("CONTINUE")}
                    disabled={batch}
                >
                    Continue
                </Button>
            </ButtonGroup>
        </ButtonToolbar>;
    }

}
