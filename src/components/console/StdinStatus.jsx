import React, {Component, PropTypes} from 'react';

import {Collapse} from 'react-bootstrap';

import Utils from '../../core/utils';

export default class StdinStatus extends Component {

    constructor() {
        super();
        this.state = {
            showStdin: false,
            showRaw: false,
        };
    }

    render() {
        const {stdin, kbsr, kbdr} = this.props;
        const length = stdin.length;

        const showStdin = this.state.showStdin && length !== 0;

        const makeButton = (handler, text) =>
            <a
                role="button"
                href="javascript:void 0"
                onClick={handler.bind(this)}
            >{text}</a>;

        const {showRaw} = this.state;
        const showHide = makeButton(this._toggleStdin,
            showStdin ? "hide" : "show");
        const rawText = showStdin && makeButton(this._toggleRaw,
            showRaw ? "show text" : "show raw");


        const noun = length === 1 ? "byte" : "bytes";
        const stdinState = (length === 0) ?
            <strong>empty</strong> :
            <span>
                <strong>buffered</strong>
                {" "}({length} {noun};
                {" "}{showHide}
                {showStdin && ", "}{rawText}
                )
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
                <div>{this._formatStdin(this.props.stdin)}</div>
            </Collapse>
        </div>;
    }

    _toggleStdin() {
        this.setState({ showStdin: !this.state.showStdin });
    }

    _toggleRaw() {
        this.setState({ showRaw: !this.state.showRaw });
    }

    /**
     * Given a string representing the current standard input,
     * replace all the instances of "\r" with a colored <CR> indicator.
     */
    _formatStdin(stdin) {
        const style = {
            fontFamily: "monospace",  // override Menlo or whatever
        };

        if (this.state.showRaw) {
            const formatChar = c =>
                Utils.toHexString(c.charCodeAt(0), 2).substring(1);
            return <pre style={style}>
                {stdin.split("").map(formatChar).join(" ")}
            </pre>;
        } else {
            const splitOnCR = stdin.split("\r");

            const joinerStyle = {
                color: "#337ab7",  // Bootstrap primary color
            }
            const joiner = <tt style={joinerStyle}>{"<CR>"}</tt>;

            let parts = new Array(splitOnCR.length * 2 - 1);
            for (let i = 0; i < parts.length; i++) {
                if (i % 2 === 0) {
                    parts[i] = splitOnCR[i / 2];
                } else {
                    parts[i] = joiner;
                }
            }
            return React.createElement(
                "pre",
                {style},
                ...parts,
                <span>&nbsp;</span>
            );
        }
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
