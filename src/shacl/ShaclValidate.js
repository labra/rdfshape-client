import axios from "axios";
import qs from "query-string";
import React, { useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ProgressBar from "react-bootstrap/ProgressBar";
import Row from "react-bootstrap/Row";
import API from "../API";
import {
  getDataText,
  InitialData,
  mkDataTabs,
  paramsFromStateData,
  updateStateData
} from "../data/Data";
import EndpointInput from "../endpoint/EndpointInput";
import { mkPermalinkLong, params2Form } from "../Permalink";
import ResultValidateShacl from "../results/ResultValidateShacl";
import { mkError } from "../utils/ResponseError";
import {
  getShaclText,
  InitialShacl,
  mkShaclTabs,
  paramsFromStateShacl,
  updateStateShacl
} from "./Shacl";

function ShaclValidate(props) {
  const [shacl, setShacl] = useState(InitialShacl);
  const [data, setData] = useState(InitialData);

  const [endpoint, setEndpoint] = useState("");
  const [withEndpoint, setWithEndpoint] = useState(false);

  const [result, setResult] = useState("");

  const [params, setParams] = useState(null);
  const [lastParams, setLastParams] = useState(null);

  const [permalink, setPermalink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);

  const [disabledLinks, setDisabledLinks] = useState(false);

  const url = API.routes.server.schemaValidate;

  useEffect(() => {
    if (props.location?.search) {
      const queryParams = qs.parse(props.location.search);
      let paramsData,
        paramsShacl,
        paramsEndpoint = {};

      if (queryParams[API.queryParameters.data.data]) {
        const finalData = updateStateData(queryParams, data) || data;
        paramsData = finalData;
        setData(finalData);
      }
      if (queryParams[API.queryParameters.schema.schema]) {
        const finalSchema = updateStateShacl(queryParams, shacl) || shacl;
        paramsShacl = finalSchema;
        setShacl(finalSchema);
      }

      // Endpoint State
      if (queryParams[API.queryParameters.endpoint.endpoint]) {
        paramsEndpoint = {
          [API.queryParameters.endpoint.endpoint]:
            queryParams[API.queryParameters.endpoint.endpoint],
        };
        setEndpoint(queryParams[API.queryParameters.endpoint.endpoint]);
        setWithEndpoint(!!queryParams[API.queryParameters.endpoint.endpoint]);
      }

      const params = mkParams(paramsData, paramsShacl, paramsEndpoint);
      setParams(params);
      setLastParams(params);
    }
  }, [props.location?.search]);

  useEffect(() => {
    if (params && !loading) {
      if (
        !(
          params[API.queryParameters.data.data] &&
          (params[API.queryParameters.data.source] == API.sources.byFile
            ? params[API.queryParameters.data.data].name
            : true)
        )
      )
        setError(API.texts.noProvidedRdf);
      else if (
        !(
          params[API.queryParameters.schema.schema] &&
          (params[API.queryParameters.schema.source] == API.sources.byFile
            ? params[API.queryParameters.schema.schema].name
            : true)
        )
      )
        setError(API.texts.noProvidedSchema);
      else {
        resetState();
        setUpHistory();
        postValidate();
      }
      window.scrollTo(0, 0);
    }
  }, [params]);

  function handleEndpointChange(value) {
    setEndpoint(value.trim());
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const paramsEndpoint = {};
    if (endpoint !== "") {
      paramsEndpoint[API.queryParameters.endpoint.endpoint] = endpoint.trim();
    }

    setParams(mkParams());
  }

  function mkParams(
    paramsData = data,
    paramsShacl = shacl,
    paramsEndpoint = {}
  ) {
    const params = {
      ...paramsFromStateData(paramsData),
      ...paramsFromStateShacl(paramsShacl),
      ...paramsEndpoint,
      triggerMode: API.triggerModes.targetDecls, // SHACL Validation
    };
    if (endpoint !== "") {
      params[API.queryParameters.endpoint.endpoint] = endpoint.trim();
    }
    return params;
  }

  function postValidate(cb) {
    setLoading(true);
    setProgressPercent(15);
    const formData = params2Form(params);
    setProgressPercent(30);

    axios
      .post(url, formData)
      .then((response) => response.data)
      .then(async (data) => {
        setResult(data);
        setProgressPercent(70);
        setPermalink(
          mkPermalinkLong(API.routes.client.shaclValidateRoute, params)
        );
        setProgressPercent(80);
        checkLinks();
        if (cb) cb();
        setProgressPercent(100);
      })
      .catch(function(error) {
        setError(mkError(error, url));
      })
      .finally(() => setLoading(false));
  }

  // Disabled permalinks, etc. if the user input is too long or a file
  function checkLinks() {
    const disabled =
      getShaclText(shacl).length + getDataText(data).length >
      API.limits.byTextCharacterLimit
        ? API.sources.byText
        : data.activeSource === API.sources.byFile ||
          shacl.activeSource === API.sources.byFile
        ? API.sources.byFile
        : false;

    setDisabledLinks(disabled);
  }

  function setUpHistory() {
    // Store the last search URL in the browser history to allow going back
    if (
      params &&
      lastParams &&
      JSON.stringify(params) !== JSON.stringify(lastParams)
    ) {
      // eslint-disable-next-line no-restricted-globals
      history.pushState(
        null,
        document.title,
        mkPermalinkLong(API.routes.client.shaclValidateRoute, lastParams)
      );
    }
    // Change current url for shareable links
    // eslint-disable-next-line no-restricted-globals
    history.replaceState(
      null,
      document.title,
      mkPermalinkLong(API.routes.client.shaclValidateRoute, params)
    );

    setLastParams(params);
  }

  function resetState() {
    setResult(null);
    setPermalink(null);
    setError(null);
    setProgressPercent(0);
  }

  return (
    <Container fluid={true}>
      <Row>
        <h1>{API.texts.pageHeaders.shaclValidation}</h1>
      </Row>
      <Row>
        <Col className={"half-col border-right"}>
          <Form onSubmit={handleSubmit}>
            {mkDataTabs(data, setData)}
            <Button
              variant="secondary"
              onClick={() => {
                setWithEndpoint(!withEndpoint);
                if (!withEndpoint === false) {
                  setEndpoint("");
                }
              }}
            >
              {withEndpoint ? "Remove" : "Add"} endpoint
            </Button>
            {withEndpoint ? (
              <EndpointInput
                value={endpoint}
                handleOnChange={handleEndpointChange}
              />
            ) : null}
            <hr />
            {mkShaclTabs(shacl, setShacl)}
            <hr />
            <Button
              variant="primary"
              type="submit"
              className={"btn-with-icon " + (loading ? "disabled" : "")}
              disabled={loading}
            >
              {API.texts.actionButtons.validate}
            </Button>
          </Form>
        </Col>
        {loading || result || permalink || error ? (
          <Col className={"half-col"}>
            {loading ? (
              <ProgressBar
                className="width-100"
                striped
                animated
                variant="info"
                now={progressPercent}
              />
            ) : error ? (
              <Alert variant="danger">{error}</Alert>
            ) : result ? (
              <ResultValidateShacl
                result={result}
                permalink={permalink}
                disabled={disabledLinks}
              />
            ) : null}
          </Col>
        ) : (
          <Col className={"half-col"}>
            <Alert variant="info">
              {API.texts.validationResultsWillAppearHere}
            </Alert>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default ShaclValidate;