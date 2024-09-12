package plugin

import (
	"context"
	"database/sql"
	"fmt"
	"sync"

	"github.com/go-stack/stack"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/data"

	sf "github.com/nexon/sunflake/pkg/snowflake"
	"github.com/nexon/sunflake/pkg/util/er"
	"github.com/nexon/sunflake/pkg/util/log"
)

// Make sure Datasource implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin in
// runtime. In this example datasource instance implements backend.QueryDataHandler,
// backend.CheckHealthHandler interfaces. Plugin should not implement all these
// interfaces - only those which are required for a particular task.
var (
	_ backend.QueryDataHandler      = (*Datasource)(nil)
	_ backend.CheckHealthHandler    = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
)

// NewDatasource creates a new datasource instance.
func NewDatasource(_ context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	log.InfoM("New Datasource:", settings.JSONData)

	dm, err := buildDatasourceModel(&settings)
	if err != nil {
		return nil, fmt.Errorf("failed to build the datasource model: [%v]", err)
	}

	ds, err := createDatasource(dm)
	if err != nil {
		return nil, fmt.Errorf("failed to open the Snowflake: [%v]", err)
	}

	return ds, nil
}

// Datasource is an example datasource which can respond to data queries, reports
// its health and has streaming skills.
type Datasource struct {
	db *sql.DB
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using NewSampleDatasource factory function.
func (d *Datasource) Dispose() {
	// Clean up datasource instance resources.
	log.InfoM("Dispose")
	d.db.Close()
}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifier).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	// create response struct
	response := backend.NewQueryDataResponse()

	numQueries := len(req.Queries)
	responseChan := make(chan backend.DataResponse, numQueries)
	var wg sync.WaitGroup

	// loop over queries and execute them individually.
	for _, query := range req.Queries {
		wg.Add(1)
		go d.concurrentQuery(ctx, query, responseChan, &wg)
	}

	// wait for results
	wg.Wait()
	close(responseChan)

	for result := range responseChan {
		if result.Frames != nil && len(result.Frames) > 0 {
			refID := result.Frames[0].RefID

			// save the response in a hashmap
			// based on with RefID as identifier
			response.Responses[refID] = result
		} else {
			log.ErrorM("Frames not found in the result")
		}
	}

	return response, nil
}

func (d *Datasource) concurrentQuery(ctx context.Context, query backend.DataQuery, responseChan chan<- backend.DataResponse, wg *sync.WaitGroup) {
	defer wg.Done()

	select {
	case <-ctx.Done():
		log.ErrorM("context is canceled")
	case responseChan <- d.query(ctx, query):
	}
}

func (d *Datasource) query(ctx context.Context, query backend.DataQuery) (response backend.DataResponse) {
	var qm *queryModel
	var frame *data.Frame
	var err error

	log.InfoM("Query:", query)

	defer func() {
		executedQuery := ""
		if qm != nil {
			executedQuery = qm.sql
		}

		if r := recover(); r != nil {
			call := stack.Caller(1)
			location := fmt.Sprintf("%+v", stack.Trace().TrimBelow(call).TrimRuntime())

			p := ""
			if s, ok := r.(string); ok {
				p = fmt.Sprintf("message: [%s], location: [%s]", s, location)
			} else if e, ok := r.(error); ok {
				p = fmt.Sprintf("message: [%v], location: [%s]", e, location)
			} else {
				p = fmt.Sprintf("message: [%#v], location: [%s]", r, location)
			}

			json := string(query.JSON)
			log.ErrorM(p, json, executedQuery)

			response = backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("panic: %s", p))
		}

		if frame == nil {
			fields := make([]*data.Field, 0)
			frame = data.NewFrame("response", fields...)
		}

		frame.RefID = query.RefID
		frame.Meta = &data.FrameMeta{
			Type:                data.FrameTypeTimeSeriesWide,
			ExecutedQueryString: executedQuery,
		}
		// add the frames to the response.
		response.Frames = append(response.Frames, frame)
	}()

	qm, err = buildQueryModel(&query)
	if err != nil {
		log.ErrorM("failed to query:", err)
		response = backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("json unmarshal: %v", err.Error()))
		return
	}

	table, err := qm.execute(ctx, d.db)
	if err != nil {
		log.ErrorM("failed to execute the query:", err)
		response = backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("query execution: %v", err.Error()))
		return
	}

	frame, err = qm.convertToFrame(table)
	if err != nil {
		log.ErrorM("failed to convert table to frame:", err)
		response = backend.ErrDataResponse(backend.StatusBadRequest, er.GetMessageF(err, "query execution: %v", err.Error()))
		return
	}

	return response
}

// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (d *Datasource) CheckHealth(_ context.Context, _ *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	var status = backend.HealthStatusOk
	var message = "Data source is working"

	err := sf.Select1(d.db)
	if err != nil {
		status = backend.HealthStatusError
		message = fmt.Sprintf("failed to test the connection: %v", err)
	}

	return &backend.CheckHealthResult{
		Status:  status,
		Message: message,
	}, nil
}
