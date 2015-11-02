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
        const newlineTypes = {
            "LF": {
                menuItem: <span>Use <tt>x0A</tt></span>,
                title: <span>Newlines are <tt>x0A</tt></span>,
            },
            "CR": {
                menuItem: <span>Use <tt>x0D</tt></span>,
                title: <span>Newlines are <tt>x0D</tt></span>,
            },
            "ignore": {
                menuItem: <span>Leave unchanged</span>,
                title: <span>Newlines ignored</span>,
            },
        };
        const activeMode = this.props.newlineMode;

        return <ButtonToolbar>
            <ButtonGroup>
                <Button onClick={this.props.onClearStdin}>
                    Clear standard input
                </Button>
                <Button onClick={this.props.onClearStdout}>
                    Clear standard output
                </Button>
            </ButtonGroup>
            <DropdownButton
                title={newlineTypes[activeMode].title}
                id="newline-mode"
                dropup
            >
                {Object.keys(newlineTypes).map(type =>
                    <MenuItem
                        key={type}
                        active={activeMode === type}
                        onSelect={() => this.props.onSetNewlineMode(type)}
                    >{newlineTypes[type].menuItem}</MenuItem>)}
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
