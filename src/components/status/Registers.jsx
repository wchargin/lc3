import React, {PropTypes, Component} from 'react';
import {Map} from 'immutable';

import {REGISTER_NAMES} from '../../core/constants';

import {Col, Panel} from 'react-bootstrap';

import NumericValue from '../NumericValue';

export default class Registers extends Component {

    render() {
        const {registers} = this.props;

        const makeRegister = (name, signed) => <Col xs={6} sm={3}>
            <b>{name}:</b>
            {" "}
            <NumericValue
                value={registers[name]}
                signed={signed}
                id={name}
            />
        </Col>;

        return <Panel header="Registers">
            {REGISTER_NAMES.get("standard").map(name =>
                makeRegister(name, true)).toJS()}
            {REGISTER_NAMES.get("special").map(name =>
                makeRegister(name, true)).toJS()}
            {/* TODO(william): add condition codes */}
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
