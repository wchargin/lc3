import React, {Component} from 'react';
import shallowEquals from 'shallow-equals';

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

    shouldComponentUpdate(newProps, newState) {
        return !shallowEquals(this.props, newProps) ||
            !shallowEquals(this.state, newState);
    }

    render() {
        const disabled = this.props.batch;
        const setPC = <DropdownButton
            title=""
            id={"actions-" + this.props.address}
            bsStyle={this.props.active ? "primary" : "default"}
            style={{ padding: "0px 6px" }}
            disabled={disabled}
        >
            <MenuItem onSelect={() => this.props.onSetPC()}>
                Move PC here
            </MenuItem>
        </DropdownButton>;

        const style = {opacity: disabled ? 0.65 : undefined};
        return <tr key={this.props.key} style={style}>
            <td style={firstColumnStyle}>{setPC}</td>
            <td>
                <NumericValue
                    value={this.props.address}
                    signed={false}
                    id={"address-" + this.props.address}
                    showTooltip={!disabled}
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
                    showTooltip={!disabled}
                />
            </td>
            <td>{this.props.instruction}</td>
        </tr>;
    }

}
