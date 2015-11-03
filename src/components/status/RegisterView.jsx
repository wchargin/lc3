import React, {PropTypes, Component} from 'react';
import {Map} from 'immutable';

import RegisterSet from '../../core/register_set';
import Utils from '../../core/utils';

import {Col, Panel} from 'react-bootstrap';

import NumericValue from '../NumericValue';

class Register extends Component {

    render() {
        return <Col xs={6} sm={3} style={this.props.style}>
            <b>{this.props.name}:</b>
            {" "}
            {this.props.children}
        </Col>;
    }

}

export default class RegisterView extends Component {

    render() {
        const {registers, batch} = this.props;
        const style = {opacity: (batch ? 0.65 : undefined)};

        const makeNumericRegister = (name, signed) =>
            <Register name={name.toUpperCase()} key={name} style={style}>
                <NumericValue
                    value={registers[name]}
                    signed={signed}
                    id={name}
                    editable={!batch}
                    onEdit={(value) => this.props.onSetRegister(name, value)}
                    showTooltip={!batch}
                />
            </Register>;

        return <Panel header="Registers">
            {RegisterSet.numericRegisterNames.map(name =>
                makeNumericRegister(name, true))}
            {RegisterSet.specialRegisterNames.map(name =>
                makeNumericRegister(name, false))}
            <Register name="CC" style={style}>
                {Utils.formatConditionCode(registers.psr)}
            </Register>
        </Panel>;
    }

}

RegisterView.propTypes = {
    registers: PropTypes.instanceOf(RegisterSet).isRequired,
    batch: PropTypes.bool,

    // (name, value) => ()
    onSetRegister: PropTypes.func.isRequired,
};
