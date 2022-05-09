import qs from "query-string";
import React, { useContext, useEffect, useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ProgressBar from "react-bootstrap/ProgressBar";
import Row from "react-bootstrap/Row";
import { useHistory } from "react-router";
import useWebSocket, { ReadyState } from "react-use-websocket";
import API from "../API";
import PageHeader from "../components/PageHeader";
import { ApplicationContext } from "../context/ApplicationContext";
import {
  getDataText,
  InitialDataStream,
  mkDataServerParams,
  mkDataTabs,
  mkStreamDataServerParams,
  paramsFromStateData,
  paramsFromStateStreamData,
  updateStateData,
  updateStateStreamData
} from "../data/Data";
import { mkPermalinkLong } from "../Permalink";
import ResultSchemaValidate from "../results/ResultValidate";
import {
  getShapeMapText,
  InitialShapeMap,
  mkShapeMapTabs,
  mkTriggerModeServerParams,
  paramsFromStateShapeMap,
  updateStateShapeMap
} from "../shapeMap/ShapeMap";
import axios, { rootWsApi } from "../utils/networking/axiosConfig";
import { mkError } from "../utils/ResponseError";
import {
  getShexText,
  InitialShex,
  mkShexServerParams,
  mkShexTabs,
  paramsFromStateShex,
  updateStateShex
} from "./Shex";

function ShexValidate(props) {
  // Get all required data from state: data, schema, shapemap
  const {
    rdfData: [ctxData],
    addRdfData,
    shexSchema: ctxShex,
    shapeMap: ctxShapeMap,
    streamingData: ctxStreamingData,
    setStreamingData: setCtxStreamingData,
  } = useContext(ApplicationContext);

  const history = useHistory();

  const [data, setData] = useState(ctxData || addRdfData());
  const [streamData, setStreamData] = useState(
    mkStreamDataInfoFromQs() || ctxStreamingData || InitialDataStream
  );
  const [shex, setShEx] = useState(ctxShex || InitialShex);
  const [shapeMap, setShapeMap] = useState(ctxShapeMap || InitialShapeMap);

  // Shorthand enabled when the current client tab is the Stream one
  const [isStreamingValidation, setIsStreamingValidation] = useState(false);
  const [currentTab, setCurrentTab] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permalink, setPermalink] = useState(null);

  const [params, setParams] = useState(null);
  const [lastParams, setLastParams] = useState(null);

  const [progressPercent, setProgressPercent] = useState(0);

  const [disabledLinks, setDisabledLinks] = useState(false);

  const url = API.routes.server.schemaValidate;
  const wsUrl = rootWsApi + API.routes.server.schemaValidateStream;

  // Streaming validations
  const { sendMessage, lastMessage, readyState: wsReadyState } = useWebSocket(
    wsUrl,
    {
      // Should attempt reconnection on all closing events
      shouldReconnect: (closeEvent) => true,
    }
  );

  // Connection status reference
  // https://github.com/robtaussig/react-use-websocket#example-implementation
  // Memoize current connection status
  const connectionStatus = useMemo(
    () =>
      ({
        [ReadyState.CONNECTING]: "Connecting",
        [ReadyState.OPEN]: "Open",
        [ReadyState.CLOSING]: "Closing",
        [ReadyState.CLOSED]: "Closed",
        [ReadyState.UNINSTANTIATED]: "Uninstantiated",
      }[wsReadyState]),
    [wsReadyState]
  );

  // Send messages
  useEffect(() => {
    sendMessage("HI");
  }, []);

  // Debug WS connection status
  useEffect(() => {
    console.info(connectionStatus);
  }, [wsReadyState]);

  // Parse the new message, if available
  useEffect(() => {
    if (!lastMessage) return;
    const { data } = lastMessage;
    console.info(JSON.parse(data));
  }, [lastMessage]);

  // If client is in Stream Form tab, update that info
  useEffect(() => {
    setIsStreamingValidation(currentTab === API.sources.byStream);
  }, [currentTab]);

  useEffect(() => {
    if (props.location?.search) {
      const queryParams = qs.parse(props.location.search);

      // Data from URL or default
      const finalData = {
        index: 0,
        ...(updateStateData(queryParams, data) || data),
      };
      setData(finalData);

      // Shex
      const finalShex = updateStateShex(queryParams, shex) || shex;
      setShEx(finalShex);

      // Shapemap
      const finalShapeMap =
        updateStateShapeMap(queryParams, shapeMap) || shapeMap;
      setShapeMap(finalShapeMap);

      // Streaming data
      const finalStreamData = updateStateStreamData(queryParams, streamData);
      setStreamData(finalStreamData);

      // Confirm it is a streaming validation, taking the query string into accound
      const isStreaming =
        queryParams[API.queryParameters.data.source] === API.sources.byStream;
      setIsStreamingValidation(isStreaming);

      const newParams = mkParams(
        finalData,
        finalShex,
        finalShapeMap,
        finalStreamData,
        isStreaming
      );

      setParams(newParams);
      setLastParams(newParams);
    }
  }, [props.location?.search]);

  // Attempt to parse the query parameters, exclusively for streaming validation data
  function mkStreamDataInfoFromQs() {
    if (props.location?.search) {
      const queryParams = qs.parse(props.location.search);
      // Streaming data
      return updateStateStreamData(queryParams, InitialDataStream);
    }
  }

  useEffect(() => {
    if (params) {
      const isStreaming =
        (params[API.queryParameters.data.source] || isStreamingValidation) ===
        API.sources.byStream;
      const dataPresent =
        params[API.queryParameters.data.data] &&
        (params[API.queryParameters.data.source] == API.sources.byFile
          ? params[API.queryParameters.data.data].name
          : true);

      const schemaPresent =
        params[API.queryParameters.schema.schema] &&
        (params[API.queryParameters.schema.source] == API.sources.byFile
          ? params[API.queryParameters.schema.schema].name
          : true);

      const shapeMapPresent =
        params[API.queryParameters.shapeMap.shapeMap] &&
        (params[API.queryParameters.shapeMap.source] == API.sources.byFile
          ? params[API.queryParameters.shapeMap.shapeMap].name
          : true);

      const streamServerPresent = isStreamingValidation
        ? streamData.server.trim().length !== 0
        : true;

      const streamPortPresent = isStreamingValidation
        ? !!streamData.port
        : true;

      const streamTopicPresent = isStreamingValidation
        ? streamData.topic.trim().length !== 0
        : true;

      // No data was provided and a non-stream date is needed
      let error;
      if (!dataPresent && !isStreaming) error = API.texts.noProvidedRdf;
      else if (!schemaPresent) error = API.texts.noProvidedSchema;
      else if (!shapeMapPresent) error = API.texts.noProvidedShapeMap;
      else if (isStreamingValidation) {
        if (!streamServerPresent)
          error = API.texts.streamingTexts.noProvidedServer;
        else if (!streamPortPresent)
          error = API.texts.streamingTexts.noProvidedPort;
        else if (!streamTopicPresent)
          error = API.texts.streamingTexts.noProvidedTopic;
      }

      // No errors found, proceed
      if (error) setError(error);
      else {
        resetState();
        setUpHistory();
        requestValidation(isStreaming);
      }
    }
  }, [params]);

  function handleSubmit(event) {
    event.preventDefault();
    setParams(mkParams());
  }

  function mkParams(
    pData = data,
    pShex = shex,
    pShapeMap = shapeMap,
    pStreamData = streamData,
    pIsStreamingValidation = isStreamingValidation
  ) {
    const baseParams = {
      ...paramsFromStateShex(pShex),
      ...paramsFromStateShapeMap(pShapeMap), // + trigger mode
    };

    const dataParams = pIsStreamingValidation
      ? paramsFromStateStreamData(pStreamData)
      : paramsFromStateData(pData);
    return {
      ...baseParams,
      ...dataParams,
    };
  }

  async function mkServerParams(
    pData = data,
    pShex = shex,
    pShapeMap = shapeMap,
    pStreamData = streamData,
    pIsStreamingValidation = isStreamingValidation
  ) {
    const schemaServerParams = await mkShexServerParams(pShex);
    const shapeMapServerParams = await mkTriggerModeServerParams(pShapeMap);
    if (!pIsStreamingValidation) {
      return {
        [API.queryParameters.data.data]: await mkDataServerParams(pData),
        [API.queryParameters.schema.schema]: schemaServerParams,
        [API.queryParameters.schema.triggerMode]: shapeMapServerParams,
      };
    } else
      return mkStreamDataServerParams(
        pStreamData,
        schemaServerParams,
        shapeMapServerParams
      );
  }

  // Branch the logic depending on the type of validation: streaming or not
  async function requestValidation(isStreaming = isStreamingValidation) {
    // Check if we are being requested a streaming validation,
    // based on the active form Tab when the validation is requested
    if (isStreaming) streamValidate();
    else postValidate();
  }

  async function streamValidate() {
    console.info("STREAM!");
  }

  async function postValidate() {
    setLoading(true);
    setProgressPercent(30);

    try {
      const postParams = await mkServerParams();
      const { data: validateResponse } = await axios.post(url, postParams);
      setProgressPercent(60);

      setResult(validateResponse);
      setProgressPercent(80);

      setPermalink(
        mkPermalinkLong(API.routes.client.shexValidateRoute, params, true)
      );
      checkLinks();
    } catch (error) {
      setError(mkError(error, url));
    } finally {
      setLoading(false);
    }
  }

  // Disabled permalinks, etc. if the user input is too long or a file
  function checkLinks() {
    const disabled =
      getDataText(data).length +
        getShexText(shex).length +
        getShapeMapText(shapeMap).length >
      API.limits.byTextCharacterLimit
        ? API.sources.byText
        : data.activeSource === API.sources.byFile ||
          shex.activeSource === API.sources.byFile ||
          shapeMap.activeSource === API.sources.byFile
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
      history.push(
        mkPermalinkLong(API.routes.client.shexValidateRoute, lastParams)
      );
    }
    // Change current url for shareable links
    history.replace(
      mkPermalinkLong(API.routes.client.shexValidateRoute, params)
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
        <PageHeader
          title={API.texts.pageHeaders.shexValidation}
          details={API.texts.pageExplanations.shexValidation}
        />
      </Row>
      <Row>
        <Col className={"half-col border-right"}>
          <Form onSubmit={handleSubmit}>
            {mkDataTabs(data, setData, {
              allowStream: true,
              streamData,
              setStreamData,
              currentTabStore: currentTab,
              setCurrentTabStore: setCurrentTab,
            })}
            <hr />
            {mkShexTabs(shex, setShEx)}
            <hr />
            {mkShapeMapTabs(shapeMap, setShapeMap)}
            <hr />
            <Button
              variant="primary"
              type="submit"
              className={"btn-with-icon " + (loading ? "disabled" : "")}
              disabled={loading}
            >
              Validate
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
              <ResultSchemaValidate
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

export default ShexValidate;
