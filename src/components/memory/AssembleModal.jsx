import React, {Component, PropTypes} from 'react';

import EditorModal from './EditorModal';

import assemble from '../../core/assemble';

export default class RawModal extends Component {

    render() {
        const infoMessage = <p>
            <strong>Paste</strong> your assembly code below,
            then click the <strong>Assemble</strong> button
            to convert your instructions into LC-3 machine code.
        </p>;

        const successMessage = <p>
            <strong>Awesome!</strong>
            {" "}
            Your code was assembled successfully.
            You can load your program directly into the simulator,
            or download the output object file or symbol table.
        </p>;

        return <EditorModal
            parser={assemble}
            title="Assemble"
            infoMessage={infoMessage}
            successMessage={successMessage}
            parseButton="Assemble"
            onDownloadSymbolTable={() => {}}
            {...this.props}
        />;
    }

}
