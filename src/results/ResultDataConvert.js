import React, { Fragment, useState } from "react";
import { Tab, Tabs } from "react-bootstrap";
import API from "../API";
import Code from "../components/Code";
import { Permalink } from "../Permalink";
import PrintJson from "../utils/PrintJson";
import { format2mode } from "../utils/Utils";

function ResultDataConvert({
  result: dataConvertResponse, // Request successful response
  permalink,
  fromParams,
  resetFromParams,
  disabled,
}) {
  // Destructure request response items for later usage
  const {
    message,
    data: {
      format: { name: inputFormatName },
    },
    result: {
      data: dataRaw,
      format: { name: outputFormatName },
    },
  } = dataConvertResponse;

  const [resultTab, setResultTab] = useState(API.tabs.result);

  if (dataConvertResponse) {
    return (
      <div id="results-summary">
        <Tabs activeKey={resultTab} onSelect={setResultTab} id="resultTabs">
          {/* Output data */}
          {dataRaw && outputFormatName && (
            <Tab eventKey={API.tabs.result} title={API.texts.resultTabs.result}>
              <Code
                value={dataRaw}
                mode={format2mode(outputFormatName)}
                fromParams={fromParams}
                resetFromParams={resetFromParams}
                readOnly={true}
              />
            </Tab>
          )}
        </Tabs>

        <br />
        <details>
          <summary>{API.texts.operationInformation}</summary>
          <ul>
            <li>{`Format conversion: ${inputFormatName} => ${outputFormatName}`}</li>
          </ul>
        </details>
        <details>
          <summary>{API.texts.responseSummaryText}</summary>
          <PrintJson json={dataConvertResponse} />
        </details>
        {permalink && (
          <Fragment>
            <hr />
            <Permalink url={permalink} disabled={disabled} />
          </Fragment>
        )}
      </div>
    );
  }
}

export default ResultDataConvert;
