import React, {Component, PropTypes} from 'react';

import LC3 from '../../core/lc3';

import { Table } from 'react-bootstrap';
import {MemoryRow, MemoryHeaderRow} from './MemoryRow';

export default class MemoryTable extends Component {

    render() {
        const {lc3, topRow: nominalTopRow} = this.props;
        const {memory, symbolTable} = lc3;

        const rowsToShow = 16;
        const topRow = Math.min(nominalTopRow, memory.size - rowsToShow);
        const memoryInView = memory.skip(topRow).take(rowsToShow);

        const activeRow = lc3.registers.pc;

        const memoryRows = memoryInView.map((value, index) => {
            const address = topRow + index;
            return <MemoryRow
                address={address}
                value={value}
                label={symbolTable.keyOf(address)}
                active={address === activeRow}
                instruction={lc3.formatInstructionAtAddress(address)}
                onSetPC={() => this.props.onSetPC(address)}
                onSetValue={(value) => this.props.onSetMemory(address, value)}
                key={index}
            />;
        });

        return <Table hover>
            <thead>
                <MemoryHeaderRow />
            </thead>
            <tbody>
                {memoryRows}
            </tbody>
        </Table>;
    }

}

MemoryTable.propTypes = {
    lc3: PropTypes.instanceOf(LC3).isRequired,
    topRow: PropTypes.number.isRequired,
    onSetPC: PropTypes.func.isRequired,
    onSetMemory: PropTypes.func.isRequired,
};
