package snowflake

import (
	"database/sql"
	"fmt"
)

func Query(db *sql.DB, query string) error {
	return nil
}

func Select1(db *sql.DB) error {
	query := "SELECT 1"

	rows, err := db.Query(query)
	if err != nil {
		return fmt.Errorf("failed to query [%s]: [%v]", query, err)
	}

	defer rows.Close()

	var n int
	for rows.Next() {
		err := rows.Scan(&n)

		if err != nil {
			return fmt.Errorf("failed to get result: [%v]", err)
		}
	}

	if n != 1 {
		return fmt.Errorf("failed to get 1: got [%d]", n)
	}

	return nil
}
