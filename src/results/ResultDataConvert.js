import React, { Fragment } from "react";
import Alert from "react-bootstrap/Alert";
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

  if (dataConvertResponse) {
    return (
      <div>
        {/* Alert */}
        <Alert variant="success">{message}</Alert>
        {/* Output data */}
        {dataRaw && outputFormatName && (
          <Code
            value={dataRaw}
            mode={format2mode(outputFormatName)}
            fromParams={fromParams}
            resetFromParams={resetFromParams}
            readOnly={true}
          />
        )}
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
