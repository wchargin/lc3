import React, {Component} from 'react';

import {DropdownButton, MenuItem} from 'react-bootstrap';
import NumericValue from '../NumericValue';

const firstColumnStyle = {
    width: "1px",
};

export class MemoryHeaderRow extends Component {

    render() {
        return <tr>
            <th style={firstColumnStyle}>
                {/* for the row options dropdown (no header needed) */}
            </th>
            <th>0x</th>
            <th>Label</th>
            <th>Hex</th>
            <th>Instruction</th>
        </tr>;
    }

}

export class MemoryRow extends Component {

    render() {
        const setPC = <DropdownButton
            title=""
            id={"actions-" + this.props.address}
            bsStyle={this.props.active ? "primary" : "default"}
            style={{ padding: "0px 6px" }}
        >
            <MenuItem onSelect={() => this.props.onSetPC()}>
                Move PC here
            </MenuItem>
        </DropdownButton>;

        return <tr key={this.props.key}>
            <td style={firstColumnStyle}>{setPC}</td>
            <td>
                <NumericValue
                    value={this.props.address}
                    signed={false}
                    id={"address-" + this.props.address}
                />
            </td>
            <td>{this.props.label}</td>
            <td>
                <NumericValue
                    value={this.props.value}
                    signed={true}
                    id={"value-" + this.props.address}
                    editable={true}
                    onEdit={this.props.onSetValue}
                />
            </td>
            <td>{this.props.instruction}</td>
        </tr>;
    }

}
