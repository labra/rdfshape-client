import React, { useState } from 'react';
import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";
import Code from "./Code";
import { format2mode } from './Utils';

function ByText(props) {

  const [code,setCode] = useState(props.textAreaValue);

  function handleChange(value) {
    setCode(value);
    props.handleByTextChange(value);
  }

  let inputText;
  if (props.inputForm) {
         inputText = props.inputForm
     } else {
         inputText =  <Code value={code}
                           mode={format2mode(props.textFormat)}
                           onChange={handleChange}
                           setCodeMirror={props.setCodeMirror}
                           placeholder={props.placeholder}
                           readonly='false'
                           fromParams={props.fromParams}
                           resetFromParams={props.resetFromParams}
         />
     }
     return (
        <Form.Group>
         <Form.Label>{props.name}</Form.Label>
         {inputText}
        </Form.Group>
     );
}

ByText.propTypes = {
    name: PropTypes.string,
    textAreaValue: PropTypes.string,
    handleByTextChange: PropTypes.func.isRequired,
    setCodeMirror: PropTypes.func,
    placeholder: PropTypes.string,
    textFormat: PropTypes.string,
    importForm: PropTypes.element,
    resetFromParams: PropTypes.func.isRequired,
    fromParams: PropTypes.bool.isRequired
};

ByText.defaultProps = {
    placeholder: '',
};

export default ByText;
