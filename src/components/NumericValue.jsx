/*
 * General-purpose display for a hexadecimal value
 * representing some aspect of the LC3 state.
 * This supports a tooltip with the decimal value (signed or unsigned),
 * as well as an editor that appears on click.
 *
 * See the propTypes for NumericValue at the bottom of the file for usage.
 */
import React, {PropTypes, Component} from 'react';

import Utils from '../core/utils';

import {
    Button,
    Input,
    Glyphicon,
    OverlayTrigger,
    Popover,
    Tooltip
} from 'react-bootstrap';

export default class NumericValue extends Component {

    render() {
        const {value} = this.props;
        const hexString = Utils.toHexString(value);
        const decimalValue = this.props.signed ?
            Utils.toInt16(value) :
            Utils.toUint16(value);

        // Affix a tooltip, if one should be shown, to an element.
        const addTooltip = (child) => !this.props.showTooltip ? child :
            <OverlayTrigger placement="top" overlay={
                <Tooltip placement="top" id={this.props.id}>
                    decimal {decimalValue}
                    {" "}
                    {this.props.signed ? "(signed)" : "(unsigned)"}
                </Tooltip>
            }>
                {child}
            </OverlayTrigger>;

        // Affix an editor, if one should be shown, to an element.
        const addEditor = (child) => !this.props.editable ? child :
            <OverlayTrigger
                placement="right"
                trigger="click"
                ref="editorTrigger"
                rootClose
                overlay={
                    <EditorPopover
                        id={`${this.props.id}-editor`}
                        initialValue={hexString}
                        onEdit={(value) => this.handleEdit(value)}
                    />
                }
            >{child}</OverlayTrigger>;

        return addEditor(addTooltip(<tt>{hexString}</tt>));
    }

    /*
     * When the user saves an edit, pass that up to our handler
     * and hide the editor component.
     */
    handleEdit(value) {
        this.refs.editorTrigger.hide();
        this.props.onEdit(value);
    }

}

/*
 * Editor for a numeric value. Performs validation.
 * Required props: id (for a11y); initialValue (string); onEdit (number => ()).
 */
class EditorPopover extends Component {

    constructor() {
        super();
        this.state = {
            value: "",
        };
    }

    componentWillMount() {
        this.setState({ value: this.props.initialValue });
    }

    componentWillReceiveProps(newProps) {
        const isUpdated = this.props.initialValue !== newProps.initialValue;
        if (isUpdated) {
            this.setState({ value: newProps.initialValue });
        }
    }

    componentDidMount() {
        const node = this.refs.input.getInputDOMNode();
        node.focus();

        // Move cursor to end.
        node.selectionStart = node.selectionEnd = node.value.length;
    }

    render() {
        const valid = this.isValid();

        const saveButton = <Button
            bsStyle="primary"
            disabled={!valid}
            onClick={() => this.save()}
        >
            <Glyphicon glyph="ok" />
        </Button>;

        return <Popover {...this.props}>
            <Input
                standalone
                value={this.state.value}
                addonBefore={<Glyphicon glyph="pencil" />}
                buttonAfter={saveButton}
                bsStyle={valid ? undefined : "error"}
                help={valid ? undefined : "Invalid number"}
                onChange={() => this.handleChange()}
                ref="input"
                type="text"
                style={{ fontFamily: "monospace" }}
                onKeyPress={(e) => this.handleKeyPress(e)}
            />
        </Popover>;
    }

    /*
     * When the text field is changed, update the component state.
     */
    handleChange() {
        this.setState({ value: this.refs.input.getValue() });
    }

    /*
     * Listen for pressing the enter button in the text field.
     */
    handleKeyPress(e) {
        if (e.charCode === 13) {
            this.save();
        }
    }

    /*
     * Determine whether the current user input is a valid number.
     * If saving is not permitted, this method must return false.
     */
    isValid() {
        return !isNaN(Utils.parseNumber(this.state.value));
    }

    /*
     * Save the current user input.
     */
    save() {
        const value = Utils.parseNumber(this.state.value);
        if (isNaN(value)) {
            throw new Error(`Tried to set invalid value: ${this.state.value}`);
        } else {
            this.props.onEdit(value);
        }
    }

}

NumericValue.propTypes = {
    // The number to display.
    value: PropTypes.number.isRequired,

    // Required if either the tooltip or editor is shown.
    id: PropTypes.string.isRequired,

    // Whether to show a tooltip with the decimal value on hover.
    showTooltip: PropTypes.bool,

    // If the tooltip is shown, whether the decimal value should be signed.
    signed: PropTypes.bool,

    // Whether to display an editor on click.
    editable: PropTypes.bool,

    // Callback when the user saves a value.
    // Required if the editor is present.
    onEdit: PropTypes.func,  // number => ()
};

NumericValue.defaultProps = {
    showTooltip: true,
    signed: false,
    editable: false,
};
