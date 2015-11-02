import React, {Component, PropTypes} from 'react';

import {
    Button,
    ButtonGroup,
    ButtonToolbar,
    DropdownButton,
    MenuItem,
} from 'react-bootstrap';

import Utils from '../../core/utils';

export default class ConsoleControls extends Component {

    render() {
        const newlineItems = {
            "LF": <span>Use <tt>x0A</tt></span>,
            "CR": <span>Use <tt>x0D</tt></span>,
            "ignore": <span>Leave unchanged</span>,
        };
        const activeMode = this.props.newlineMode;

        return <ButtonToolbar>
            <ButtonGroup>
                <Button onClick={this.props.onClearStdin}>
                    Clear Standard Input
                </Button>
                <Button onClick={this.props.onClearStdout}>
                    Clear Standard Output
                </Button>
            </ButtonGroup>
            <DropdownButton
                title="Newline Mode"
                id="newline-mode"
                dropup
            >
                {Object.keys(newlineItems).map(mode =>
                    <MenuItem
                        key={mode}
                        active={activeMode === mode}
                        onSelect={() => this.props.onSetNewlineMode(mode)}
                    >{newlineItems[mode]}</MenuItem>)}
            </DropdownButton>
        </ButtonToolbar>;
    }

}

ConsoleControls.propTypes = {
    onClearStdout: PropTypes.func.isRequired,
    onClearStdin: PropTypes.func.isRequired,
    newlineMode: PropTypes.string.isRequired,
    onSetNewlineMode: PropTypes.func.isRequired,
};
