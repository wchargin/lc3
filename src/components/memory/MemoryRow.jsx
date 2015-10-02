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
            <th>Hex</th>
        </tr>;
    }

}

export class MemoryRow extends Component {

    render() {
        const {address, value, active, key} = this.props;

        const setPC = <DropdownButton
            title=""
            id={"actions-" + address}
            bsStyle={active ? "primary" : "default"}
            style={{ padding: "0px 6px" }}
        >
            <MenuItem onSelect={() => this.props.onSetPC()}>
                Move PC here
            </MenuItem>
        </DropdownButton>;

        return <tr key={key}>
            <td style={firstColumnStyle}>{setPC}</td>
            <td>
                <NumericValue
                    value={address}
                    signed={false}
                    id={"address-" + address}
                />
            </td>
            <td>
                <NumericValue
                    value={value}
                    signed={true}
                    id={"value-" + address}
                />
            </td>
        </tr>;
    }

}
