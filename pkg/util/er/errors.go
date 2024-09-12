package er

import "fmt"

type ErrorMessage struct {
	code int
	err  error
}

func NewError(code int, err error) *ErrorMessage {
	return &ErrorMessage{code, err}
}

func NewErrorF(code int, format string, a ...any) *ErrorMessage {
	return &ErrorMessage{code, fmt.Errorf(format, a...)}
}

func (e *ErrorMessage) Error() string {
	return e.err.Error()
}

func GetMessage(err error) string {
	if em, ok := err.(*ErrorMessage); !ok {
		return err.Error()
	} else {
		return errorMessages[em.code]
	}
}

func GetMessageF(err error, format string, a ...any) string {
	if em, ok := err.(*ErrorMessage); !ok {
		return fmt.Sprintf(format, a...)
	} else {
		return errorMessages[em.code]
	}
}

const (
	ErrMustBeSortedByTime = iota + 1
)

var errorMessages = map[int]string{
	ErrMustBeSortedByTime: "If \"Data Format\" is timeseries, please set the order by a time-type column. Otherwise, change \"Data Format\" to table.",
}
