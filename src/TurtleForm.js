import React, {useState, useEffect, useRef} from 'react';
import 'perfectkb-yate/dist/yate.css';
import Yate from 'perfectkb-yate/dist/yate.bundled.js';
import PropTypes from "prop-types";

function TurtleForm(props) {
    const [yate,setYate] = useState(null);
    const textAreaRef=useRef(null);

    useEffect(() => {
        if (!yate) {
            const options = { 
                placeholder: props.placeholder 
            };
            const y = Yate.fromTextArea(
                textAreaRef.current, 
                options)
            y.on('change', (cm,change) => {
                // setQuery(cm.getValue())
                props.onChange(cm.getValue())
            });
            y.setValue(props.value)
            y.refresh();
            setYate(y);
        } else if (props.fromParams) {
            yate.setValue(props.value);
            if (props.resetFromParams) props.resetFromParams();
            else {
                console.error(`resetFromParams is not a function...`)
            }
        }
    }, [yate,
        props.onChange,
        props.placeholder,
        props.fromParams,
        props.resetFromParams,
        props.value]
    );

    return (
        <textarea ref={textAreaRef}/>
    );
}

TurtleForm.propTypes = {
//    id: PropTypes.string.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    resetFromParams: PropTypes.func.isRequired,
    fromParams: PropTypes.bool.isRequired
};

TurtleForm.defaultProps = {
    value: ''
}

export default TurtleForm;
