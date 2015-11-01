import React, {Component, PropTypes} from 'react';

import Utils from '../../core/utils';

export default class StdinStatus extends Component {

    render() {
        const {stdin, kbsr, kbdr} = this.props;

        const length = stdin.length;
        const noun = length === 1 ? "byte" : "bytes";
        const stdinState = (length === 0) ?
            <strong>empty</strong> :
            <span>
                <strong>buffered</strong> ({length} {noun})
            </span>;

        const kbdrByte = formatByte(kbdr);
        const kbsrState = ((kbsr & 0x8000) === 0) ?
            <strong>waiting</strong> :
            <span>
                <strong>ready</strong>, and the KBDR contains
                {" "}<tt>{Utils.toHexString(kbdr, 2)}</tt>
                {kbdrByte && " ("}{kbdrByte}{kbdrByte && ")"}
            </span>;

        return <span>
            Standard input is {stdinState}.
            The KBSR is {kbsrState}.
        </span>;
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
