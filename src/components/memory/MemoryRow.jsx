import React, {Component} from 'react';

export class MemoryHeaderRow extends Component {

    render() {
        return <tr>
            <th>Address</th>
            <th>Hex</th>
        </tr>;
    }

}

export class MemoryRow extends Component {

    render() {
        const {address, value, active, key} = this.props;
        const style = active ? { background: "yellow" } : {};

        return <tr style={style} key={key}>
            <td>{address}</td>
            <td>{value}</td>
        </tr>;
    }

}
