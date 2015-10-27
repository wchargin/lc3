import React, {Component, PropTypes} from 'react';
import {Button, Collapse, Glyphicon, Input} from 'react-bootstrap';
import {Map} from 'immutable';

import Utils from '../../core/utils';
import Constants from '../../core/constants';

export default class MemorySearch extends Component {

    constructor() {
        super();
        this.state = {
            inputValue: "",
        };
    }

    parseQuery(query) {
        if (query === "") {
            return {
                query,
                state: "empty",
            };
        }

        const maybeLiteral = Utils.parseNumber(query);
        const isLiteral = !isNaN(maybeLiteral);
        if (!isNaN(maybeLiteral)) {
            const literal = maybeLiteral;
            const min = 0;
            const max = Constants.MEMORY_SIZE;
            if (0 <= literal && literal < max) {
                return {
                    query,
                    isLiteral,
                    state: "valid",
                    address: literal,
                };
            } else {
                return {
                    query,
                        isLiteral,
                    state: "invalid",
                    errorNode: <span>
                        Address out of range!
                        It should be at least {min} and less than {max}.
                    </span>,
                };
            }
        }

        const maybeSymbol = this.props.symbolTable.get(query);
        if (maybeSymbol === undefined) {
            // Super special case: if it's exactly an "x" or "X",
            // we assume they're typing a numeric literal.
            if (query.toLowerCase() === "x") {
                return {
                    query,
                    isLiteral: true,
                    state: "empty",
                };
            }
            const nnl = "Not a numeric literal, and no such label found.";
            return {
                query,
                isLiteral,
                state: "invalid",
                errorNode: query.toLowerCase().startsWith("0x") ?
                    <span>
                        {nnl}{" "}
                        Did you mean to write <tt>{query.substring(1)}</tt>
                        {" "}(without the leading <tt>0</tt>)?
                    </span> :
                    <span>{nnl}</span>,
            };
        }

        return {
            query,
            isLiteral,
            state: "valid",
            address: maybeSymbol,
        };
    }

    render() {
        const searchButton = <Button onClick={() => this._handleClick()}>
            <Glyphicon glyph="search" />
        </Button>;

        const query = this.parseQuery(this.state.inputValue);
        const inputStyle = {
            fontFamily: query.isLiteral ? "monospace" : undefined,
        };

        const invalid = query.state === "invalid";
        const feedback = <Collapse in={invalid}>
            <div>{query.errorNode}</div>
        </Collapse>;

        return <Input
            type="text"
            standalone
            buttonBefore={searchButton}
            onChange={() => this._handleChange()}
            bsStyle={invalid ? "error" : undefined}
            help={feedback}
            ref="input"
            style={inputStyle}
            {...this.props}
        />;
    }

    focus() {
        this.refs.input.getInputDOMNode().focus();
    }

    _handleChange() {
        const inputValue = this.refs.input.getValue();
        this.setState({ inputValue });
        this._maybeJump(inputValue);
    }

    _handleClick() {
        this.focus();
        this._maybeJump(this.state.inputValue);
    }

    _maybeJump(inputValue) {
        const query = this.parseQuery(inputValue);
        if (query.state === "valid") {
            this.props.onScrollTo(query.address);
        }
    }

};

MemorySearch.propTypes = {
    symbolTable: PropTypes.instanceOf(Map).isRequired,
    onScrollTo: PropTypes.func.isRequired,
};
