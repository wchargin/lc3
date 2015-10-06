import React, {Component, PropTypes} from 'react';

import EditorModal from './EditorModal';

import parseRaw from '../../core/raw';

export default class RawModal extends Component {

    render() {
        const infoMessage = <p>
            <strong>Paste</strong> your hex or binary code below,
            then click the <strong>Process</strong> button
            to convert your instructions into LC-3 machine code.
            Don't forget to include the starting address.
        </p>;

        const successMessage = <p>
            <strong>Awesome!</strong>
            {" "}
            Your code was processed successfully.
            You can load your program directly into the simulator,
            or download the output object file.
        </p>;

        return <EditorModal
            parser={parseRaw}
            title="Write raw hex or binary"
            infoMessage={infoMessage}
            successMessage={successMessage}
            parseButton="Process"
            onDownloadSymbolTable={() => {}}
            {...this.props}
        />;
    }

}
