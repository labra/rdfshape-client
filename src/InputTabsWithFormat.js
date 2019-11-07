import React from 'react';
import InputTabs from "./InputTabs";
import SelectFormat from "./SelectFormat";
import PropTypes from "prop-types";

function InputTabsWithFormat(props) {
    return (
            <div>
                <InputTabs name={props.nameInputTab}
                       activeTab={props.activeTab}
                       handleTabChange={props.handleTabChange}

                       byTextName={props.byTextName}
                       textAreaValue={props.textAreaValue}
                       textFormat={props.textFormat}
                       handleByTextChange={props.handleByTextChange}
                       byTextPlaceholder={props.byTextPlaceholder}
                       inputForm = {props.inputForm}
                       setCodeMirror = {props.setCodeMirror}

                       byUrlName={props.byUrlName}
                       urlValue={props.urlValue}
                       handleUrlChange={props.handleUrlChange}
                       byURLPlaceholder={props.byURLPlaceholder}

                       byFileName={props.byFileName}
                       handleFileUpload={props.handleFileUpload}
                       fromParams={props.fromParams}
                       resetFromParams={props.resetFromParams}
            />
            <SelectFormat name={props.nameFormat}
                          selectedFormat={props.textFormat}
                          handleFormatChange={props.handleFormatChange}
                          urlFormats={props.urlFormats}
            />
            </div>
        );
}

InputTabsWithFormat.propTypes = {
    nameInputTab: PropTypes.string.isRequired,
    activeTab: PropTypes.string,
    handleTabChange: PropTypes.func.isRequired,
    byTextName: PropTypes.string,
    textFormat: PropTypes.string,
    textAreaValue: PropTypes.string,
    handleByTextChange: PropTypes.func.isRequired,
    setCodeMirror: PropTypes.func.isRequired,
    byTextPlaceholder: PropTypes.string,
    byUrlName: PropTypes.string.isRequired,
    urlValue: PropTypes.string.isRequired,
    handleUrlChange: PropTypes.func.isRequired,
    byURLPlaceholder: PropTypes.string,
    byFileName: PropTypes.string.isRequired,
    handleFileUpload: PropTypes.func.isRequired,
    nameFormat: PropTypes.string.isRequired,
    defaultFormat: PropTypes.string.isRequired,
    handleFormatChange: PropTypes.func.isRequired,
    urlFormats: PropTypes.string.isRequired,
    resetFromParams: PropTypes.func.isRequired,
    fromParams: PropTypes.bool.isRequired
};

InputTabsWithFormat.defaultProps = {
    activeTab: 'ByText',
    byTextName: '',
    byTextPlaceholder: '',
    byUrlName: '',
    byUrlPlaceholder: '',
    byFileName: ''
};


export default InputTabsWithFormat;