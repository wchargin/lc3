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
        return <ButtonToolbar>
            <ButtonGroup>
                <Button onClick={this.props.onClearStdin}>
                    Clear Standard Input
                </Button>
                <Button onClick={this.props.onClearStdout}>
                    Clear Standard Output
                </Button>
            </ButtonGroup>
            {/*
            <DropdownButton
                title="Newline Mode"
                id="newline-mode"
                dropup
            >
                <MenuItem>Use <tt>x0A</tt></MenuItem>
                <MenuItem>Use <tt>x0D</tt></MenuItem>
                <MenuItem>Leave unchanged</MenuItem>
            </DropdownButton>
            */}
        </ButtonToolbar>;
    }

}

ConsoleControls.propTypes = {
    onClearStdout: PropTypes.func.isRequired,
    onClearStdin: PropTypes.func.isRequired,
};
