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

    _handleKeyPress(e) {
        this.props.onEnqueueStdin(String.fromCharCode(e.which));
    }

}

Console.propTypes = {
    console: PropTypes.instanceOf(Map).isRequired,
    onEnqueueStdin: PropTypes.func.isRequired,
};
