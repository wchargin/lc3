import React, {PropTypes, Component} from 'react';
import {Map} from 'immutable';

import {REGISTER_NAMES} from '../../core/constants';
import {formatConditionCode} from '../../core/lc3';

import {Col, Panel} from 'react-bootstrap';

import NumericValue from '../NumericValue';

class Register extends Component {

    render() {
        return <Col xs={6} sm={3}>
            <b>{this.props.name}:</b>
            {" "}
            {this.props.children}
        </Col>;
    }

}

export default class Registers extends Component {

    render() {
        const {registers} = this.props;

        const makeNumericRegister = (name, signed) =>
            <Register name={name} key={name}>
                <NumericValue
                    value={registers[name]}
                    signed={signed}
                    id={name}
                />
            </Register>;

        return <Panel header="Registers">
            {REGISTER_NAMES.get("standard").map(name =>
                makeNumericRegister(name, true)).toJS()}
            {REGISTER_NAMES.get("special").map(name =>
                makeNumericRegister(name, true)).toJS()}
            <Register name="CC">
                {formatConditionCode(registers["PSR"])}
            </Register>
        </Panel>;
    }

}

Registers.propTypes = {
    registers: (function() {
        const names = REGISTER_NAMES.get("all");
        const types = Map(names.map(x => [x, PropTypes.number.isRequired]));
        return PropTypes.shape(types.toJS()).isRequired;
    })(),
};
