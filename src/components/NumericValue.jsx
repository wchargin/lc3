import React, {PropTypes, Component} from 'react';

import Utils from '../core/utils';

import {OverlayTrigger, Tooltip} from 'react-bootstrap';

export default class NumericValue extends Component {

    render() {
        const {value} = this.props;

        const decimalValue = this.props.signed ?
            Utils.toInt16(value) :
            Utils.toUint16(value);

        const tooltip = <Tooltip placement="top" id={this.props.id}>
            decimal {decimalValue}
            {" "}
            {this.props.signed ? "(signed)" : "(unsigned)"}
        </Tooltip>;

        const number = <tt>{Utils.toHexString(value)}</tt>;

        if (this.props.showTooltip) {
            return <OverlayTrigger placement="top" overlay={tooltip}>
                {number}
            </OverlayTrigger>;
        } else {
            return number;
        }
    }

}

NumericValue.propTypes = {
    value: PropTypes.number.isRequired,
    signed: PropTypes.bool.isRequired,
    id: PropTypes.string.isRequired,
    showTooltip: PropTypes.bool,
};

NumericValue.defaultProps = {
    showTooltip: true,
};
