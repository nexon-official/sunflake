package snowflake

import (
	"database/sql"
	"fmt"
	"time"

	gs "github.com/snowflakedb/gosnowflake"
)

type ConnectionPoolConfig struct {
	MaxOpen     int
	MaxIdle     int
	IdleTimeout int
	MaxLifetime int
}

var DefaultConnPoolConfig = ConnectionPoolConfig{
	MaxOpen:     100,
	MaxIdle:     2,
	IdleTimeout: 180,
	MaxLifetime: 3600,
}

func Open(config *gs.Config, poolConfig *ConnectionPoolConfig) (*sql.DB, error) {
	dsn, err := gs.DSN(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create DSN from Snowflake Config: [%v]", err)
	}

	// Open may just validate its arguments without creating a connection to the database.
	// To verify that the data source name is valid, call Ping.
	// The returned DB is safe for concurrent use by multiple goroutines
	// and maintains its own pool of idle connections.
	// Thus, the Open function should be called just once.
	// It is rarely necessary to close a DB.
	db, err := sql.Open("snowflake", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Snowflake: [%v]", err)
	}

	// SetConnMaxIdleTime sets the maximum amount of time a connection may be idle.
	// Expired connections may be closed lazily before reuse.
	// If d <= 0, connections are not closed due to a connection's idle time.

	db.SetConnMaxIdleTime(time.Duration(poolConfig.IdleTimeout) * time.Second)

	// SetConnMaxLifetime sets the maximum amount of time a connection may be reused.
	// Expired connections may be closed lazily before reuse.
	// If d <= 0, connections are not closed due to a connection's age.
	db.SetConnMaxLifetime(time.Duration(poolConfig.MaxLifetime) * time.Second)

	// SetMaxIdleConns sets the maximum number of connections in the idle connection pool.
	// If n <= 0, no idle connections are retained.
	// The default max idle connections is currently 2.
	db.SetMaxIdleConns(poolConfig.MaxIdle)

	// SetMaxOpenConns sets the maximum number of open connections to the database.
	// If MaxIdleConns is greater than 0 and the new MaxOpenConns is less than MaxIdleConns,
	// then MaxIdleConns will be reduced to match the new MaxOpenConns limit.
	// If n <= 0, then there is no limit on the number of open connections.
	// The default is 0 (unlimited).
	db.SetMaxOpenConns(poolConfig.MaxOpen)

	return db, nil
}
