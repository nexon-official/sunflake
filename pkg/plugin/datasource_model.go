package plugin

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"fmt"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"

	sf "github.com/nexon/sunflake/pkg/snowflake"
	gs "github.com/snowflakedb/gosnowflake"
)

type datasourceModel struct {
	Account         string
	User            string
	Role            string
	Database        string
	Schema          string
	Warehouse       string
	Authtype        string
	Password        string
	PrivateKey      string
	ConnPoolOptions *sf.ConnectionPoolConfig
}

func buildDatasourceModel(settings *backend.DataSourceInstanceSettings) (*datasourceModel, error) {
	var dm datasourceModel

	err := json.Unmarshal(settings.JSONData, &dm)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal the backend.settings to DatasourceModel: [%s]", string(settings.JSONData))
	}

	log.DefaultLogger.Info("------------------------------------------------------------")
	log.DefaultLogger.Info(fmt.Sprintf("jsonData: [%s]", string(settings.JSONData)))
	log.DefaultLogger.Info("------------------------------------------------------------")
	// log.DefaultLogger.Info("------------------------------------------------------------")
	// log.DefaultLogger.Info(fmt.Sprintf("datasource: [%#+v]", dm))
	// log.DefaultLogger.Info("------------------------------------------------------------")

	dm.Password = settings.DecryptedSecureJSONData["password"]
	dm.PrivateKey = settings.DecryptedSecureJSONData["privatekey"]

	return &dm, nil
}

func createDatasource(dm *datasourceModel) (*Datasource, error) {
	cfg := gs.Config{
		Account:   dm.Account,
		User:      dm.User,
		Role:      dm.Role,
		Port:      443,
		Database:  dm.Database,
		Schema:    dm.Schema,
		Warehouse: dm.Warehouse,
	}

	if dm.ConnPoolOptions == nil {
		dm.ConnPoolOptions = &sf.DefaultConnPoolConfig
	}
	log.DefaultLogger.Info("------------------------------------------------------------")
	log.DefaultLogger.Info(fmt.Sprintf("ConnectionPoolConfig: [%#+v]", dm.ConnPoolOptions))
	log.DefaultLogger.Info("------------------------------------------------------------")

	switch dm.Authtype {
	case "basic":
		cfg.Password = dm.Password
	case "keypair":
		pk, err := parsePrivateKey(dm.PrivateKey)
		if err != nil {
			return nil, fmt.Errorf("failed to parse a private key: %v", err)
		}
		cfg.PrivateKey = pk
		cfg.Authenticator = gs.AuthTypeJwt
	default:
		return nil, fmt.Errorf("unsupported authentication type: %s", dm.Authtype)
	}

	db, err := sf.Open(&cfg, dm.ConnPoolOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to open the Snowflake: [%v]", err)
	}

	return &Datasource{
		db,
	}, nil
}

func parsePrivateKey(key string) (*rsa.PrivateKey, error) {
	bytes := []byte(key)

	block, _ := pem.Decode(bytes)
	if block == nil {
		return nil, fmt.Errorf("failed to parse PEM block containing the private key")
	}

	privateKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse an unencrypted private key in PKCS: %v", err)
	}

	pk, ok := privateKey.(*rsa.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("failed to convert to *rsa.PrivateKey")
	}

	return pk, nil
}
