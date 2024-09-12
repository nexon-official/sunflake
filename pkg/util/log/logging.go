package log

import (
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

func Info(msg string, args ...interface{}) {
	log.DefaultLogger.Info(msg, args...)
}

func InfoM(msg string, args ...interface{}) {
	log.DefaultLogger.Info("======================================================================")
	log.DefaultLogger.Info(msg, args...)
	log.DefaultLogger.Info("======================================================================")
}

func Error(msg string, args ...interface{}) {
	log.DefaultLogger.Error(msg, args...)
}

func ErrorM(msg string, args ...interface{}) {
	log.DefaultLogger.Error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
	log.DefaultLogger.Error(msg, args...)
	log.DefaultLogger.Error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
}
