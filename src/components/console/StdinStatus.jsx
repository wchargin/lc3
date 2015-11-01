import React, {Component, PropTypes} from 'react';

import {Collapse} from 'react-bootstrap';

import Utils from '../../core/utils';

export default class StdinStatus extends Component {

    constructor() {
        super();
        this.state = {
            showStdin: false,
        };
    }

    render() {
        const {stdin, kbsr, kbdr} = this.props;
        const length = stdin.length;

        const showStdin = this.state.showStdin && length !== 0;
        const showHide = <a
            role="button"
            href="javascript:void 0"
            onClick={this._toggleStdin.bind(this)}
        >
            {this.state.showStdin ? "hide" : "show"}
        </a>;

        const noun = length === 1 ? "byte" : "bytes";
        const stdinState = (length === 0) ?
            <strong>empty</strong> :
            <span>
                <strong>buffered</strong> ({length} {noun}; {showHide})
            </span>;

        const kbdrByte = formatByte(kbdr);
        const kbsrState = ((kbsr & 0x8000) === 0) ?
            <strong>waiting</strong> :
            <span>
                <strong>ready</strong>, and the KBDR contains
                {" "}<tt>{Utils.toHexString(kbdr, 2)}</tt>
                {kbdrByte && " ("}{kbdrByte}{kbdrByte && ")"}
            </span>;

        return <div>
            <p>
                Standard input is {stdinState}.
                The KBSR is {kbsrState}.
            </p>
            <Collapse in={showStdin}>
                <div><pre>{this.props.stdin.replace(/\r/g, "\n")}</pre></div>
            </Collapse>
        </div>;
    }

    _toggleStdin() {
        this.setState({ showStdin: !this.state.showStdin });
    }

}

function formatByte(b) {
    if (0x20 <= b && b <= 0x7E) {
        return <tt>"{String.fromCharCode(b)}"</tt>;
    } else if (b === 0x0A) {
        return <tt>"\n"</tt>;
    }
}

StdinStatus.propTypes = {
    stdin: PropTypes.string.isRequired,
    kbsr: PropTypes.number.isRequired,
    kbdr: PropTypes.number.isRequired,
};
