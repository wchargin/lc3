import React, {Component, PropTypes} from 'react';
import {Map} from 'immutable';

import {Input} from 'react-bootstrap';

export default class Console extends Component {

    render() {
        return <Input
            type="textarea"
            style={{fontFamily: "monospace"}}
            value={this.props.console.get("stdout")}
            onKeyPress={this._handleKeyPress.bind(this)}
            ref="input"
        />;
    }

    _normalizeKey(k) {
        if (k !== 0x0A && k !== 0x0D) {
            return k;
        }

        const newlineMode = this.props.console.get("newlineMode");
        if (!["LF", "CR"].includes(newlineMode)) {
            return k;
        }

        return ({
            "LF": 0x0A,
            "CR": 0x0D,
        })[newlineMode];
    }

    _handleKeyPress(e) {
        const ascii = e.which;
        const normalized = this._normalizeKey(ascii);
        this.props.onEnqueueStdin(String.fromCharCode(normalized));
    }

}

Console.propTypes = {
    console: PropTypes.instanceOf(Map).isRequired,
    onEnqueueStdin: PropTypes.func.isRequired,
};
